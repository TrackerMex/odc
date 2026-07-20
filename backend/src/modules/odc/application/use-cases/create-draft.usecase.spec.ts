import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { InvalidRoleTransitionError } from '../../domain/errors/invalid-role-transition.error';
import { CreateOdcDto } from '../dto/create-odc.dto';
import { CreateDraftUseCase } from './create-draft.usecase';

const OPS_ID = 'a3d1c9a2-0000-4000-8000-000000000001';
const ADMIN_ID = 'a3d1c9a2-0000-4000-8000-000000000002';

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

function buildDto(): CreateOdcDto {
  const dto = new CreateOdcDto();
  dto.description = 'Cemento gris 50kg';
  dto.quantity = 10;
  dto.unit = 'bulto';
  dto.unitPriceCents = 18550;
  dto.supplier = 'CEMEX';
  dto.comments = 'Entrega en obra';
  return dto;
}

describe('R7: create draft use-case persists a BORRADOR for its creator', () => {
  it('creates the ODC in BORRADOR with creator, computed total and opening history row', async () => {
    const repository = createRepositoryMock();
    repository.create.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = new CreateDraftUseCase(repository);

    const created = await useCase.execute(buildDto(), {
      userId: OPS_ID,
      role: 'DIRECTOR_OPS',
    });

    expect(repository.create).toHaveBeenCalledTimes(1);
    const [order, entry] = repository.create.mock.calls[0] as [
      PurchaseOrder,
      OdcStatusHistoryEntry,
    ];
    expect(order).toBeInstanceOf(PurchaseOrder);
    expect(order.status).toBe('BORRADOR');
    expect(order.createdById).toBe(OPS_ID);
    expect(order.totalCents).toBe(185500);
    expect(order.odcNumber).toBeNull();
    expect(order.comments).toBe('Entrega en obra');
    expect(entry).toBeInstanceOf(OdcStatusHistoryEntry);
    expect(entry.fromStatus).toBeNull();
    expect(entry.toStatus).toBe('BORRADOR');
    expect(entry.userId).toBe(OPS_ID);
    expect(created.status).toBe('BORRADOR');
  });

  it('rejects a non DIRECTOR_OPS actor with the role domain error and creates nothing', async () => {
    const repository = createRepositoryMock();
    const useCase = new CreateDraftUseCase(repository);

    await expect(
      useCase.execute(buildDto(), {
        userId: ADMIN_ID,
        role: 'ADMINISTRACION',
      }),
    ).rejects.toBeInstanceOf(InvalidRoleTransitionError);
    expect(repository.create).not.toHaveBeenCalled();
  });
});

describe('R2: a totalCents smuggled into the create payload never reaches the ODC', () => {
  it('ignores the malicious totalCents and persists the domain-computed one', async () => {
    const repository = createRepositoryMock();
    repository.create.mockImplementation((order: PurchaseOrder) =>
      Promise.resolve(order),
    );
    const useCase = new CreateDraftUseCase(repository);
    const maliciousDto = Object.assign(buildDto(), { totalCents: 1 });

    const created = await useCase.execute(maliciousDto, {
      userId: OPS_ID,
      role: 'DIRECTOR_OPS',
    });

    expect(created.totalCents).toBe(185500);
    const [order] = repository.create.mock.calls[0] as [PurchaseOrder];
    expect(order.totalCents).toBe(185500);
  });
});
