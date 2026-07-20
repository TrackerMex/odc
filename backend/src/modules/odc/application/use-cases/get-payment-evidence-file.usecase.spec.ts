import {
  OdcStatus,
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { PaymentEvidenceNotFoundError } from '../../domain/errors/payment-evidence-not-found.error';
import { GetOdcUseCase } from './get-odc.usecase';
import { GetPaymentEvidenceFileUseCase } from './get-payment-evidence-file.usecase';

const VIEWER_ID = 'a3d1c9a2-0000-4000-8000-000000000001';
const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000010';
const EVIDENCE_PUBLIC_ID = 'odc/ODC-2026-00001/evidence/abc123';
const SIGNED_URL =
  'https://res.cloudinary.com/odc-cloud/raw/authenticated/s--signature--/abc123';

function buildOrder(
  overrides: Partial<PurchaseOrderProps> = {},
): PurchaseOrder {
  return new PurchaseOrder({
    id: ODC_ID,
    odcNumber: 'ODC-2026-00001',
    status: 'EVIDENCIA_PAGO_SUBIDA',
    description: 'Cemento gris 50kg',
    quantity: 10,
    unit: 'bulto',
    unitPriceCents: 18550,
    totalCents: 185500,
    supplier: 'CEMEX',
    comments: null,
    createdById: VIEWER_ID,
    rejectionReason: null,
    paymentDate: '2026-07-20',
    paymentMethod: 'Transferencia',
    paymentReference: null,
    paymentNotes: null,
    paymentEvidenceFile: EVIDENCE_PUBLIC_ID,
    evidenceReference: null,
    invoiceFile: null,
    invoiceNumber: null,
    invoiceDate: null,
    warehouseEntryDate: null,
    observations: null,
    createdAt: new Date('2026-07-19T00:00:00Z'),
    updatedAt: new Date('2026-07-19T00:00:00Z'),
    ...overrides,
  });
}

interface FileStorageServiceMock {
  upload: jest.Mock;
  getSignedUrl: jest.Mock;
}

function createFileStorageServiceMock(): FileStorageServiceMock {
  return { upload: jest.fn(), getSignedUrl: jest.fn() };
}

function createUseCase(
  getOdcUseCase: Partial<GetOdcUseCase>,
  fileStorageService: FileStorageServiceMock,
): GetPaymentEvidenceFileUseCase {
  return new GetPaymentEvidenceFileUseCase(
    getOdcUseCase as GetOdcUseCase,
    fileStorageService,
  );
}

const viewer = { userId: VIEWER_ID, role: 'ADMINISTRACION' as const };

describe('R5: GET files/evidence resolves a short-lived signed Cloudinary URL', () => {
  it('requests the signed URL with the publicId assigned on the ODC and returns it', async () => {
    const order = buildOrder();
    const getOdcUseCase = { execute: jest.fn().mockResolvedValue(order) };
    const fileStorageService = createFileStorageServiceMock();
    fileStorageService.getSignedUrl.mockResolvedValue(SIGNED_URL);
    const useCase = createUseCase(getOdcUseCase, fileStorageService);

    const url = await useCase.execute(ODC_ID, viewer);

    expect(getOdcUseCase.execute).toHaveBeenCalledWith(ODC_ID, viewer);
    expect(fileStorageService.getSignedUrl).toHaveBeenCalledWith({
      publicId: EVIDENCE_PUBLIC_ID,
    });
    expect(url).toBe(SIGNED_URL);
  });
});

describe('R6: files/evidence rejects unknown ids, missing evidence and BORRADOR of another creator', () => {
  it('lets the not-found domain error from GetOdcUseCase bubble up without generating a URL', async () => {
    const getOdcUseCase = {
      execute: jest.fn().mockRejectedValue(new OdcNotFoundError(ODC_ID)),
    };
    const fileStorageService = createFileStorageServiceMock();
    const useCase = createUseCase(getOdcUseCase, fileStorageService);

    await expect(useCase.execute(ODC_ID, viewer)).rejects.toBeInstanceOf(
      OdcNotFoundError,
    );
    expect(fileStorageService.getSignedUrl).not.toHaveBeenCalled();
  });

  it.each([
    'BORRADOR',
    'PENDIENTE_ADMIN',
    'PRESUPUESTO_APROBADO',
    'COMPRA_APROBADA',
    'PAGO_REGISTRADO',
    'COMPLETADA',
    'RECHAZADA',
  ] as OdcStatus[])(
    'throws PaymentEvidenceNotFoundError for a %s ODC with paymentEvidenceFile null, without generating a URL',
    async (status) => {
      const order = buildOrder({ status, paymentEvidenceFile: null });
      const getOdcUseCase = { execute: jest.fn().mockResolvedValue(order) };
      const fileStorageService = createFileStorageServiceMock();
      const useCase = createUseCase(getOdcUseCase, fileStorageService);

      await expect(useCase.execute(ODC_ID, viewer)).rejects.toBeInstanceOf(
        PaymentEvidenceNotFoundError,
      );
      expect(fileStorageService.getSignedUrl).not.toHaveBeenCalled();
    },
  );

  it('lets the access-denied domain error from GetOdcUseCase (BORRADOR of another creator) bubble up without generating a URL', async () => {
    const getOdcUseCase = {
      execute: jest
        .fn()
        .mockRejectedValue(
          new OdcAccessDeniedError('This ODC draft is not visible to you'),
        ),
    };
    const fileStorageService = createFileStorageServiceMock();
    const useCase = createUseCase(getOdcUseCase, fileStorageService);

    await expect(useCase.execute(ODC_ID, viewer)).rejects.toBeInstanceOf(
      OdcAccessDeniedError,
    );
    expect(fileStorageService.getSignedUrl).not.toHaveBeenCalled();
  });
});
