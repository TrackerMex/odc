import { Inject, Injectable } from '@nestjs/common';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcActor,
  PurchaseOrder,
} from '../../domain/entities/purchase-order.entity';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { CreateOdcDto } from '../dto/create-odc.dto';

@Injectable()
export class CreateDraftUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  async execute(input: CreateOdcDto, actor: OdcActor): Promise<PurchaseOrder> {
    // Only the T1 fields are read from the payload; totalCents is always
    // computed by the domain (R2).
    const { order, record } = PurchaseOrder.createDraft(
      {
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        unitPriceCents: input.unitPriceCents,
        supplier: input.supplier,
        comments: input.comments,
      },
      actor,
    );
    const openingEntry = new OdcStatusHistoryEntry(
      null,
      null,
      record.fromStatus,
      record.toStatus,
      actor.userId,
      record.note,
      null,
    );
    return this.purchaseOrderRepository.create(order, openingEntry);
  }
}
