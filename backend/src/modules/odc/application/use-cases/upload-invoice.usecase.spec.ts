import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcStatus,
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { InvalidRoleTransitionError } from '../../domain/errors/invalid-role-transition.error';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { UploadInvoiceUseCase } from './upload-invoice.usecase';

const OPS_ID = 'a3d1c9a2-0000-4000-8000-000000000002';
const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000010';
const FILE_BUFFER = Buffer.from('%PDF-1.4 fake invoice');
const MIME_TYPE = 'application/pdf';

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
    createdById: 'a3d1c9a2-0000-4000-8000-000000000001',
    rejectionReason: null,
    paymentDate: '2026-07-20',
    paymentMethod: 'Transferencia',
    paymentReference: null,
    paymentNotes: null,
    paymentEvidenceFile: 'odc/ODC-2026-00001/evidence/abc123',
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

interface RepositoryMock {
  create: jest.Mock;
  update: jest.Mock;
  findById: jest.Mock;
  findAll: jest.Mock;
}

function createRepositoryMock(): RepositoryMock {
  return {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };
}

interface FileStorageServiceMock {
  upload: jest.Mock;
  getSignedUrl: jest.Mock;
}

function createFileStorageServiceMock(): FileStorageServiceMock {
  return {
    upload: jest.fn(),
    getSignedUrl: jest.fn(),
  };
}

function createUseCase(
  repository: RepositoryMock,
  fileStorageService: FileStorageServiceMock,
): UploadInvoiceUseCase {
  return new UploadInvoiceUseCase(repository, fileStorageService);
}

const opsActor = { userId: OPS_ID, role: 'DIRECTOR_OPS' as const };

describe('R2: upload-invoice transitions EVIDENCIA_PAGO_SUBIDA to COMPLETADA for DIRECTOR_OPS', () => {
  it('uploads the buffer to the odc/<odcNumber>/invoice folder and persists the publicId (never a URL)', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const fileStorageService = createFileStorageServiceMock();
    fileStorageService.upload.mockResolvedValue({
      publicId: 'odc/ODC-2026-00001/invoice/abc123',
    });
    const useCase = createUseCase(repository, fileStorageService);

    const updated = await useCase.execute(ODC_ID, opsActor, {
      buffer: FILE_BUFFER,
      mimeType: MIME_TYPE,
      warehouseEntryDate: '2026-07-21',
    });

    expect(fileStorageService.upload).toHaveBeenCalledTimes(1);
    expect(fileStorageService.upload).toHaveBeenCalledWith({
      buffer: FILE_BUFFER,
      mimeType: MIME_TYPE,
      folder: 'odc/ODC-2026-00001/invoice',
    });
    expect(repository.update).toHaveBeenCalledTimes(1);
    const [order, entry] = repository.update.mock.calls[0] as [
      PurchaseOrder,
      OdcStatusHistoryEntry,
    ];
    expect(order.status).toBe('COMPLETADA');
    expect(order.invoiceFile).toBe('odc/ODC-2026-00001/invoice/abc123');
    expect(order.invoiceFile).not.toMatch(/^https?:\/\//);
    expect(order.warehouseEntryDate).toBe('2026-07-21');
    expect(entry).toBeInstanceOf(OdcStatusHistoryEntry);
    expect(entry.odcId).toBe(ODC_ID);
    expect(entry.fromStatus).toBe('EVIDENCIA_PAGO_SUBIDA');
    expect(entry.toStatus).toBe('COMPLETADA');
    expect(entry.userId).toBe(OPS_ID);
    expect(entry.note).toBeNull();
    expect(updated.status).toBe('COMPLETADA');
  });

  it('persists invoiceNumber/invoiceDate/observations as null when the optional fields are omitted', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const fileStorageService = createFileStorageServiceMock();
    fileStorageService.upload.mockResolvedValue({ publicId: 'invoice-1' });
    const useCase = createUseCase(repository, fileStorageService);

    const updated = await useCase.execute(ODC_ID, opsActor, {
      buffer: FILE_BUFFER,
      mimeType: MIME_TYPE,
      warehouseEntryDate: '2026-07-21',
    });

    expect(updated.invoiceNumber).toBeNull();
    expect(updated.invoiceDate).toBeNull();
    expect(updated.observations).toBeNull();
  });

  it('persists invoiceNumber/invoiceDate/observations when sent', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const fileStorageService = createFileStorageServiceMock();
    fileStorageService.upload.mockResolvedValue({ publicId: 'invoice-1' });
    const useCase = createUseCase(repository, fileStorageService);

    const updated = await useCase.execute(ODC_ID, opsActor, {
      buffer: FILE_BUFFER,
      mimeType: MIME_TYPE,
      warehouseEntryDate: '2026-07-21',
      invoiceNumber: 'F-001',
      invoiceDate: '2026-07-20',
      observations: 'Entrega parcial',
    });

    expect(updated.invoiceNumber).toBe('F-001');
    expect(updated.invoiceDate).toBe('2026-07-20');
    expect(updated.observations).toBe('Entrega parcial');
  });

  it('rejects a non-DIRECTOR_OPS actor with the role domain error, without uploading or transitioning', async () => {
    const repository = createRepositoryMock();
    const order = buildOrder();
    repository.findById.mockResolvedValue(order);
    const fileStorageService = createFileStorageServiceMock();
    const useCase = createUseCase(repository, fileStorageService);

    await expect(
      useCase.execute(
        ODC_ID,
        {
          userId: 'a3d1c9a2-0000-4000-8000-000000000003',
          role: 'ADMINISTRACION',
        },
        {
          buffer: FILE_BUFFER,
          mimeType: MIME_TYPE,
          warehouseEntryDate: '2026-07-21',
        },
      ),
    ).rejects.toBeInstanceOf(InvalidRoleTransitionError);
    expect(order.status).toBe('EVIDENCIA_PAGO_SUBIDA');
    expect(order.invoiceFile).toBeNull();
    expect(fileStorageService.upload).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('R3: upload-invoice rejects unknown ids and non-EVIDENCIA_PAGO_SUBIDA statuses', () => {
  it('rejects an unknown ODC with the not-found domain error, without uploading', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const fileStorageService = createFileStorageServiceMock();
    const useCase = createUseCase(repository, fileStorageService);

    await expect(
      useCase.execute('ghost-id', opsActor, {
        buffer: FILE_BUFFER,
        mimeType: MIME_TYPE,
        warehouseEntryDate: '2026-07-21',
      }),
    ).rejects.toBeInstanceOf(OdcNotFoundError);
    expect(fileStorageService.upload).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
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
    'rejects upload-invoice from %s with the status domain error, without uploading or mutating the order',
    async (status) => {
      const repository = createRepositoryMock();
      const order = buildOrder({ status });
      repository.findById.mockResolvedValue(order);
      const fileStorageService = createFileStorageServiceMock();
      const useCase = createUseCase(repository, fileStorageService);

      await expect(
        useCase.execute(ODC_ID, opsActor, {
          buffer: FILE_BUFFER,
          mimeType: MIME_TYPE,
          warehouseEntryDate: '2026-07-21',
        }),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
      expect(order.status).toBe(status);
      expect(order.invoiceFile).toBeNull();
      expect(fileStorageService.upload).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    },
  );
});
