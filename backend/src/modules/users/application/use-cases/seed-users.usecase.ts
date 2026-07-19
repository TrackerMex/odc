import * as bcrypt from 'bcrypt';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';

// Dev-only fallback, documented in specs/auth-users/design.md (R3)
export const DEFAULT_SEED_PASSWORD = 'odc-dev-password';

const BCRYPT_COST = 10;

const SEED_USERS: Array<{ email: string; fullName: string; role: UserRole }> = [
  {
    email: 'ops@odc.local',
    fullName: 'Director de Operaciones',
    role: 'DIRECTOR_OPS',
  },
  {
    email: 'admin@odc.local',
    fullName: 'Administración',
    role: 'ADMINISTRACION',
  },
  {
    email: 'dg@odc.local',
    fullName: 'Director General',
    role: 'DIRECTOR_GENERAL',
  },
];

@Injectable()
export class SeedUsersUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<{ created: string[]; skipped: string[] }> {
    const password =
      this.configService.get<string>('SEED_PASSWORD') ?? DEFAULT_SEED_PASSWORD;
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    const created: string[] = [];
    const skipped: string[] = [];

    for (const seed of SEED_USERS) {
      await this.userRepository.create(
        new User(null, seed.email, passwordHash, seed.fullName, seed.role, null),
      );
      created.push(seed.email);
    }

    return { created, skipped };
  }
}
