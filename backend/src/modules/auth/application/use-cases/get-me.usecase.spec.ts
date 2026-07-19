import { User } from '../../../users/domain/entities/user.entity';
import { SessionUserNotFoundError } from '../../domain/errors/session-user-not-found.error';
import { GetMeUseCase } from './get-me.usecase';

interface UserRepositoryMock {
  findByEmail: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
}

function createUserRepositoryMock(): UserRepositoryMock {
  return {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
}

describe('R10: get me resolves the session user without passwordHash', () => {
  it('returns { id, email, fullName, role } for the user behind the JWT sub', async () => {
    const repository = createUserRepositoryMock();
    repository.findById.mockResolvedValue(
      new User(
        'a3d1c9a2-0000-4000-8000-000000000001',
        'ops@odc.local',
        '$2b$10$hash',
        'Operations Director',
        'DIRECTOR_OPS',
        new Date('2026-07-19T00:00:00Z'),
      ),
    );
    const useCase = new GetMeUseCase(repository);

    const user = await useCase.execute('a3d1c9a2-0000-4000-8000-000000000001');

    expect(repository.findById).toHaveBeenCalledWith(
      'a3d1c9a2-0000-4000-8000-000000000001',
    );
    expect(user).toEqual({
      id: 'a3d1c9a2-0000-4000-8000-000000000001',
      email: 'ops@odc.local',
      fullName: 'Operations Director',
      role: 'DIRECTOR_OPS',
    });
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('rejects with SessionUserNotFoundError when the user no longer exists', async () => {
    const repository = createUserRepositoryMock();
    repository.findById.mockResolvedValue(null);
    const useCase = new GetMeUseCase(repository);

    await expect(useCase.execute('ghost-id')).rejects.toBeInstanceOf(
      SessionUserNotFoundError,
    );
  });
});
