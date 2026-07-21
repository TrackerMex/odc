import { Inject, Injectable } from '@nestjs/common';
import type { SupplierRepository } from '../../../suppliers/domain/repositories/supplier.repository';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcActor,
  PurchaseOrder,
} from '../../domain/entities/purchase-order.entity';
import { UnknownSupplierError } from '../../domain/errors/unknown-supplier.error';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { CreateOdcDto } from '../dto/create-odc.dto';

@Injectable()
export class CreateDraftUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject('SupplierRepository')
    private readonly supplierRepository: SupplierRepository,
  ) {}

  async execute(input: CreateOdcDto, actor: OdcActor): Promise<PurchaseOrder> {
    // R5 (odc-suppliers-catalog): supplier must match a catalog name.
    const supplier = await this.supplierRepository.findByName(input.supplier);
    if (supplier === null) {
      throw new UnknownSupplierError(input.supplier);
    }
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
