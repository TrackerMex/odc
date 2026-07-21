import { Supplier } from '../../domain/entities/supplier.entity';
import { ListSuppliersUseCase } from './list-suppliers.usecase';

interface SupplierRepositoryMock {
  findAll: jest.Mock;
  findByName: jest.Mock;
  create: jest.Mock;
}

function createSupplierRepositoryMock(): SupplierRepositoryMock {
  return {
    findAll: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
  };
}

describe('R4: list suppliers use-case returns the full catalog alphabetically', () => {
  it('sorts the repository result alphabetically by name', async () => {
    const repository = createSupplierRepositoryMock();
    repository.findAll.mockResolvedValue([
      new Supplier('id-3', 'Suntech', null),
      new Supplier('id-1', 'BSJ', null),
      new Supplier('id-2', 'Fireflux', null),
    ]);
    const useCase = new ListSuppliersUseCase(repository);

    const suppliers = await useCase.execute();

    expect(suppliers.map((s) => s.name)).toEqual([
      'BSJ',
      'Fireflux',
      'Suntech',
    ]);
  });

  it('returns an empty list when the catalog is empty', async () => {
    const repository = createSupplierRepositoryMock();
    repository.findAll.mockResolvedValue([]);
    const useCase = new ListSuppliersUseCase(repository);

    await expect(useCase.execute()).resolves.toEqual([]);
  });
});
