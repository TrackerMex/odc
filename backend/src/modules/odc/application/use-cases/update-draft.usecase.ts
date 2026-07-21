import { Inject, Injectable } from '@nestjs/common';
import type { SupplierRepository } from '../../../suppliers/domain/repositories/supplier.repository';
import {
  OdcActor,
  PurchaseOrder,
} from '../../domain/entities/purchase-order.entity';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { UnknownSupplierError } from '../../domain/errors/unknown-supplier.error';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { UpdateOdcDto } from '../dto/update-odc.dto';

@Injectable()
export class UpdateDraftUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject('SupplierRepository')
    private readonly supplierRepository: SupplierRepository,
  ) {}

  async execute(
    odcId: string,
    input: UpdateOdcDto,
    actor: OdcActor,
  ): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(odcId);
    if (order === null) {
      throw new OdcNotFoundError(odcId);
    }
    if (order.createdById !== actor.userId) {
      throw new OdcAccessDeniedError('Only the creator can edit this ODC');
    }
    // R5 (odc-suppliers-catalog): only validate when the PATCH brings a
    // supplier value.
    if (input.supplier !== undefined) {
      const supplier = await this.supplierRepository.findByName(input.supplier);
      if (supplier === null) {
        throw new UnknownSupplierError(input.supplier);
      }
    }
    // The domain applies the T1 fields, enforces the editable statuses and
    // recomputes totalCents (R2, R11).
    order.edit({
      description: input.description,
      quantity: input.quantity,
      unit: input.unit,
      unitPriceCents: input.unitPriceCents,
      supplier: input.supplier,
      comments: input.comments,
    });
    return this.purchaseOrderRepository.update(order);
  }
}
