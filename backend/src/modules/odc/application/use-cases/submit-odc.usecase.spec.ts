import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { SubmitOdcUseCase } from './submit-odc.usecase';

const OPS_ID = 'a3d1c9a2-0000-4000-8000-000000000001';
const OTHER_OPS_ID = 'a3d1c9a2-0000-4000-8000-000000000009';
const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000010';

function buildOrder(
  overrides: Partial<PurchaseOrderProps> = {},
): PurchaseOrder {
  return new PurchaseOrder({
    id: ODC_ID,
    odcNumber: 'ODC-2026-00001',
    status: 'BORRADOR',
    description: 'Cemento gris 50kg',
    quantity: 10,
    unit: 'bulto',
    unitPriceCents: 18550,
    totalCents: 185500,
    supplier: 'CEMEX',
    comments: null,
    createdById: OPS_ID,
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

function createUseCase(repository: RepositoryMock): SubmitOdcUseCase {
  return new SubmitOdcUseCase(repository);
}

const opsActor = { userId: OPS_ID, role: 'DIRECTOR_OPS' as const };

describe('R9: submit sends the creator BORRADOR to PENDIENTE_ADMIN', () => {
  it('transitions to PENDIENTE_ADMIN and persists the history row with the session user', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = createUseCase(repository);

    const submitted = await useCase.execute(ODC_ID, opsActor);

    expect(repository.findById).toHaveBeenCalledWith(ODC_ID);
    expect(repository.update).toHaveBeenCalledTimes(1);
    const [order, entry] = repository.update.mock.calls[0] as [
      PurchaseOrder,
      OdcStatusHistoryEntry,
    ];
    expect(order.status).toBe('PENDIENTE_ADMIN');
    expect(entry).toBeInstanceOf(OdcStatusHistoryEntry);
    expect(entry.odcId).toBe(ODC_ID);
    expect(entry.fromStatus).toBe('BORRADOR');
    expect(entry.toStatus).toBe('PENDIENTE_ADMIN');
    expect(entry.userId).toBe(OPS_ID);
    expect(submitted.status).toBe('PENDIENTE_ADMIN');
  });

  it('rejects a DIRECTOR_OPS who is not the creator with 403 and does not transition', async () => {
    const repository = createRepositoryMock();
    const order = buildOrder();
    repository.findById.mockResolvedValue(order);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute(ODC_ID, {
        userId: OTHER_OPS_ID,
        role: 'DIRECTOR_OPS',
      }),
    ).rejects.toBeInstanceOf(OdcAccessDeniedError);
    expect(order.status).toBe('BORRADOR');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects an unknown ODC with the not-found domain error', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const useCase = createUseCase(repository);

    await expect(useCase.execute('ghost-id', opsActor)).rejects.toBeInstanceOf(
      OdcNotFoundError,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('R10: submit resubmits a RECHAZADA keeping the previous history', () => {
  it('transitions RECHAZADA to PENDIENTE_ADMIN adding a new history row', async () => {
    const repository = createRepositoryMock();
    const previousHistory = [
      new OdcStatusHistoryEntry(
        'h1',
        ODC_ID,
        null,
        'BORRADOR',
        OPS_ID,
        null,
        new Date('2026-07-19T00:00:00Z'),
      ),
      new OdcStatusHistoryEntry(
        'h2',
        ODC_ID,
        'PENDIENTE_ADMIN',
        'RECHAZADA',
        'a3d1c9a2-0000-4000-8000-000000000002',
        'Presupuesto excedido',
        new Date('2026-07-19T01:00:00Z'),
      ),
    ];
    const order = buildOrder({
      status: 'RECHAZADA',
      rejectionReason: 'Presupuesto excedido',
      history: previousHistory,
    });
    repository.findById.mockResolvedValue(order);
    repository.update.mockImplementation((updated: PurchaseOrder) =>
      Promise.resolve(updated),
    );
    const useCase = createUseCase(repository);

    const submitted = await useCase.execute(ODC_ID, opsActor);

    expect(submitted.status).toBe('PENDIENTE_ADMIN');
    const [updatedOrder, entry] = repository.update.mock.calls[0] as [
      PurchaseOrder,
      OdcStatusHistoryEntry,
    ];
    expect(entry.fromStatus).toBe('RECHAZADA');
    expect(entry.toStatus).toBe('PENDIENTE_ADMIN');
    expect(entry.userId).toBe(OPS_ID);
    // The new row is inserted; the rejection rows already persisted are kept.
    expect(updatedOrder.history).toHaveLength(2);
    expect(updatedOrder.history[1].note).toBe('Presupuesto excedido');
  });

  it.each(['PENDIENTE_ADMIN', 'PRESUPUESTO_APROBADO', 'COMPLETADA'] as const)(
    'rejects submit from %s with the status domain error and does not transition',
    async (status) => {
      const repository = createRepositoryMock();
      const order = buildOrder({ status });
      repository.findById.mockResolvedValue(order);
      const useCase = createUseCase(repository);

      await expect(useCase.execute(ODC_ID, opsActor)).rejects.toBeInstanceOf(
        InvalidStatusTransitionError,
      );
      expect(order.status).toBe(status);
      expect(repository.update).not.toHaveBeenCalled();
    },
  );
});
