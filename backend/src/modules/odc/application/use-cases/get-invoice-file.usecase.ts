import { Inject, Injectable } from '@nestjs/common';
import type { FileStorageService } from '../../../files/domain/services/file-storage.service';
import { OdcViewer } from '../../domain/repositories/purchase-order.repository';
import { InvoiceNotFoundError } from '../../domain/errors/invoice-not-found.error';
import { GetOdcUseCase } from './get-odc.usecase';

// R5/R6: reuses GetOdcUseCase for the 404/403 visibility rule (same as
// GET :id), mirroring GetPaymentEvidenceFileUseCase for the invoiceFile
// field instead of paymentEvidenceFile.
@Injectable()
export class GetInvoiceFileUseCase {
  constructor(
    private readonly getOdcUseCase: GetOdcUseCase,
    @Inject('FileStorageService')
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(odcId: string, viewer: OdcViewer): Promise<string> {
    const order = await this.getOdcUseCase.execute(odcId, viewer);
    if (order.invoiceFile === null) {
      throw new InvoiceNotFoundError(odcId);
    }
    return this.fileStorageService.getSignedUrl({
      publicId: order.invoiceFile,
    });
  }
}
