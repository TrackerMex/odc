import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcStatus,
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { InvalidRoleTransitionError } from '../../domain/errors/invalid-role-transition.error';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { RegisterPaymentUseCase } from './register-payment.usecase';

const DIRECTOR_OPS_ID = 'a3d1c9a2-0000-4000-8000-000000000001';
const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000010';
const PAYMENT_DATE = '2026-07-20';
const PAYMENT_METHOD = 'Transferencia';

function buildOrder(
  overrides: Partial<PurchaseOrderProps> = {},
): PurchaseOrder {
  return new PurchaseOrder({
    id: ODC_ID,
    odcNumber: 'ODC-2026-00001',
    status: 'COMPRA_APROBADA',
    description: 'Cemento gris 50kg',
    quantity: 10,
    unit: 'bulto',
    unitPriceCents: 18550,
    totalCents: 185500,
    supplier: 'CEMEX',
    comments: null,
    createdById: DIRECTOR_OPS_ID,
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

function createUseCase(repository: RepositoryMock): RegisterPaymentUseCase {
  return new RegisterPaymentUseCase(repository);
}

const directorOpsActor = {
  userId: DIRECTOR_OPS_ID,
  role: 'DIRECTOR_OPS' as const,
};

describe('R2: register-payment transitions COMPRA_APROBADA to PAGO_REGISTRADO for DIRECTOR_OPS', () => {
  it('persists paymentDate/paymentMethod and a history row when optional fields are omitted', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = createUseCase(repository);

    const paid = await useCase.execute(ODC_ID, directorOpsActor, {
      paymentDate: PAYMENT_DATE,
      paymentMethod: PAYMENT_METHOD,
    });

    expect(repository.findById).toHaveBeenCalledWith(ODC_ID);
    expect(repository.update).toHaveBeenCalledTimes(1);
    const [order, entry] = repository.update.mock.calls[0] as [
      PurchaseOrder,
      OdcStatusHistoryEntry,
    ];
    expect(order.status).toBe('PAGO_REGISTRADO');
    expect(order.paymentDate).toBe(PAYMENT_DATE);
    expect(order.paymentMethod).toBe(PAYMENT_METHOD);
    expect(order.paymentReference).toBeNull();
    expect(order.paymentNotes).toBeNull();
    expect(entry).toBeInstanceOf(OdcStatusHistoryEntry);
    expect(entry.odcId).toBe(ODC_ID);
    expect(entry.fromStatus).toBe('COMPRA_APROBADA');
    expect(entry.toStatus).toBe('PAGO_REGISTRADO');
    expect(entry.userId).toBe(DIRECTOR_OPS_ID);
    expect(entry.note).toBeNull();
    expect(paid.status).toBe('PAGO_REGISTRADO');
  });

  it('persists paymentReference and paymentNotes when sent', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = createUseCase(repository);

    const paid = await useCase.execute(ODC_ID, directorOpsActor, {
      paymentDate: PAYMENT_DATE,
      paymentMethod: PAYMENT_METHOD,
      paymentReference: 'REF-001',
      paymentNotes: 'Pago parcial',
    });

    expect(paid.paymentReference).toBe('REF-001');
    expect(paid.paymentNotes).toBe('Pago parcial');
  });

  it('rejects a non-DIRECTOR_OPS actor with the role domain error and does not transition', async () => {
    const repository = createRepositoryMock();
    const order = buildOrder();
    repository.findById.mockResolvedValue(order);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute(
        ODC_ID,
        {
          userId: 'a3d1c9a2-0000-4000-8000-000000000003',
          role: 'ADMINISTRACION',
        },
        { paymentDate: PAYMENT_DATE, paymentMethod: PAYMENT_METHOD },
      ),
    ).rejects.toBeInstanceOf(InvalidRoleTransitionError);
    expect(order.status).toBe('COMPRA_APROBADA');
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('R3: register-payment rejects unknown ids and non-COMPRA_APROBADA statuses', () => {
  it('rejects an unknown ODC with the not-found domain error', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute('ghost-id', directorOpsActor, {
        paymentDate: PAYMENT_DATE,
        paymentMethod: PAYMENT_METHOD,
      }),
    ).rejects.toBeInstanceOf(OdcNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it.each([
    'BORRADOR',
    'PENDIENTE_ADMIN',
    'PRESUPUESTO_APROBADO',
    'PAGO_REGISTRADO',
    'EVIDENCIA_PAGO_SUBIDA',
    'COMPLETADA',
    'RECHAZADA',
  ] as OdcStatus[])(
    'rejects register-payment from %s with the status domain error and does not mutate the order',
    async (status) => {
      const repository = createRepositoryMock();
      const order = buildOrder({ status });
      repository.findById.mockResolvedValue(order);
      const useCase = createUseCase(repository);

      await expect(
        useCase.execute(ODC_ID, directorOpsActor, {
          paymentDate: PAYMENT_DATE,
          paymentMethod: PAYMENT_METHOD,
        }),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
      expect(order.status).toBe(status);
      expect(order.paymentDate).toBeNull();
      expect(order.paymentMethod).toBeNull();
      expect(repository.update).not.toHaveBeenCalled();
    },
  );
});
