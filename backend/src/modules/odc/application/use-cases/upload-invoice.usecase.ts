import { Inject, Injectable } from '@nestjs/common';
import type { FileStorageService } from '../../../files/domain/services/file-storage.service';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcActor,
  PurchaseOrder,
} from '../../domain/entities/purchase-order.entity';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';

export interface UploadInvoiceInput {
  buffer: Buffer;
  mimeType: string;
  warehouseEntryDate: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  observations?: string;
}

// Same placeholder-before-upload order as UploadPaymentEvidenceUseCase (R2,
// R3): order.transition() validates status -> role -> required data against
// this placeholder and throws before mutating anything if any check fails,
// so Cloudinary is only reached once that validation has already passed.
// The placeholder is always overwritten with the real publicId afterwards
// and is never persisted.
const PENDING_UPLOAD_PLACEHOLDER = 'pending-upload';

@Injectable()
export class UploadInvoiceUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject('FileStorageService')
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(
    odcId: string,
    actor: OdcActor,
    input: UploadInvoiceInput,
  ): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(odcId);
    if (order === null) {
      throw new OdcNotFoundError(odcId);
    }

    const record = order.transition('upload_invoice', actor.role, {
      invoiceFile: PENDING_UPLOAD_PLACEHOLDER,
      warehouseEntryDate: input.warehouseEntryDate,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      observations: input.observations,
    });

    const { publicId } = await this.fileStorageService.upload({
      buffer: input.buffer,
      mimeType: input.mimeType,
      folder: `odc/${order.odcNumber}/invoice`,
    });
    order.invoiceFile = publicId;

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
