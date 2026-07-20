import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import {
  OdcListFilter,
  OdcPage,
} from '../../domain/repositories/purchase-order.repository';
import { ListOdcsUseCase } from './list-odcs.usecase';

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

function emptyPage(page: number): OdcPage {
  return { items: [], total: 0, page, pageSize: 20 };
}

describe('R12: paginated list where BORRADOR is only visible to its creator', () => {
  it('passes the session viewer to the repository so the query filters foreign drafts', async () => {
    const repository = createRepositoryMock();
    repository.findAll.mockResolvedValue(emptyPage(1));
    const useCase = new ListOdcsUseCase(repository);

    await useCase.execute({}, { userId: ADMIN_ID, role: 'ADMINISTRACION' });

    expect(repository.findAll).toHaveBeenCalledTimes(1);
    const [filter] = repository.findAll.mock.calls[0] as [OdcListFilter];
    expect(filter.viewer).toEqual({
      userId: ADMIN_ID,
      role: 'ADMINISTRACION',
    });
    expect(filter.status).toBeUndefined();
  });

  it('forwards the status filter when the query includes it', async () => {
    const repository = createRepositoryMock();
    repository.findAll.mockResolvedValue(emptyPage(1));
    const useCase = new ListOdcsUseCase(repository);

    await useCase.execute(
      { status: 'PENDIENTE_ADMIN' },
      { userId: OPS_ID, role: 'DIRECTOR_OPS' },
    );

    const [filter] = repository.findAll.mock.calls[0] as [OdcListFilter];
    expect(filter.status).toBe('PENDIENTE_ADMIN');
  });

  it('defaults to page 1 with pageSize 20', async () => {
    const repository = createRepositoryMock();
    repository.findAll.mockResolvedValue(emptyPage(1));
    const useCase = new ListOdcsUseCase(repository);

    await useCase.execute({}, { userId: OPS_ID, role: 'DIRECTOR_OPS' });

    const [, page, pageSize] = repository.findAll.mock.calls[0] as [
      OdcListFilter,
      number,
      number,
    ];
    expect(page).toBe(1);
    expect(pageSize).toBe(20);
  });

  it('requests the asked page keeping pageSize 20', async () => {
    const repository = createRepositoryMock();
    repository.findAll.mockResolvedValue(emptyPage(3));
    const useCase = new ListOdcsUseCase(repository);

    await useCase.execute(
      { page: 3 },
      { userId: OPS_ID, role: 'DIRECTOR_OPS' },
    );

    const [, page, pageSize] = repository.findAll.mock.calls[0] as [
      OdcListFilter,
      number,
      number,
    ];
    expect(page).toBe(3);
    expect(pageSize).toBe(20);
  });

  it('returns the { items, total, page, pageSize } shape from the repository', async () => {
    const repository = createRepositoryMock();
    const items = [{ status: 'PENDIENTE_ADMIN' } as PurchaseOrder];
    repository.findAll.mockResolvedValue({
      items,
      total: 41,
      page: 2,
      pageSize: 20,
    });
    const useCase = new ListOdcsUseCase(repository);

    const result = await useCase.execute(
      { page: 2 },
      { userId: OPS_ID, role: 'DIRECTOR_OPS' },
    );

    expect(result).toEqual({ items, total: 41, page: 2, pageSize: 20 });
  });
});
