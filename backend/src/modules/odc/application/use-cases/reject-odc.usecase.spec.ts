import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcStatus,
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { InvalidRoleTransitionError } from '../../domain/errors/invalid-role-transition.error';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { MissingTransitionDataError } from '../../domain/errors/missing-transition-data.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { RejectOdcUseCase } from './reject-odc.usecase';

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

function createUseCase(repository: RepositoryMock): RejectOdcUseCase {
  return new RejectOdcUseCase(repository);
}

const adminActor = { userId: ADMIN_ID, role: 'ADMINISTRACION' as const };
const DIRECTOR_GENERAL_ID = 'a3d1c9a2-0000-4000-8000-000000000005';
const directorGeneralActor = {
  userId: DIRECTOR_GENERAL_ID,
  role: 'DIRECTOR_GENERAL' as const,
};
const REJECTION_REASON = 'Presupuesto excedido';

describe('R4: reject transitions PENDIENTE_ADMIN to RECHAZADA for ADMINISTRACION', () => {
  it('transitions the order, persists rejectionReason and a history row with the note', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = createUseCase(repository);

    const rejected = await useCase.execute(ODC_ID, adminActor, {
      rejectionReason: REJECTION_REASON,
    });

    expect(repository.findById).toHaveBeenCalledWith(ODC_ID);
    expect(repository.update).toHaveBeenCalledTimes(1);
    const [order, entry] = repository.update.mock.calls[0] as [
      PurchaseOrder,
      OdcStatusHistoryEntry,
    ];
    expect(order.status).toBe('RECHAZADA');
    expect(order.rejectionReason).toBe(REJECTION_REASON);
    expect(entry).toBeInstanceOf(OdcStatusHistoryEntry);
    expect(entry.odcId).toBe(ODC_ID);
    expect(entry.fromStatus).toBe('PENDIENTE_ADMIN');
    expect(entry.toStatus).toBe('RECHAZADA');
    expect(entry.userId).toBe(ADMIN_ID);
    expect(entry.note).toBe(REJECTION_REASON);
    expect(rejected.status).toBe('RECHAZADA');
    expect(rejected.rejectionReason).toBe(REJECTION_REASON);
  });

  it('rejects a non-ADMINISTRACION actor from PENDIENTE_ADMIN with the role domain error and does not transition', async () => {
    const repository = createRepositoryMock();
    const order = buildOrder();
    repository.findById.mockResolvedValue(order);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute(
        ODC_ID,
        {
          userId: 'a3d1c9a2-0000-4000-8000-000000000004',
          role: 'DIRECTOR_OPS',
        },
        { rejectionReason: REJECTION_REASON },
      ),
    ).rejects.toBeInstanceOf(InvalidRoleTransitionError);
    expect(order.status).toBe('PENDIENTE_ADMIN');
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('R3: reject requires rejectionReason (defense in depth below the DTO)', () => {
  it('propagates the missing-data domain error when rejectionReason is missing and does not transition', async () => {
    const repository = createRepositoryMock();
    const order = buildOrder();
    repository.findById.mockResolvedValue(order);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute(ODC_ID, adminActor, {
        rejectionReason: undefined,
      }),
    ).rejects.toBeInstanceOf(MissingTransitionDataError);
    expect(order.status).toBe('PENDIENTE_ADMIN');
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('R5: reject rejects unknown ids, non-rejectable statuses and role mismatch on PRESUPUESTO_APROBADO', () => {
  it('rejects an unknown ODC with the not-found domain error', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute('ghost-id', adminActor, {
        rejectionReason: REJECTION_REASON,
      }),
    ).rejects.toBeInstanceOf(OdcNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it.each([
    'BORRADOR',
    'COMPRA_APROBADA',
    'PAGO_REGISTRADO',
    'EVIDENCIA_PAGO_SUBIDA',
    'COMPLETADA',
    'RECHAZADA',
  ] as OdcStatus[])(
    'rejects reject from %s with the status domain error and does not transition',
    async (status) => {
      const repository = createRepositoryMock();
      const order = buildOrder({ status });
      repository.findById.mockResolvedValue(order);
      const useCase = createUseCase(repository);

      await expect(
        useCase.execute(ODC_ID, adminActor, {
          rejectionReason: REJECTION_REASON,
        }),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
      expect(order.status).toBe(status);
      expect(repository.update).not.toHaveBeenCalled();
    },
  );

  it('rejects an ADMINISTRACION actor on PRESUPUESTO_APROBADO with the role domain error (T6 reserved to DIRECTOR_GENERAL)', async () => {
    const repository = createRepositoryMock();
    const order = buildOrder({ status: 'PRESUPUESTO_APROBADO' });
    repository.findById.mockResolvedValue(order);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute(ODC_ID, adminActor, {
        rejectionReason: REJECTION_REASON,
      }),
    ).rejects.toBeInstanceOf(InvalidRoleTransitionError);
    expect(order.status).toBe('PRESUPUESTO_APROBADO');
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('R4: reject transitions PRESUPUESTO_APROBADO to RECHAZADA for DIRECTOR_GENERAL (T6)', () => {
  it('transitions the order, persists rejectionReason and a history row with the session director general', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(
      buildOrder({ status: 'PRESUPUESTO_APROBADO' }),
    );
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = createUseCase(repository);

    const rejected = await useCase.execute(ODC_ID, directorGeneralActor, {
      rejectionReason: REJECTION_REASON,
    });

    expect(repository.findById).toHaveBeenCalledWith(ODC_ID);
    expect(repository.update).toHaveBeenCalledTimes(1);
    const [order, entry] = repository.update.mock.calls[0] as [
      PurchaseOrder,
      OdcStatusHistoryEntry,
    ];
    expect(order.status).toBe('RECHAZADA');
    expect(order.rejectionReason).toBe(REJECTION_REASON);
    expect(entry).toBeInstanceOf(OdcStatusHistoryEntry);
    expect(entry.odcId).toBe(ODC_ID);
    expect(entry.fromStatus).toBe('PRESUPUESTO_APROBADO');
    expect(entry.toStatus).toBe('RECHAZADA');
    expect(entry.userId).toBe(DIRECTOR_GENERAL_ID);
    expect(entry.note).toBe(REJECTION_REASON);
    expect(rejected.status).toBe('RECHAZADA');
    expect(rejected.rejectionReason).toBe(REJECTION_REASON);
  });
});

describe('R5: reject regression — ADMINISTRACION on PENDIENTE_ADMIN (T4) still succeeds after widening the controller roles for T6', () => {
  it('transitions the order and persists the same history row as before this feature', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = createUseCase(repository);

    const rejected = await useCase.execute(ODC_ID, adminActor, {
      rejectionReason: REJECTION_REASON,
    });

    expect(repository.update).toHaveBeenCalledTimes(1);
    const [order, entry] = repository.update.mock.calls[0] as [
      PurchaseOrder,
      OdcStatusHistoryEntry,
    ];
    expect(order.status).toBe('RECHAZADA');
    expect(entry.fromStatus).toBe('PENDIENTE_ADMIN');
    expect(entry.toStatus).toBe('RECHAZADA');
    expect(entry.userId).toBe(ADMIN_ID);
    expect(entry.note).toBe(REJECTION_REASON);
    expect(rejected.status).toBe('RECHAZADA');
  });
});

describe('R6: reject rejects role/status mismatches (DIRECTOR_GENERAL on PENDIENTE_ADMIN, ADMINISTRACION on PRESUPUESTO_APROBADO)', () => {
  it('rejects a DIRECTOR_GENERAL actor on PENDIENTE_ADMIN with the role domain error (T4 reserved to ADMINISTRACION)', async () => {
    const repository = createRepositoryMock();
    const order = buildOrder();
    repository.findById.mockResolvedValue(order);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute(ODC_ID, directorGeneralActor, {
        rejectionReason: REJECTION_REASON,
      }),
    ).rejects.toBeInstanceOf(InvalidRoleTransitionError);
    expect(order.status).toBe('PENDIENTE_ADMIN');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects an ADMINISTRACION actor on PRESUPUESTO_APROBADO with the role domain error (T6 reserved to DIRECTOR_GENERAL)', async () => {
    const repository = createRepositoryMock();
    const order = buildOrder({ status: 'PRESUPUESTO_APROBADO' });
    repository.findById.mockResolvedValue(order);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute(ODC_ID, adminActor, {
        rejectionReason: REJECTION_REASON,
      }),
    ).rejects.toBeInstanceOf(InvalidRoleTransitionError);
    expect(order.status).toBe('PRESUPUESTO_APROBADO');
    expect(repository.update).not.toHaveBeenCalled();
  });
});

describe('R7: reject rejects unknown ids and non-rejectable statuses for a DIRECTOR_GENERAL actor', () => {
  it('rejects an unknown ODC with the not-found domain error', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const useCase = createUseCase(repository);

    await expect(
      useCase.execute('ghost-id', directorGeneralActor, {
        rejectionReason: REJECTION_REASON,
      }),
    ).rejects.toBeInstanceOf(OdcNotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it.each([
    'BORRADOR',
    'COMPRA_APROBADA',
    'PAGO_REGISTRADO',
    'EVIDENCIA_PAGO_SUBIDA',
    'COMPLETADA',
    'RECHAZADA',
  ] as OdcStatus[])(
    'rejects reject from %s with the status domain error and does not transition',
    async (status) => {
      const repository = createRepositoryMock();
      const order = buildOrder({ status });
      repository.findById.mockResolvedValue(order);
      const useCase = createUseCase(repository);

      await expect(
        useCase.execute(ODC_ID, directorGeneralActor, {
          rejectionReason: REJECTION_REASON,
        }),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
      expect(order.status).toBe(status);
      expect(repository.update).not.toHaveBeenCalled();
    },
  );
});
