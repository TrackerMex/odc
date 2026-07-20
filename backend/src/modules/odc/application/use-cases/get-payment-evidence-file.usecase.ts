import { Inject, Injectable } from '@nestjs/common';
import type { FileStorageService } from '../../../files/domain/services/file-storage.service';
import { OdcViewer } from '../../domain/repositories/purchase-order.repository';
import { PaymentEvidenceNotFoundError } from '../../domain/errors/payment-evidence-not-found.error';
import { GetOdcUseCase } from './get-odc.usecase';

// R5/R6: reuses GetOdcUseCase for the 404/403 visibility rule (same as
// GET /api/odcs/:id) instead of duplicating it against the repository.
@Injectable()
export class GetPaymentEvidenceFileUseCase {
  constructor(
    private readonly getOdcUseCase: GetOdcUseCase,
    @Inject('FileStorageService')
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(odcId: string, viewer: OdcViewer): Promise<string> {
    const order = await this.getOdcUseCase.execute(odcId, viewer);
    if (order.paymentEvidenceFile === null) {
      throw new PaymentEvidenceNotFoundError(odcId);
    }
    return this.fileStorageService.getSignedUrl({
      publicId: order.paymentEvidenceFile,
    });
  }
}
