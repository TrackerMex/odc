import { Inject, Injectable } from '@nestjs/common';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { OdcViewer } from '../../domain/repositories/purchase-order.repository';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';

@Injectable()
export class GetOdcUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  // findById already returns the history ordered chronologically (R13); the
  // use-case only enforces the 404/403 visibility rules.
  async execute(odcId: string, viewer: OdcViewer): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(odcId);
    if (order === null) {
      throw new OdcNotFoundError(odcId);
    }
    if (order.status === 'BORRADOR' && order.createdById !== viewer.userId) {
      throw new OdcAccessDeniedError('This ODC draft is not visible to you');
    }
    return order;
  }
}
