import { Inject, Injectable } from '@nestjs/common';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcActor,
  PurchaseOrder,
} from '../../domain/entities/purchase-order.entity';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';

// T3: PENDIENTE_ADMIN -> PRESUPUESTO_APROBADO. Any ADMINISTRACION user may
// approve any ODC, except their own (segregation of duties, R1 of
// odc-approval-self-check).
@Injectable()
export class ApproveBudgetUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  async execute(odcId: string, actor: OdcActor): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(odcId);
    if (order === null) {
      throw new OdcNotFoundError(odcId);
    }
    if (order.createdById === actor.userId) {
      throw new OdcAccessDeniedError(
        'The creator cannot approve the budget of their own ODC',
      );
    }
    const record = order.transition('approve_budget', actor.role);
    const entry = new OdcStatusHistoryEntry(
      null,
      order.id,
      record.fromStatus,
      record.toStatus,
      actor.userId,
      record.note,
      null,
    );
    return this.purchaseOrderRepository.update(order, entry);
  }
}
