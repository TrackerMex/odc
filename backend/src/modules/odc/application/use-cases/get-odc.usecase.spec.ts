import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { GetOdcUseCase } from './get-odc.usecase';

const OPS_ID = 'a3d1c9a2-0000-4000-8000-000000000001';
const OTHER_OPS_ID = 'a3d1c9a2-0000-4000-8000-000000000009';
const ADMIN_ID = 'a3d1c9a2-0000-4000-8000-000000000002';
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

describe('R13: ODC detail with chronological history; 404 unknown, 403 foreign BORRADOR', () => {
  it('returns the ODC with its chronological history when it is visible to the viewer', async () => {
    const history = [
      new OdcStatusHistoryEntry(
        'h1',
        ODC_ID,
        null,
        'PENDIENTE_ADMIN',
        OPS_ID,
        null,
        new Date('2026-07-19T00:00:00Z'),
      ),
      new OdcStatusHistoryEntry(
        'h2',
        ODC_ID,
        'PENDIENTE_ADMIN',
        'PRESUPUESTO_APROBADO',
        ADMIN_ID,
        null,
        new Date('2026-07-19T01:00:00Z'),
      ),
    ];
    const order = buildOrder({ status: 'PRESUPUESTO_APROBADO', history });
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(order);
    const useCase = new GetOdcUseCase(repository);

    const result = await useCase.execute(ODC_ID, {
      userId: ADMIN_ID,
      role: 'ADMINISTRACION',
    });

    expect(repository.findById).toHaveBeenCalledWith(ODC_ID);
    expect(result).toBe(order);
    expect(result.history).toEqual(history);
  });

  it('is visible to any of the 3 roles once the ODC left BORRADOR', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder({ status: 'COMPLETADA' }));
    const useCase = new GetOdcUseCase(repository);

    const result = await useCase.execute(ODC_ID, {
      userId: OTHER_OPS_ID,
      role: 'DIRECTOR_GENERAL',
    });

    expect(result.status).toBe('COMPLETADA');
  });

  it('lets the creator view their own BORRADOR', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder({ status: 'BORRADOR' }));
    const useCase = new GetOdcUseCase(repository);

    const result = await useCase.execute(ODC_ID, {
      userId: OPS_ID,
      role: 'DIRECTOR_OPS',
    });

    expect(result.status).toBe('BORRADOR');
  });

  it('rejects a BORRADOR from a viewer who is not its creator with 403', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(buildOrder({ status: 'BORRADOR' }));
    const useCase = new GetOdcUseCase(repository);

    await expect(
      useCase.execute(ODC_ID, { userId: OTHER_OPS_ID, role: 'DIRECTOR_OPS' }),
    ).rejects.toBeInstanceOf(OdcAccessDeniedError);
  });

  it('responds 404 when the ODC does not exist', async () => {
    const repository = createRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const useCase = new GetOdcUseCase(repository);

    await expect(
      useCase.execute('ghost-id', { userId: OPS_ID, role: 'DIRECTOR_OPS' }),
    ).rejects.toBeInstanceOf(OdcNotFoundError);
  });
});
