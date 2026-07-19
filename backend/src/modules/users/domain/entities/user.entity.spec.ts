import { readFileSync } from 'fs';
import { join } from 'path';
import { User, USER_ROLES, UserRole } from './user.entity';

describe('R1: pure User domain entity with restricted role', () => {
  it('holds the data model properties passed to the constructor', () => {
    const createdAt = new Date('2026-07-19T00:00:00Z');
    const user = new User(
      'a3d1c9a2-0000-4000-8000-000000000001',
      'ops@odc.local',
      '$2b$10$hash',
      'Operations Director',
      'DIRECTOR_OPS',
      createdAt,
    );

    expect(user.id).toBe('a3d1c9a2-0000-4000-8000-000000000001');
    expect(user.email).toBe('ops@odc.local');
    expect(user.passwordHash).toBe('$2b$10$hash');
    expect(user.fullName).toBe('Operations Director');
    expect(user.role).toBe('DIRECTOR_OPS');
    expect(user.createdAt).toBe(createdAt);
  });

  it('restricts the role to the three business roles', () => {
    expect(USER_ROLES).toEqual([
      'DIRECTOR_OPS',
      'ADMINISTRACION',
      'DIRECTOR_GENERAL',
    ]);
    // Compile-time check: UserRole only admits the three literal values.
    const roles: UserRole[] = ['DIRECTOR_OPS', 'ADMINISTRACION', 'DIRECTOR_GENERAL'];
    expect(roles).toHaveLength(3);
  });

  it('does not import any framework, ORM or infrastructure library', () => {
    const source = readFileSync(join(__dirname, 'user.entity.ts'), 'utf8');
    const importLines = source
      .split('\n')
      .filter((line) => /^\s*import\s/.test(line) || /require\(/.test(line));

    expect(importLines).toEqual([]);
  });
});
