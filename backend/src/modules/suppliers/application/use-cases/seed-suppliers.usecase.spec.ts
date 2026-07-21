import { Supplier } from '../../domain/entities/supplier.entity';
import { SeedSuppliersUseCase } from './seed-suppliers.usecase';

const CATALOG = [
  'Ruptela',
  'Suntech',
  'Sirium',
  'Syscom',
  'RBI Topfly',
  'ISD Telematics',
  'Tecnosinergia',
  'Tech Innovation',
  'Teltonika',
  'BSJ',
  'VAES',
  'Escort',
  'Omnicomm',
  'Cantrack',
  'Fireflux',
  'Electrica Saavedra',
  'Cohesa',
  'Georgina Masso',
  'Mario Ramirez',
  'Steren',
  'Ferreshop',
  'Ontracking GPS Remote',
];

interface SupplierRepositoryMock {
  findAll: jest.Mock;
  findByName: jest.Mock;
  create: jest.Mock;
}

function createSupplierRepositoryMock(): SupplierRepositoryMock {
  return {
    findAll: jest.fn(),
    findByName: jest.fn().mockResolvedValue(null),
    create: jest.fn((supplier: Supplier) => Promise.resolve(supplier)),
  };
}

describe('R3: seed creates one row per catalog name when none exist', () => {
  it('creates exactly the 22 catalog names, unmodified, in order', async () => {
    const repository = createSupplierRepositoryMock();
    const useCase = new SeedSuppliersUseCase(repository);

    const result = await useCase.execute();

    expect(repository.create).toHaveBeenCalledTimes(22);
    const createdNames = repository.create.mock.calls.map(
      ([supplier]: [Supplier]) => supplier.name,
    );
    expect(createdNames).toEqual(CATALOG);
    expect(result.created).toEqual(CATALOG);
    expect(result.skipped).toEqual([]);
  });
});

describe('R3: seed is idempotent when suppliers already exist', () => {
  it('skips every existing supplier without creating duplicates and without failing', async () => {
    const repository = createSupplierRepositoryMock();
    repository.findByName.mockImplementation((name: string) =>
      Promise.resolve(new Supplier('existing-id', name, null)),
    );
    const useCase = new SeedSuppliersUseCase(repository);

    const result = await useCase.execute();

    expect(repository.create).not.toHaveBeenCalled();
    expect(result.created).toEqual([]);
    expect(result.skipped).toEqual(CATALOG);
  });

  it('creates only the missing suppliers when some already exist', async () => {
    const repository = createSupplierRepositoryMock();
    repository.findByName.mockImplementation((name: string) =>
      Promise.resolve(
        name === 'RBI Topfly' || name === 'Georgina Masso'
          ? new Supplier('existing-id', name, null)
          : null,
      ),
    );
    const useCase = new SeedSuppliersUseCase(repository);

    const result = await useCase.execute();

    expect(repository.create).toHaveBeenCalledTimes(20);
    expect(result.skipped).toEqual(['RBI Topfly', 'Georgina Masso']);
    expect(result.created).not.toContain('RBI Topfly');
    expect(result.created).not.toContain('Georgina Masso');
    expect(result.created).toHaveLength(20);
  });
});
