import { Inject, Injectable } from '@nestjs/common';
import type { FileStorageService } from '../../../files/domain/services/file-storage.service';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcActor,
  PurchaseOrder,
} from '../../domain/entities/purchase-order.entity';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';

export interface UploadPaymentEvidenceInput {
  buffer: Buffer;
  mimeType: string;
  evidenceReference?: string;
}

// Marks the required paymentEvidenceFile slot before the real publicId is
// known. order.transition() validates role/status/required-data against
// this placeholder and throws before mutating anything if any check fails
// (R2, R3) -- Cloudinary is only reached once that validation has already
// passed, so a wrong role or a wrong status never triggers an upload call.
// The placeholder is always overwritten with the real publicId afterwards
// and is never persisted.
const PENDING_UPLOAD_PLACEHOLDER = 'pending-upload';

@Injectable()
export class UploadPaymentEvidenceUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject('FileStorageService')
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(
    odcId: string,
    actor: OdcActor,
    input: UploadPaymentEvidenceInput,
  ): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(odcId);
    if (order === null) {
      throw new OdcNotFoundError(odcId);
    }

    const record = order.transition('upload_payment_evidence', actor.role, {
      paymentEvidenceFile: PENDING_UPLOAD_PLACEHOLDER,
      evidenceReference: input.evidenceReference,
    });

    const { publicId } = await this.fileStorageService.upload({
      buffer: input.buffer,
      mimeType: input.mimeType,
      folder: `odc/${order.odcNumber}/evidence`,
    });
    order.paymentEvidenceFile = publicId;

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
