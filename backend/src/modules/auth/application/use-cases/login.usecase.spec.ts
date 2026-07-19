import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../../users/domain/entities/user.entity';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { LoginUseCase } from './login.usecase';

interface UserRepositoryMock {
  findByEmail: jest.Mock;
  create: jest.Mock;
}

async function createStoredUser(password: string): Promise<User> {
  return new User(
    'a3d1c9a2-0000-4000-8000-000000000001',
    'ops@odc.local',
    await bcrypt.hash(password, 4),
    'Operations Director',
    'DIRECTOR_OPS',
    new Date('2026-07-19T00:00:00Z'),
  );
}

describe('R5: login with valid credentials returns the user and a session token', () => {
  it('returns the public user shape without passwordHash plus the signed token', async () => {
    const storedUser = await createStoredUser('secret-password');
    const repository: UserRepositoryMock = {
      findByEmail: jest.fn().mockResolvedValue(storedUser),
      create: jest.fn(),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as unknown as JwtService;
    const useCase = new LoginUseCase(repository, jwtService);

    const result = await useCase.execute('ops@odc.local', 'secret-password');

    expect(repository.findByEmail).toHaveBeenCalledWith('ops@odc.local');
    expect(result.token).toBe('signed-token');
    expect(result.user).toEqual({
      id: 'a3d1c9a2-0000-4000-8000-000000000001',
      email: 'ops@odc.local',
      fullName: 'Operations Director',
      role: 'DIRECTOR_OPS',
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});

describe('R7: login failure raises the same generic domain error', () => {
  const jwtService = {
    signAsync: jest.fn(),
  } as unknown as JwtService;

  it('rejects with InvalidCredentialsError when the email does not exist', async () => {
    const repository: UserRepositoryMock = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    const useCase = new LoginUseCase(repository, jwtService);

    await expect(
      useCase.execute('nobody@odc.local', 'whatever'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects with InvalidCredentialsError when the password does not match', async () => {
    const storedUser = await createStoredUser('right-password');
    const repository: UserRepositoryMock = {
      findByEmail: jest.fn().mockResolvedValue(storedUser),
      create: jest.fn(),
    };
    const useCase = new LoginUseCase(repository, jwtService);

    await expect(
      useCase.execute('ops@odc.local', 'wrong-password'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('uses the same generic message in both cases without revealing which failed', async () => {
    const storedUser = await createStoredUser('right-password');
    const emptyRepository: UserRepositoryMock = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    const populatedRepository: UserRepositoryMock = {
      findByEmail: jest.fn().mockResolvedValue(storedUser),
      create: jest.fn(),
    };

    const unknownEmailError = await new LoginUseCase(emptyRepository, jwtService)
      .execute('nobody@odc.local', 'whatever')
      .catch((error: Error) => error);
    const wrongPasswordError = await new LoginUseCase(
      populatedRepository,
      jwtService,
    )
      .execute('ops@odc.local', 'wrong-password')
      .catch((error: Error) => error);

    expect(unknownEmailError).toBeInstanceOf(InvalidCredentialsError);
    expect(wrongPasswordError).toBeInstanceOf(InvalidCredentialsError);
    expect((unknownEmailError as Error).message).toBe(
      (wrongPasswordError as Error).message,
    );
  });
});
