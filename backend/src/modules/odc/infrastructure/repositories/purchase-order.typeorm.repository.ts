import { Injectable } from '@nestjs/common';
import { DataSource, FindOptionsWhere, Like, Not } from 'typeorm';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  nextOdcNumber,
  OdcStatus,
  PurchaseOrder,
} from '../../domain/entities/purchase-order.entity';
import {
  OdcListFilter,
  OdcPage,
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
