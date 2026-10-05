import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  And,
  DataSource,
  Equal,
  FindOperator,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  ILike,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Not,
  Raw,
} from 'typeorm';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import { OdcConcurrentUpdateError } from '../../domain/errors/odc-concurrent-update.error';
import {
  nextOdcNumber,
  ODC_STATUSES,
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
  ExecutiveTaskPage,
  ExecutiveTableFilter,
  OdcViewer,
  PurchaseOrderRepository,
  FileUploadTicket,
  UploadField,
  FileRecoveryOptions,
  FileRecoveryOutcome,
} from '../../domain/repositories/purchase-order.repository';
import { OdcStatusHistoryOrmEntity } from '../entities/odc-status-history.orm-entity';
import { PurchaseOrderOrmEntity } from '../entities/purchase-order.orm-entity';
import {
  historyToOrmValues,
  toDomain,
  toOrmValues,
} from '../mappers/purchase-order.mapper';
import { parseFileReference } from '../../../files/domain/services/file-storage.service';
import { OdcFileUploadOrmEntity } from '../entities/odc-file-upload.orm-entity';
import { shiftMonth } from '../../domain/executive-period';

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
    uploadTicket?: FileUploadTicket,
  ): Promise<PurchaseOrder> {
    if (order.id === null) {
      throw new Error('Cannot update a purchase order without id');
    }
    return this.dataSource.transaction(async (manager) => {
      if (uploadTicket) {
        const job = await manager.findOne(OdcFileUploadOrmEntity, {
          where: { id: uploadTicket.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (
          !job ||
          job.state !== 'pending' ||
          job.orderId !== order.id ||
          job.expectedVersion !== order.version ||
          job.publicId !== uploadTicket.publicId ||
          job.field !== uploadTicket.field ||
          !order[job.field] ||
          parseFileReference(order[job.field]!).publicId !== job.publicId
        )
          throw new OdcConcurrentUpdateError();
      }
      const result = await manager.update(
        PurchaseOrderOrmEntity,
        {
          id: order.id,
          version: order.version,
          status: historyEntry?.fromStatus ?? order.status,
        },
        { ...toOrmValues(order), version: order.version + 1 },
      );
      if (result.affected !== 1) throw new OdcConcurrentUpdateError();
      // ORM hydration preserves date strings; UPDATE holds this row until commit.
      const saved = await manager.findOneOrFail(PurchaseOrderOrmEntity, {
        where: { id: order.id! },
      });
      if (historyEntry !== undefined) {
        await manager.save(
          OdcStatusHistoryOrmEntity,
          historyToOrmValues(historyEntry, saved.id),
        );
      }
      if (uploadTicket)
        await manager.update(
          OdcFileUploadOrmEntity,
          { id: uploadTicket.id },
          { state: 'associated', uploadConfirmed: true },
        );
      return toDomain(saved);
    });
  }

  async prepareFileUpload(
    order: PurchaseOrder,
    field: UploadField,
    folder: string,
  ): Promise<FileUploadTicket> {
    if (!order.id) throw new Error('Upload requires a persisted order');
    const id = randomUUID();
    return this.dataSource.manager.save(OdcFileUploadOrmEntity, {
      id,
      orderId: order.id,
      expectedVersion: order.version,
      field,
      publicId: `${folder}/${id}`,
      state: 'pending',
      uploadConfirmed: false,
      attempts: 0,
      lastOutcome: null,
      nextAttemptAt: new Date(Date.now() + 10 * 60_000),
    });
  }

  async claimFileRecovery(
    id: string,
    options: FileRecoveryOptions = {},
  ): Promise<FileUploadTicket | null> {
    return this.dataSource.transaction(async (manager) => {
      const job = await manager.findOne(OdcFileUploadOrmEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!job || ['associated', 'done', 'protected'].includes(job.state))
        return null;
      const now = Date.now();
      if (
        job.nextAttemptAt.getTime() > now &&
        (!options.immediate || job.state === 'cleaning')
      )
        return null;
      // Lock in the same order as update(ticket); fence before any provider call.
      await manager.findOne(PurchaseOrderOrmEntity, {
        where: { id: job.orderId },
        lock: { mode: 'pessimistic_write' },
      });
      const reference = Raw(
        (column) =>
          `regexp_replace(${column}, '^cloudinary:v1:[^:]+:[^:]+:', '') = :uploadPublicId`,
        { uploadPublicId: job.publicId },
      );
      const associated = await manager.exists(PurchaseOrderOrmEntity, {
        where: [{ invoiceFile: reference }, { paymentEvidenceFile: reference }],
      });
      if (associated) {
        await manager.update(
          OdcFileUploadOrmEntity,
          { id },
          { state: 'associated', uploadConfirmed: true },
        );
        return null;
      }
      job.uploadConfirmed ||= options.uploadConfirmed === true;
      job.state = 'cleaning';
      job.attempts += 1;
      job.nextAttemptAt = new Date(now + 10 * 60_000);
      await manager.save(OdcFileUploadOrmEntity, job);
      return job;
    });
  }

  async finishFileRecovery(
    id: string,
    outcome: FileRecoveryOutcome,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const job = await manager.findOne(OdcFileUploadOrmEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!job || job.state !== 'cleaning') return;
      job.lastOutcome = outcome;
      job.state =
        outcome === 'not_owned'
          ? 'protected'
          : outcome === 'deleted' ||
              (outcome === 'missing' && job.uploadConfirmed)
            ? 'done'
            : 'retry';
      // ponytail: unknown provider completion stays retryable; manual closure only after provider reconciliation.
      job.nextAttemptAt = new Date(
        Date.now() +
          Math.min(3600, 60 * 2 ** Math.min(job.attempts - 1, 6)) * 1000,
      );
      await manager.save(OdcFileUploadOrmEntity, job);
    });
  }

  async findFileRecoveries(): Promise<string[]> {
    const jobs = await this.dataSource.manager.find(OdcFileUploadOrmEntity, {
      select: { id: true },
      where: {
        state: In(['pending', 'retry', 'cleaning']),
        nextAttemptAt: LessThanOrEqual(new Date()),
      },
      order: { nextAttemptAt: 'ASC' },
      take: 20,
    });
    return jobs.map((job) => job.id);
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
    filters: ExecutiveTableFilter = {},
  ): Promise<ExecutiveDashboardData> {
    const priorityPromise = this.getExecutiveTasks(
      viewer,
      filters.page ?? 1,
      10,
      { ...filters, month: 'all' },
    );
    const actionablePromise = this.dataSource.manager.count(
      PurchaseOrderOrmEntity,
      { where: buildExecutiveTaskWhere(viewer) },
    );
    const oldestActivePromise = this.dataSource.manager.find(
      PurchaseOrderOrmEntity,
      {
        select: executiveOrderSelection(),
        where: { status: In(ACTIVE_EXECUTIVE_STATUSES) },
        order: { createdAt: 'ASC', id: 'ASC' },
        take: EXECUTIVE_DASHBOARD_LIMIT,
      },
    );
    const monthlyMetricsPromise = this.monthlyExecutiveMetrics(
      shiftMonth(month, -11),
      month,
    );
    const suppliersPromise = this.topExecutiveSuppliers(month);

    const [
      priority,
      oldestActiveRows,
      metrics,
      suppliers,
      actionableTotal,
      distribution,
    ] = await Promise.all([
      priorityPromise,
      oldestActivePromise,
      monthlyMetricsPromise,
      suppliersPromise,
      actionablePromise,
      this.createdOrderDistribution(viewer, month),
    ]);

    return {
      priority,
      actionableTotal,
      createdOrders: distribution.reduce(
        (total, item) => total + item.count,
        0,
      ),
      statusDistribution: distribution,
      monthlyTrend: Array.from({ length: 12 }, (_, index) => {
        const period = shiftMonth(month, index - 11);
        return {
          month: period,
          ...(metrics.get(period) ?? EMPTY_MONTHLY_METRICS),
        };
      }),
      pulse: {
        current: metrics.get(month) ?? EMPTY_MONTHLY_METRICS,
        previous: metrics.get(previousMonth) ?? EMPTY_MONTHLY_METRICS,
      },
      oldestActiveOrders: oldestActiveRows.map(toExecutiveDashboardOrder),
      topSuppliers: suppliers,
    };
  }

  async getExecutiveTasks(
    viewer: OdcViewer,
    page: number,
    pageSize: number,
    filters: ExecutiveTableFilter = {},
  ): Promise<ExecutiveTaskPage> {
    const direction =
      (filters.order ??
        (viewer.role === 'ADMINISTRACION' ? 'newest' : 'oldest')) === 'newest'
        ? 'DESC'
        : 'ASC';
    const [rows, total] = await this.dataSource.manager.findAndCount(
      PurchaseOrderOrmEntity,
      {
        select: executiveOrderSelection(),
        where: buildFilteredTaskWhere(viewer, filters),
        order: { createdAt: direction, id: direction },
        skip: (page - 1) * pageSize,
        take: pageSize,
      },
    );
    return {
      items: rows.map(toExecutiveDashboardOrder),
      total,
      page,
      pageSize,
    };
  }

  private async createdOrderDistribution(
    viewer: OdcViewer,
    month: string,
  ): Promise<ExecutiveDashboardData['statusDistribution']> {
    const rows = await this.dataSource.manager
      .createQueryBuilder(PurchaseOrderOrmEntity, 'odc')
      .select('odc.status', 'status')
      .addSelect('COUNT(odc.id)', 'count')
      .where('(odc.status != :draft OR odc.createdById = :viewer)', {
        draft: 'BORRADOR',
        viewer: viewer.userId,
      })
      .andWhere(
        `odc.createdAt >= (:start::timestamp AT TIME ZONE 'America/Mexico_City' AT TIME ZONE 'UTC')`,
        { start: monthStart(month) },
      )
      .andWhere(
        `odc.createdAt < (:end::timestamp AT TIME ZONE 'America/Mexico_City' AT TIME ZONE 'UTC')`,
        { end: nextMonthStart(month) },
      )
      .groupBy('odc.status')
      .getRawMany<{ status: OdcStatus; count: string }>();
    return ODC_STATUSES.map((status) => ({
      status,
      count: Number(rows.find((row) => row.status === status)?.count ?? 0),
    }));
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

function buildFilteredTaskWhere(
  viewer: OdcViewer,
  filters: ExecutiveTableFilter,
): FindOptionsWhere<PurchaseOrderOrmEntity>[] {
  const base = buildExecutiveTaskWhere(viewer);
  const branches = Array.isArray(base) ? base : [base];
  return branches.flatMap((branch) => {
    const where = { ...branch };
    if (filters.status) {
      const allowed =
        typeof branch.status === 'string'
          ? Equal(branch.status)
          : (branch.status as FindOperator<OdcStatus>);
      where.status = And(allowed, Equal(filters.status));
    }
    if (filters.month && filters.month !== 'all') {
      // Current DB defaults and Node runtime store/read these naive timestamps as UTC.
      where.createdAt = Raw(
        (alias) =>
          `${alias} >= (:creationStart::timestamp AT TIME ZONE 'America/Mexico_City' AT TIME ZONE 'UTC') AND ${alias} < (:creationEnd::timestamp AT TIME ZONE 'America/Mexico_City' AT TIME ZONE 'UTC')`,
        {
          creationStart: monthStart(filters.month),
          creationEnd: nextMonthStart(filters.month),
        },
      );
    }
    const search = filters.q?.trim();
    if (!search) return [where];
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    return [
      { ...where, odcNumber: ILike(pattern) },
      { ...where, supplier: ILike(pattern) },
    ];
  });
}
