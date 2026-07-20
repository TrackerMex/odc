import { Inject, Injectable } from '@nestjs/common';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcActor,
  PurchaseOrder,
} from '../../domain/entities/purchase-order.entity';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';

// One endpoint for T2 (BORRADOR -> PENDIENTE_ADMIN) and T10 (RECHAZADA ->
// PENDIENTE_ADMIN): the state machine picks the transition from the current
// status (R9, R10).
@Injectable()
export class SubmitOdcUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  async execute(odcId: string, actor: OdcActor): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(odcId);
    if (order === null) {
      throw new OdcNotFoundError(odcId);
    }
    if (order.createdById !== actor.userId) {
      throw new OdcAccessDeniedError('Only the creator can submit this ODC');
    }
    const record = order.transition('submit', actor.role);
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
