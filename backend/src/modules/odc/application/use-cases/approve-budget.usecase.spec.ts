import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcStatus,
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { InvalidRoleTransitionError } from '../../domain/errors/invalid-role-transition.error';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { ApproveBudgetUseCase } from './approve-budget.usecase';

const ADMIN_ID = 'a3d1c9a2-0000-4000-8000-000000000003';
const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000010';

function buildOrder(
  overrides: Partial<PurchaseOrderProps> = {},
): PurchaseOrder {
  return new PurchaseOrder({
    id: ODC_ID,
    odcNumber: 'ODC-2026-00001',
    status: 'PENDIENTE_ADMIN',
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

function createUseCase(repository: RepositoryMock): ApproveBudgetUseCase {
  return new ApproveBudgetUseCase(repository);
}

const adminActor = { userId: ADMIN_ID, role: 'ADMINISTRACION' as const };

describe('R1: approve-budget transitions PENDIENTE_ADMIN to PRESUPUESTO_APROBADO for ADMINISTRACION', () => {
  it('transitions the order and persists a history row with the session admin', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = createUseCase(repository);

    const approved = await useCase.execute(ODC_ID, adminActor);

    expect(repository.findById).toHaveBeenCalledWith(ODC_ID);
    expect(repository.update).toHaveBeenCalledTimes(1);
    const [order, entry] = repository.update.mock.calls[0] as [
      PurchaseOrder,
      OdcStatusHistoryEntry,
    ];
    expect(order.status).toBe('PRESUPUESTO_APROBADO');
    expect(entry).toBeInstanceOf(OdcStatusHistoryEntry);
    expect(entry.odcId).toBe(ODC_ID);
    expect(entry.fromStatus).toBe('PENDIENTE_ADMIN');
    expect(entry.toStatus).toBe('PRESUPUESTO_APROBADO');
    expect(entry.userId).toBe(ADMIN_ID);
    expect(entry.note).toBeNull();
    expect(approved.status).toBe('PRESUPUESTO_APROBADO');
  });

  it('rejects a non-ADMINISTRACION actor with the role domain error and does not transition', async () => {
    const repository = createRepositoryMock();
    const order = buildOrder();
    repository.findById.mockResolvedValue(order);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute(ODC_ID, {
        userId: 'a3d1c9a2-0000-4000-8000-000000000004',
        role: 'DIRECTOR_OPS',
      }),
    ).rejects.toBeInstanceOf(InvalidRoleTransitionError);
    expect(order.status).toBe('PENDIENTE_ADMIN');
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('R2: approve-budget rejects unknown ids and non-PENDIENTE_ADMIN statuses', () => {
  it('rejects an unknown ODC with the not-found domain error', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const useCase = createUseCase(repository);

    await expect(useCase.execute('ghost-id', adminActor)).rejects.toBeInstanceOf(
      OdcNotFoundError,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it.each([
    'BORRADOR',
    'PRESUPUESTO_APROBADO',
    'COMPRA_APROBADA',
    'PAGO_REGISTRADO',
    'EVIDENCIA_PAGO_SUBIDA',
    'COMPLETADA',
    'RECHAZADA',
  ] as OdcStatus[])(
    'rejects approve-budget from %s with the status domain error and does not transition',
    async (status) => {
      const repository = createRepositoryMock();
      const order = buildOrder({ status });
      repository.findById.mockResolvedValue(order);
      const useCase = createUseCase(repository);

      await expect(useCase.execute(ODC_ID, adminActor)).rejects.toBeInstanceOf(
        InvalidStatusTransitionError,
      );
      expect(order.status).toBe(status);
      expect(repository.update).not.toHaveBeenCalled();
    },
  );
});
