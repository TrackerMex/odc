import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/domain/entities/user.entity';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { jwtModuleOptionsFactory } from './jwt.config';

function createConfigServiceMock(
  env: Record<string, string | undefined>,
): ConfigService {
  return {
    get: jest.fn((key: string) => env[key]),
  } as unknown as ConfigService;
}

describe('R6: session JWT signed with JWT_SECRET, 8h expiration and { sub, role } payload', () => {
  it('builds JwtModule options with the secret from JWT_SECRET and expiresIn 8h', () => {
    const options = jwtModuleOptionsFactory(
      createConfigServiceMock({ JWT_SECRET: 'test-secret' }),
    );

    expect(options).toEqual({
      secret: 'test-secret',
      signOptions: { expiresIn: '8h' },
    });
  });

  it('login signs a token carrying { sub, role } that expires in 8 hours', async () => {
    const jwtService = new JwtService(
      jwtModuleOptionsFactory(
        createConfigServiceMock({ JWT_SECRET: 'test-secret' }),
      ),
    );
    const storedUser = new User(
      'a3d1c9a2-0000-4000-8000-000000000001',
      'ops@odc.local',
      await bcrypt.hash('secret-password', 4),
      'Operations Director',
      'DIRECTOR_OPS',
      null,
    );
    const repository = {
      findByEmail: jest.fn().mockResolvedValue(storedUser),
      create: jest.fn(),
    };
    const useCase = new LoginUseCase(repository, jwtService);

    const { token } = await useCase.execute('ops@odc.local', 'secret-password');

    const payload = jwtService.verify<{
      sub: string;
      role: string;
      iat: number;
      exp: number;
    }>(token, { secret: 'test-secret' });
    expect(payload.sub).toBe('a3d1c9a2-0000-4000-8000-000000000001');
    expect(payload.role).toBe('DIRECTOR_OPS');
    expect(payload.exp - payload.iat).toBe(8 * 60 * 60);
  });
});
