import { Repository } from 'typeorm';
import { Supplier } from '../../domain/entities/supplier.entity';
import { SupplierOrmEntity } from '../entities/supplier.orm-entity';
import { SupplierTypeOrmRepository } from './supplier.typeorm.repository';

function createOrmRow(
  overrides: Partial<SupplierOrmEntity> = {},
): SupplierOrmEntity {
  const row = new SupplierOrmEntity();
  row.id = 'a3d1c9a2-0000-4000-8000-000000000001';
  row.name = 'Ruptela';
  row.createdAt = new Date('2026-07-19T00:00:00Z');
  return Object.assign(row, overrides);
}

interface OrmRepositoryMock {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
}

function createOrmRepositoryMock(): OrmRepositoryMock {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
}

describe('R2: SupplierTypeOrmRepository implements the domain SupplierRepository', () => {
  it('findAll returns every domain supplier mapped from the ORM rows', async () => {
    const ormRepository = createOrmRepositoryMock();
    ormRepository.find.mockResolvedValue([
      createOrmRow(),
      createOrmRow({
        id: 'a3d1c9a2-0000-4000-8000-000000000002',
        name: 'Suntech',
      }),
    ]);
    const repository = new SupplierTypeOrmRepository(
      ormRepository as unknown as Repository<SupplierOrmEntity>,
    );

    const suppliers = await repository.findAll();

    expect(suppliers).toHaveLength(2);
    expect(suppliers[0]).toBeInstanceOf(Supplier);
    expect(suppliers.map((s) => s.name)).toEqual(['Ruptela', 'Suntech']);
  });

  it('findByName returns the domain supplier mapped from the ORM row', async () => {
    const ormRepository = createOrmRepositoryMock();
    ormRepository.findOne.mockResolvedValue(createOrmRow());
    const repository = new SupplierTypeOrmRepository(
      ormRepository as unknown as Repository<SupplierOrmEntity>,
    );

    const supplier = await repository.findByName('Ruptela');

    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: { name: 'Ruptela' },
    });
    expect(supplier).toBeInstanceOf(Supplier);
    expect(supplier).toMatchObject({
      id: 'a3d1c9a2-0000-4000-8000-000000000001',
      name: 'Ruptela',
    });
  });

  it('findByName returns null when no row matches', async () => {
    const ormRepository = createOrmRepositoryMock();
    ormRepository.findOne.mockResolvedValue(null);
    const repository = new SupplierTypeOrmRepository(
      ormRepository as unknown as Repository<SupplierOrmEntity>,
    );

    await expect(repository.findByName('Nobody')).resolves.toBeNull();
  });

  it('create persists the domain supplier and returns the saved domain supplier', async () => {
    const ormRepository = createOrmRepositoryMock();
    const createdRow = createOrmRow();
    ormRepository.create.mockReturnValue(createdRow);
    ormRepository.save.mockResolvedValue(createdRow);
    const repository = new SupplierTypeOrmRepository(
      ormRepository as unknown as Repository<SupplierOrmEntity>,
    );
    const supplier = new Supplier(null, 'Ruptela', null);

    const saved = await repository.create(supplier);

    expect(ormRepository.create).toHaveBeenCalledWith({ name: 'Ruptela' });
    expect(ormRepository.save).toHaveBeenCalledWith(createdRow);
    expect(saved).toBeInstanceOf(Supplier);
    expect(saved.id).toBe('a3d1c9a2-0000-4000-8000-000000000001');
  });
});
