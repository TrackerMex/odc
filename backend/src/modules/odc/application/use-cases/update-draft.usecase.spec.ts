import {
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { InvalidStatusTransitionError } from '../../domain/errors/invalid-status-transition.error';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { UnknownSupplierError } from '../../domain/errors/unknown-supplier.error';
import { UpdateDraftUseCase } from './update-draft.usecase';

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

interface SupplierRepositoryMock {
  findAll: jest.Mock;
  findByName: jest.Mock;
  create: jest.Mock;
}

// Defaults to "the supplier exists" so every pre-existing test (written
// before R5) keeps passing without knowing about the catalog.
function createSupplierRepositoryMock(): SupplierRepositoryMock {
  return {
    findAll: jest.fn(),
    findByName: jest.fn().mockResolvedValue({ id: 'sup-1', name: 'Holcim' }),
    create: jest.fn(),
  };
}

const opsActor = { userId: OPS_ID, role: 'DIRECTOR_OPS' as const };

describe('R11: PATCH edits T1 fields in BORRADOR/RECHAZADA recomputing the total', () => {
  it('applies the changed fields on a BORRADOR, recomputes totalCents and keeps the status', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = new UpdateDraftUseCase(
      repository,
      createSupplierRepositoryMock(),
    );

    const updated = await useCase.execute(
      ODC_ID,
      { quantity: 4, unitPriceCents: 2000, supplier: 'Holcim' },
      opsActor,
    );

    expect(repository.update).toHaveBeenCalledTimes(1);
    const [order, entry] = repository.update.mock.calls[0] as [
      PurchaseOrder,
      unknown,
    ];
    expect(order.quantity).toBe(4);
    expect(order.unitPriceCents).toBe(2000);
    expect(order.supplier).toBe('Holcim');
    expect(order.totalCents).toBe(8000);
    expect(order.status).toBe('BORRADOR');
    expect(order.description).toBe('Cemento gris 50kg');
    // Editing is not a transition: no history row is inserted.
    expect(entry).toBeUndefined();
    expect(updated.totalCents).toBe(8000);
  });

  it('applies the changed fields on a RECHAZADA without changing the status', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(
      buildOrder({ status: 'RECHAZADA', rejectionReason: 'Muy caro' }),
    );
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = new UpdateDraftUseCase(
      repository,
      createSupplierRepositoryMock(),
    );

    const updated = await useCase.execute(
      ODC_ID,
      { unitPriceCents: 15000 },
      opsActor,
    );

    expect(updated.status).toBe('RECHAZADA');
    expect(updated.unitPriceCents).toBe(15000);
    expect(updated.totalCents).toBe(150000);
  });

  it.each([
    'PENDIENTE_ADMIN',
    'PRESUPUESTO_APROBADO',
    'COMPRA_APROBADA',
    'PAGO_REGISTRADO',
    'EVIDENCIA_PAGO_SUBIDA',
    'COMPLETADA',
  ] as const)(
    'rejects the edit with the status domain error when the ODC is in %s',
    async (status) => {
      const repository = createRepositoryMock();
      const order = buildOrder({ status });
      repository.findById.mockResolvedValue(order);
      const useCase = new UpdateDraftUseCase(
        repository,
        createSupplierRepositoryMock(),
      );

      await expect(
        useCase.execute(ODC_ID, { quantity: 4 }, opsActor),
      ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
      expect(order.quantity).toBe(10);
      expect(order.status).toBe(status);
      expect(repository.update).not.toHaveBeenCalled();
    },
  );

  it('rejects a DIRECTOR_OPS who is not the creator with the access-denied error', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    const useCase = new UpdateDraftUseCase(
      repository,
      createSupplierRepositoryMock(),
    );

    await expect(
      useCase.execute(
        ODC_ID,
        { quantity: 4 },
        { userId: OTHER_OPS_ID, role: 'DIRECTOR_OPS' },
      ),
    ).rejects.toBeInstanceOf(OdcAccessDeniedError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects an unknown ODC with the not-found domain error', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const useCase = new UpdateDraftUseCase(
      repository,
      createSupplierRepositoryMock(),
    );

    await expect(
      useCase.execute('ghost-id', { quantity: 4 }, opsActor),
    ).rejects.toBeInstanceOf(OdcNotFoundError);
  });
});

describe('R5: PATCH validates supplier against the suppliers catalog when the payload brings it', () => {
  it('continues editing when supplier matches a catalog name', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const supplierRepository = createSupplierRepositoryMock();
    const useCase = new UpdateDraftUseCase(repository, supplierRepository);

    await useCase.execute(ODC_ID, { supplier: 'Holcim' }, opsActor);

    expect(supplierRepository.findByName).toHaveBeenCalledWith('Holcim');
    expect(repository.update).toHaveBeenCalledTimes(1);
  });

  it('rejects a supplier that does not match any catalog name with the domain error and updates nothing', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    const supplierRepository = createSupplierRepositoryMock();
    supplierRepository.findByName.mockResolvedValue(null);
    const useCase = new UpdateDraftUseCase(repository, supplierRepository);

    await expect(
      useCase.execute(ODC_ID, { supplier: 'Not In Catalog' }, opsActor),
    ).rejects.toBeInstanceOf(UnknownSupplierError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('does not validate the catalog when the PATCH omits supplier', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder());
    repository.update.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const supplierRepository = createSupplierRepositoryMock();
    const useCase = new UpdateDraftUseCase(repository, supplierRepository);

    await useCase.execute(ODC_ID, { quantity: 4 }, opsActor);

    expect(supplierRepository.findByName).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledTimes(1);
  });
});
