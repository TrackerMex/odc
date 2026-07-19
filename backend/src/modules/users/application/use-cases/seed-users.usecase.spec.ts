import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../domain/entities/user.entity';
import { SeedUsersUseCase } from './seed-users.usecase';

interface UserRepositoryMock {
  findByEmail: jest.Mock;
  create: jest.Mock;
}

function createUserRepositoryMock(): UserRepositoryMock {
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn((user: User) => Promise.resolve(user)),
  };
}

function createConfigServiceMock(
  env: Record<string, string | undefined>,
): ConfigService {
  return {
    get: jest.fn((key: string) => env[key]),
  } as unknown as ConfigService;
}

describe('R3: seed creates the 3 users hashed with bcrypt', () => {
  it('creates exactly ops, admin and dg with their roles when none exist', async () => {
    const repository = createUserRepositoryMock();
    const useCase = new SeedUsersUseCase(
      repository,
      createConfigServiceMock({ SEED_PASSWORD: 'env-secret' }),
    );

    await useCase.execute();

    expect(repository.create).toHaveBeenCalledTimes(3);
    const createdUsers = repository.create.mock.calls.map(
      ([user]: [User]) => user,
    );
    expect(
      createdUsers.map((user) => ({ email: user.email, role: user.role })),
    ).toEqual([
      { email: 'ops@odc.local', role: 'DIRECTOR_OPS' },
      { email: 'admin@odc.local', role: 'ADMINISTRACION' },
      { email: 'dg@odc.local', role: 'DIRECTOR_GENERAL' },
    ]);
  });

  it('hashes SEED_PASSWORD with bcrypt into each passwordHash', async () => {
    const repository = createUserRepositoryMock();
    const useCase = new SeedUsersUseCase(
      repository,
      createConfigServiceMock({ SEED_PASSWORD: 'env-secret' }),
    );

    await useCase.execute();

    for (const [user] of repository.create.mock.calls as [User][]) {
      await expect(bcrypt.compare('env-secret', user.passwordHash)).resolves.toBe(
        true,
      );
    }
  });

  it('falls back to the documented dev default when SEED_PASSWORD is undefined', async () => {
    const repository = createUserRepositoryMock();
    const useCase = new SeedUsersUseCase(
      repository,
      createConfigServiceMock({}),
    );

    await useCase.execute();

    const [firstUser] = repository.create.mock.calls[0] as [User];
    await expect(
      bcrypt.compare('odc-dev-password', firstUser.passwordHash),
    ).resolves.toBe(true);
  });
});
