import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserTypeOrmRepository } from './user.typeorm.repository';

function createOrmRow(overrides: Partial<UserOrmEntity> = {}): UserOrmEntity {
  const row = new UserOrmEntity();
  row.id = 'a3d1c9a2-0000-4000-8000-000000000001';
  row.email = 'ops@odc.local';
  row.passwordHash = '$2b$10$hash';
  row.fullName = 'Operations Director';
  row.role = 'DIRECTOR_OPS';
  row.createdAt = new Date('2026-07-19T00:00:00Z');
  return Object.assign(row, overrides);
}

interface OrmRepositoryMock {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
}

function createOrmRepositoryMock(): OrmRepositoryMock {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
}

describe('R2: UserTypeOrmRepository implements the domain UserRepository', () => {
  it('findByEmail returns the domain user mapped from the ORM row', async () => {
    const ormRepository = createOrmRepositoryMock();
    ormRepository.findOne.mockResolvedValue(createOrmRow());
    const repository = new UserTypeOrmRepository(
      ormRepository as unknown as Repository<UserOrmEntity>,
    );

    const user = await repository.findByEmail('ops@odc.local');

    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'ops@odc.local' },
    });
    expect(user).toBeInstanceOf(User);
    expect(user).toMatchObject({
      id: 'a3d1c9a2-0000-4000-8000-000000000001',
      email: 'ops@odc.local',
      passwordHash: '$2b$10$hash',
      fullName: 'Operations Director',
      role: 'DIRECTOR_OPS',
    });
  });

  it('findByEmail returns null when no row matches', async () => {
    const ormRepository = createOrmRepositoryMock();
    ormRepository.findOne.mockResolvedValue(null);
    const repository = new UserTypeOrmRepository(
      ormRepository as unknown as Repository<UserOrmEntity>,
    );

    await expect(repository.findByEmail('nobody@odc.local')).resolves.toBeNull();
  });

  it('create persists the domain user and returns the saved domain user', async () => {
    const ormRepository = createOrmRepositoryMock();
    const createdRow = createOrmRow();
    ormRepository.create.mockReturnValue(createdRow);
    ormRepository.save.mockResolvedValue(createdRow);
    const repository = new UserTypeOrmRepository(
      ormRepository as unknown as Repository<UserOrmEntity>,
    );
    const user = new User(
      null,
      'ops@odc.local',
      '$2b$10$hash',
      'Operations Director',
      'DIRECTOR_OPS',
      null,
    );

    const saved = await repository.create(user);

    expect(ormRepository.create).toHaveBeenCalledWith({
      email: 'ops@odc.local',
      passwordHash: '$2b$10$hash',
      fullName: 'Operations Director',
      role: 'DIRECTOR_OPS',
    });
    expect(ormRepository.save).toHaveBeenCalledWith(createdRow);
    expect(saved).toBeInstanceOf(User);
    expect(saved.id).toBe('a3d1c9a2-0000-4000-8000-000000000001');
  });
});

describe('R10: findById resolves the user behind a session sub', () => {
  it('returns the domain user mapped from the ORM row', async () => {
    const ormRepository = createOrmRepositoryMock();
    ormRepository.findOne.mockResolvedValue(createOrmRow());
    const repository = new UserTypeOrmRepository(
      ormRepository as unknown as Repository<UserOrmEntity>,
    );

    const user = await repository.findById(
      'a3d1c9a2-0000-4000-8000-000000000001',
    );

    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'a3d1c9a2-0000-4000-8000-000000000001' },
    });
    expect(user).toBeInstanceOf(User);
    expect(user?.email).toBe('ops@odc.local');
  });

  it('returns null when no row matches', async () => {
    const ormRepository = createOrmRepositoryMock();
    ormRepository.findOne.mockResolvedValue(null);
    const repository = new UserTypeOrmRepository(
      ormRepository as unknown as Repository<UserOrmEntity>,
    );

    await expect(repository.findById('ghost-id')).resolves.toBeNull();
  });
});
