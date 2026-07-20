import { Inject, Injectable } from '@nestjs/common';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcActor,
  PurchaseOrder,
  TransitionData,
} from '../../domain/entities/purchase-order.entity';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';

// T4 (PENDIENTE_ADMIN -> RECHAZADA) via the shared 'reject' domain action;
// the domain also models T6 (PRESUPUESTO_APROBADO -> RECHAZADA, role
// DIRECTOR_GENERAL) under the same action, mechanically reachable once
// feature 5 widens the controller's @Roles metadata (R4, R5).
@Injectable()
export class RejectOdcUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  async execute(
    odcId: string,
    actor: OdcActor,
    data: TransitionData,
  ): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(odcId);
    if (order === null) {
      throw new OdcNotFoundError(odcId);
    }
    const record = order.transition('reject', actor.role, data);
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
