import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcStatus,
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { InvalidRoleTransitionError } from '../../domain/errors/invalid-role-transition.error';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { ApprovePurchaseUseCase } from './approve-purchase.usecase';

const DIRECTOR_GENERAL_ID = 'a3d1c9a2-0000-4000-8000-000000000005';
const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000010';

function buildOrder(
  overrides: Partial<PurchaseOrderProps> = {},
): PurchaseOrder {
  return new PurchaseOrder({
    id: ODC_ID,
    odcNumber: 'ODC-2026-00001',
    status: 'PRESUPUESTO_APROBADO',
    description: 'Cemento gris 50kg',
    quantity: 10,
    unit: 'bulto',
    unitPriceCents: 18550,
    totalCents: 185500,
    supplier: 'CEMEX',
    comments: null,
    createdById: 'a3d1c9a2-0000-4000-8000-000000000001',
    rejectionReason: null,
    paymentDate: null,
    paymentMethod: null,
    paymentReference: null,
    paymentNotes: null,
    paymentEvidenceFile: null,
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

function createUseCase(repository: RepositoryMock): ApprovePurchaseUseCase {
  return new ApprovePurchaseUseCase(repository);
}

const directorGeneralActor = {
  userId: DIRECTOR_GENERAL_ID,
  role: 'DIRECTOR_GENERAL' as const,
};

describe('R1: approve-purchase transitions PRESUPUESTO_APROBADO to COMPRA_APROBADA for DIRECTOR_GENERAL', () => {
  it('transitions the order and persists a history row with the session director general', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = createUseCase(repository);

    const approved = await useCase.execute(ODC_ID, directorGeneralActor);

    expect(repository.findById).toHaveBeenCalledWith(ODC_ID);
    expect(repository.update).toHaveBeenCalledTimes(1);
    const [order, entry] = repository.update.mock.calls[0] as [
      PurchaseOrder,
      OdcStatusHistoryEntry,
    ];
    expect(order.status).toBe('COMPRA_APROBADA');
    expect(entry).toBeInstanceOf(OdcStatusHistoryEntry);
    expect(entry.odcId).toBe(ODC_ID);
    expect(entry.fromStatus).toBe('PRESUPUESTO_APROBADO');
    expect(entry.toStatus).toBe('COMPRA_APROBADA');
    expect(entry.userId).toBe(DIRECTOR_GENERAL_ID);
    expect(entry.note).toBeNull();
    expect(approved.status).toBe('COMPRA_APROBADA');
  });

  it('rejects a non-DIRECTOR_GENERAL actor with the role domain error and does not transition', async () => {
    const repository = createRepositoryMock();
    const order = buildOrder();
    repository.findById.mockResolvedValue(order);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute(ODC_ID, {
        userId: 'a3d1c9a2-0000-4000-8000-000000000004',
        role: 'ADMINISTRACION',
      }),
    ).rejects.toBeInstanceOf(InvalidRoleTransitionError);
    expect(order.status).toBe('PRESUPUESTO_APROBADO');
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('R2: approve-purchase rejects unknown ids and non-PRESUPUESTO_APROBADO statuses', () => {
  it('rejects an unknown ODC with the not-found domain error', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute('ghost-id', directorGeneralActor),
    ).rejects.toBeInstanceOf(OdcNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it.each([
    'BORRADOR',
    'PENDIENTE_ADMIN',
    'COMPRA_APROBADA',
    'PAGO_REGISTRADO',
    'EVIDENCIA_PAGO_SUBIDA',
    'COMPLETADA',
    'RECHAZADA',
  ] as OdcStatus[])(
    'rejects approve-purchase from %s with the status domain error and does not transition',
    async (status) => {
      const repository = createRepositoryMock();
      const order = buildOrder({ status });
      repository.findById.mockResolvedValue(order);
      const useCase = createUseCase(repository);

      await expect(
        useCase.execute(ODC_ID, directorGeneralActor),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
      expect(order.status).toBe(status);
      expect(repository.update).not.toHaveBeenCalled();
    },
  );
});
