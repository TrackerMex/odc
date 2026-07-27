import { Injectable } from '@nestjs/common';
import {
  And,
  DataSource,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  LessThan,
  Like,
  MoreThanOrEqual,
  Not,
} from 'typeorm';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  nextOdcNumber,
  OdcStatus,
  PurchaseOrder,
} from '../../domain/entities/purchase-order.entity';
import {
  OdcListFilter,
  OdcPage,
  MonthlyPurchase,
  MONTHLY_PURCHASE_STATUSES,
  ExecutiveDashboardData,
  ExecutiveDashboardOrder,
  OdcViewer,
  PurchaseOrderRepository,
} from '../../domain/repositories/purchase-order.repository';
import { OdcStatusHistoryOrmEntity } from '../entities/odc-status-history.orm-entity';
import { PurchaseOrderOrmEntity } from '../entities/purchase-order.orm-entity';
import {
  historyToOrmValues,
  toDomain,
  toOrmValues,
} from '../mappers/purchase-order.mapper';

@Injectable()
export class PurchaseOrderTypeOrmRepository implements PurchaseOrderRepository {
  constructor(private readonly dataSource: DataSource) {}

  // The UNIQUE constraint on odcNumber resolves concurrent creations that
  // computed the same number: the loser retries with the next one (R6).
  async create(
    order: PurchaseOrder,
    historyEntry: OdcStatusHistoryEntry,
  ): Promise<PurchaseOrder> {
    for (let attempt = 1; attempt <= CREATE_MAX_ATTEMPTS; attempt++) {
      try {
        return await this.dataSource.transaction(async (manager) => {
          const year = new Date().getFullYear();
          const [latestInYear] = await manager.find(PurchaseOrderOrmEntity, {
            where: { odcNumber: Like(`ODC-${year}-%`) },
            order: { odcNumber: 'DESC' },
            take: 1,
          });
          order.odcNumber = nextOdcNumber(
            year,
            latestInYear?.odcNumber ?? null,
          );
          const saved = await manager.save(
            PurchaseOrderOrmEntity,
            toOrmValues(order),
          );
          await manager.save(
            OdcStatusHistoryOrmEntity,
            historyToOrmValues(historyEntry, saved.id),
          );
          return toDomain(saved);
        });
      } catch (error) {
        if (attempt === CREATE_MAX_ATTEMPTS || !isUniqueViolation(error)) {
          throw error;
        }
      }
    }
    throw new Error('ODC number assignment exhausted its retries');
  }

  async update(
    order: PurchaseOrder,
    historyEntry?: OdcStatusHistoryEntry,
  ): Promise<PurchaseOrder> {
    if (order.id === null) {
      throw new Error('Cannot update a purchase order without id');
    }
    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(
        PurchaseOrderOrmEntity,
        toOrmValues(order),
      );
      if (historyEntry !== undefined) {
        await manager.save(
          OdcStatusHistoryOrmEntity,
          historyToOrmValues(historyEntry, saved.id),
        );
      }
      return toDomain(saved);
    });
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const row = await this.dataSource.manager.findOne(PurchaseOrderOrmEntity, {
      where: { id },
    });
    if (row === null) {
      return null;
    }
    const historyRows = await this.dataSource.manager.find(
      OdcStatusHistoryOrmEntity,
      { where: { odcId: id }, order: { createdAt: 'ASC' } },
    );
    return toDomain(row, historyRows);
  }

  async findAll(
    filter: OdcListFilter,
    page: number,
    pageSize: number,
  ): Promise<OdcPage> {
    const [rows, total] = await this.dataSource.manager.findAndCount(
      PurchaseOrderOrmEntity,
      {
        where: buildVisibilityWhere(filter),
        order: { createdAt: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      },
    );
    return {
      items: rows.map((row) => toDomain(row)),
      total,
      page,
      pageSize,
    };
  }

  async findMonthlyPurchases(month: string): Promise<MonthlyPurchase[]> {
    const [year, monthNumber] = month.split('-').map(Number);
    const start = `${year}-${String(monthNumber).padStart(2, '0')}-01`;
    const next = new Date(Date.UTC(year, monthNumber, 1));
    const nextStart = `${next.getUTCFullYear()}-${String(
      next.getUTCMonth() + 1,
    ).padStart(2, '0')}-01`;
    const rows = await this.dataSource.manager.find(PurchaseOrderOrmEntity, {
      where: {
        status: In(MONTHLY_PURCHASE_STATUSES),
        paymentDate: And(MoreThanOrEqual(start), LessThan(nextStart)),
      },
      relations: { createdBy: true },
      order: { paymentDate: 'ASC', odcNumber: 'ASC' },
    });
    return rows.map((row) => ({
      id: row.id,
      odcNumber: row.odcNumber,
      status: row.status,
      requesterName: row.createdBy?.fullName ?? null,
      description: row.description,
      supplier: row.supplier,
      quantity: row.quantity,
      unit: row.unit,
      totalCents: row.totalCents,
      paymentDate: row.paymentDate!,
      warehouseEntryDate: row.warehouseEntryDate ?? null,
      hasInvoice: row.invoiceFile !== null,
      comments: row.comments ?? null,
      observations: row.observations ?? null,
    }));
  }

  async getExecutiveDashboard(
    viewer: OdcViewer,
    month: string,
    previousMonth: string,
  ): Promise<ExecutiveDashboardData> {
    const priorityPromise = this.dataSource.manager.findAndCount(
      PurchaseOrderOrmEntity,
      {
        select: executiveOrderSelection(),
        where: buildExecutiveTaskWhere(viewer),
        order: { createdAt: 'ASC' },
        take: EXECUTIVE_DASHBOARD_LIMIT,
      },
    );
    const oldestActivePromise = this.dataSource.manager.find(
      PurchaseOrderOrmEntity,
      {
        select: executiveOrderSelection(),
        where: { status: In(ACTIVE_EXECUTIVE_STATUSES) },
        order: { createdAt: 'ASC' },
        take: EXECUTIVE_DASHBOARD_LIMIT,
      },
    );
    const monthlyMetricsPromise = this.monthlyExecutiveMetrics(
      previousMonth,
      month,
    );
    const suppliersPromise = this.topExecutiveSuppliers(month);

    const [
      [priorityRows, priorityTotal],
      oldestActiveRows,
      metrics,
      suppliers,
    ] = await Promise.all([
      priorityPromise,
      oldestActivePromise,
      monthlyMetricsPromise,
      suppliersPromise,
    ]);

    return {
      priority: {
        total: priorityTotal,
        items: priorityRows.map(toExecutiveDashboardOrder),
      },
      pulse: {
        current: metrics.get(month) ?? EMPTY_MONTHLY_METRICS,
        previous: metrics.get(previousMonth) ?? EMPTY_MONTHLY_METRICS,
      },
      oldestActiveOrders: oldestActiveRows.map(toExecutiveDashboardOrder),
      topSuppliers: suppliers,
    };
  }

  private async monthlyExecutiveMetrics(
    previousMonth: string,
    month: string,
  ): Promise<Map<string, ExecutiveMonthlyMetrics>> {
    const rows = await this.dataSource.manager
      .createQueryBuilder(PurchaseOrderOrmEntity, 'odc')
      .select("TO_CHAR(odc.paymentDate, 'YYYY-MM')", 'month')
      .addSelect('COUNT(odc.id)', 'purchaseCount')
      .addSelect('COALESCE(SUM(odc.totalCents), 0)', 'totalCents')
      .where('odc.status IN (:...statuses)', {
        statuses: MONTHLY_PURCHASE_STATUSES,
      })
      .andWhere('odc.paymentDate >= :start', {
        start: monthStart(previousMonth),
      })
      .andWhere('odc.paymentDate < :end', { end: nextMonthStart(month) })
      .groupBy("TO_CHAR(odc.paymentDate, 'YYYY-MM')")
      .getRawMany<ExecutiveMonthlyMetricsRaw>();

    return new Map(
      rows.map((row) => [
        row.month,
        {
          purchaseCount: Number(row.purchaseCount),
          totalCents: Number(row.totalCents),
        },
      ]),
    );
  }

  private async topExecutiveSuppliers(
    month: string,
  ): Promise<ExecutiveDashboardData['topSuppliers']> {
    const rows = await this.dataSource.manager
      .createQueryBuilder(PurchaseOrderOrmEntity, 'odc')
      .select('odc.supplier', 'supplier')
      .addSelect('COUNT(odc.id)', 'purchaseCount')
      .addSelect('COALESCE(SUM(odc.totalCents), 0)', 'totalCents')
      .where('odc.status IN (:...statuses)', {
        statuses: MONTHLY_PURCHASE_STATUSES,
      })
      .andWhere('odc.paymentDate >= :start', { start: monthStart(month) })
      .andWhere('odc.paymentDate < :end', { end: nextMonthStart(month) })
      .groupBy('odc.supplier')
      .orderBy('SUM(odc.totalCents)', 'DESC')
      .addOrderBy('odc.supplier', 'ASC')
      .limit(EXECUTIVE_DASHBOARD_LIMIT)
      .getRawMany<ExecutiveSupplierRaw>();

    return rows.map((row) => ({
      supplier: row.supplier,
      purchaseCount: Number(row.purchaseCount),
      totalCents: Number(row.totalCents),
    }));
  }
}

const EXECUTIVE_DASHBOARD_LIMIT = 5;
const ACTIVE_EXECUTIVE_STATUSES: OdcStatus[] = [
  'PENDIENTE_ADMIN',
  'PRESUPUESTO_APROBADO',
  'COMPRA_APROBADA',
  'PAGO_REGISTRADO',
  'EVIDENCIA_PAGO_SUBIDA',
];
const EMPTY_MONTHLY_METRICS = { purchaseCount: 0, totalCents: 0 };

interface ExecutiveMonthlyMetrics {
  purchaseCount: number;
  totalCents: number;
}

interface ExecutiveMonthlyMetricsRaw {
  month: string;
  purchaseCount: string;
  totalCents: string;
}

interface ExecutiveSupplierRaw {
  supplier: string;
  purchaseCount: string;
  totalCents: string;
}

function executiveOrderSelection(): FindOptionsSelect<PurchaseOrderOrmEntity> {
  return {
    id: true,
    odcNumber: true,
    status: true,
    description: true,
    supplier: true,
    totalCents: true,
    createdAt: true,
  };
}

function toExecutiveDashboardOrder(
  row: PurchaseOrderOrmEntity,
): ExecutiveDashboardOrder {
  return {
    id: row.id,
    odcNumber: row.odcNumber,
    status: row.status,
    description: row.description,
    supplier: row.supplier,
    totalCents: row.totalCents,
    createdAt: row.createdAt,
  };
}

function monthStart(month: string): string {
  return `${month}-01`;
}

function nextMonthStart(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const next = new Date(Date.UTC(year, monthNumber, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(
    2,
    '0',
  )}-01`;
}

const CREATE_MAX_ATTEMPTS = 3;
const POSTGRES_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  const driverError = (error as { driverError?: { code?: string } })
    ?.driverError;
  return driverError?.code === POSTGRES_UNIQUE_VIOLATION;
}

// BORRADOR rows are only visible to their creator; every other status is
// visible to the 3 roles. The condition lives in the query so pagination
// and totals stay correct (R12).
function buildVisibilityWhere(
  filter: OdcListFilter,
):
  | FindOptionsWhere<PurchaseOrderOrmEntity>
  | FindOptionsWhere<PurchaseOrderOrmEntity>[] {
  if (filter.status !== undefined) {
    return filter.status === 'BORRADOR'
      ? { status: filter.status, createdById: filter.viewer.userId }
      : { status: filter.status };
  }
  return [
    { status: Not<OdcStatus>('BORRADOR') },
    { createdById: filter.viewer.userId },
  ];
}

function buildExecutiveTaskWhere(
  viewer: OdcViewer,
):
  | FindOptionsWhere<PurchaseOrderOrmEntity>
  | FindOptionsWhere<PurchaseOrderOrmEntity>[] {
  switch (viewer.role) {
    case 'DIRECTOR_OPS':
      return [
        {
          status: In<OdcStatus>(['BORRADOR', 'RECHAZADA']),
          createdById: viewer.userId,
        },
        {
          status: In<OdcStatus>(['COMPRA_APROBADA', 'EVIDENCIA_PAGO_SUBIDA']),
        },
      ];
    case 'ADMINISTRACION':
      return {
        status: In<OdcStatus>(['PENDIENTE_ADMIN', 'PAGO_REGISTRADO']),
      };
    case 'DIRECTOR_GENERAL':
      return { status: 'PRESUPUESTO_APROBADO' };
  }
}
