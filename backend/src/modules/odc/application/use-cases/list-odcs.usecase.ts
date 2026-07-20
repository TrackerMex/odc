import { Inject, Injectable } from '@nestjs/common';
import { OdcStatus } from '../../domain/entities/purchase-order.entity';
import {
  OdcListFilter,
  OdcPage,
  OdcViewer,
} from '../../domain/repositories/purchase-order.repository';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';

export interface ListOdcsQuery {
  status?: OdcStatus;
  page?: number;
}

const DEFAULT_PAGE = 1;
const PAGE_SIZE = 20;

@Injectable()
export class ListOdcsUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  // Visibility of BORRADOR is enforced by the repository query (R12); the
  // use-case only builds the filter/pagination and forwards the viewer.
  async execute(query: ListOdcsQuery, viewer: OdcViewer): Promise<OdcPage> {
    const filter: OdcListFilter = { status: query.status, viewer };
    const page = query.page ?? DEFAULT_PAGE;
    return this.purchaseOrderRepository.findAll(filter, page, PAGE_SIZE);
  }
}
