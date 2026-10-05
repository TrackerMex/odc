import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { configureApp } from '../src/bootstrap';
import { AuthController } from '../src/modules/auth/infrastructure/controller/auth.controller';
import { LoginUseCase } from '../src/modules/auth/application/use-cases/login.usecase';
import { GetMeUseCase } from '../src/modules/auth/application/use-cases/get-me.usecase';
import { JwtAuthGuard } from '../src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/infrastructure/guards/roles.guard';
import { LoginRateLimitGuard } from '../src/modules/auth/infrastructure/guards/login-rate-limit.guard';
import { AuthLoginAttemptOrmEntity } from '../src/modules/auth/infrastructure/entities/auth-login-attempt.orm-entity';

const schema = `odc_test_${randomUUID().replaceAll('-', '')}`;
const sources: DataSource[] = [],
  apps: INestApplication[] = [];
let guards: LoginRateLimitGuard[], passwordHash: string;
let schemaCreated = false;
const userRepository = { findByEmail: jest.fn() };
beforeAll(async () => {
  const url = process.env.ODC_TEST_DATABASE_URL;
  if (!url) throw new Error('Use isolated verify-postgres-hardening.sh');
  passwordHash = await bcrypt.hash('test-password', 4);
  for (let i = 0; i < 2; i++) {
    const source = new DataSource({
      type: 'postgres',
      url,
      schema,
      synchronize: false,
      entities: [AuthLoginAttemptOrmEntity],
      extra: { max: 5 },
    });
    sources.push(source);
    await source.initialize();
  }
  await sources[0].query(`CREATE SCHEMA "${schema}"`);
  schemaCreated = true;
  await sources[0].synchronize();
  for (const source of sources) {
    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'rate-limit-test-only' })],
      controllers: [AuthController],
      providers: [
        LoginUseCase,
        LoginRateLimitGuard,
        { provide: GetMeUseCase, useValue: { execute: jest.fn() } },
        { provide: DataSource, useValue: source },
        { provide: 'UserRepository', useValue: userRepository },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();
    const app = configureApp(module.createNestApplication());
    apps.push(app);
    await app.listen(0, '127.0.0.1');
  }
  guards = apps.map((app) => app.get(LoginRateLimitGuard));
}, 30_000);
afterAll(async () => {
  await Promise.all(apps.map((app) => app.close()));
  if (schemaCreated) await sources[0].query(`DROP SCHEMA "${schema}" CASCADE`);
  await Promise.all(
    sources.filter((s) => s.isInitialized).map((s) => s.destroy()),
  );
});
beforeEach(async () => {
  await sources[0].manager.clear(AuthLoginAttemptOrmEntity);
  userRepository.findByEmail.mockImplementation((email: string) =>
    Promise.resolve(
      email === 'known@test.invalid'
        ? {
            id: randomUUID(),
            email,
            passwordHash,
            fullName: 'Test',
            role: 'DIRECTOR_OPS',
          }
        : null,
    ),
  );
});
function login(
  email: string,
  index = 0,
  password = 'wrong-password',
  forwarded = '198.51.100.9',
) {
  return request(apps[index].getHttpServer() as Server)
    .post('/api/auth/login')
    .set('X-Forwarded-For', forwarded)
    .send({ email, password });
}
describe('R1,R3,R4,R5: shared login throttling on real PostgreSQL and HTTP', () => {
  it.each(['known@test.invalid', 'unknown@test.invalid'])(
    'same account limits and errors for %s',
    async (email) => {
      for (let i = 0; i < 5; i++) {
        const response = await login(email, i % 2).expect(401);
        expect(response.body).toMatchObject({
          statusCode: 401,
          message: 'Invalid credentials',
        });
      }
      const response = await login(email, 1).expect(429);
      expect(Number(response.headers['retry-after'])).toBeGreaterThanOrEqual(
        899,
      );
      expect(response.headers['set-cookie']).toBeUndefined();
    },
  );
  it('normalized account shares quota across different peers', async () => {
    const emails = [
      'known@test.invalid',
      ' KNOWN@test.invalid ',
      'known@TEST.invalid',
      'Known@test.invalid',
      'known@test.invalid',
    ];
    for (let i = 0; i < 5; i++)
      expect(
        await guards[i % 2].consume(`192.0.2.${i + 1}`, emails[i]),
      ).toBeNull();
    expect(
      await guards[1].consume('192.0.2.20', 'KNOWN@test.invalid'),
    ).toBeGreaterThan(0);
    const keys = await sources[0].manager.find(AuthLoginAttemptOrmEntity);
    expect(keys.filter((row) => row.key.startsWith('a:'))).toHaveLength(1);
    expect(
      keys.every((row) => row.key.length === 66 && !row.key.includes('known')),
    ).toBe(true);
  });
  it('R2: rotating forged XFF cannot evade IP limit or spend another IP quota', async () => {
    for (let i = 0; i < 60; i++)
      await login(
        `unknown${i}@test.invalid`,
        i % 2,
        'wrong',
        `198.51.100.${i + 1}`,
      ).expect(401);
    const res = await login(
      'victim@test.invalid',
      1,
      'wrong',
      '203.0.113.10',
    ).expect(429);
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
    expect(
      await guards[0].consume('203.0.113.10', 'fresh@test.invalid'),
    ).toBeNull();
    const rows = await sources[0].manager.find(AuthLoginAttemptOrmEntity);
    expect(rows.filter((row) => row.key.startsWith('a:'))).toHaveLength(61); // blocked IP did not spend victim quota
  });
  it('two instances and concurrent connections admit exactly five attempts', async () => {
    const results = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        guards[i % 2].consume(`192.0.2.${i + 1}`, 'parallel@test.invalid'),
      ),
    );
    expect(results.filter((r) => r === null)).toHaveLength(5);
    expect(results.filter((r) => r !== null)).toHaveLength(20);
    expect(
      (await sources[0].manager.find(AuthLoginAttemptOrmEntity)).find((r) =>
        r.key.startsWith('a:'),
      )!.attempts,
    ).toBe(6);
  });
  it('window expiry resets attempts using DB time and no reset on blocked attempts', async () => {
    for (let i = 0; i < 5; i++)
      await guards[0].consume('192.0.2.1', 'expire@test.invalid');
    const before = (
      await sources[0].manager.find(AuthLoginAttemptOrmEntity)
    ).find((r) => r.key.startsWith('a:'))!;
    expect(
      await guards[1].consume('192.0.2.1', 'expire@test.invalid'),
    ).toBeGreaterThan(0);
    const after = await sources[0].manager.findOneByOrFail(
      AuthLoginAttemptOrmEntity,
      { key: before.key },
    );
    expect(after.expiresAt).toEqual(before.expiresAt);
    expect(after.attempts).toBe(6);
    await sources[0].query(
      `UPDATE "${schema}".auth_login_attempts SET "expiresAt" = clock_timestamp() - interval '1 second'`,
    );
    expect(
      await guards[1].consume('192.0.2.1', 'expire@test.invalid'),
    ).toBeNull();
    expect(
      (
        await sources[0].manager.findOneByOrFail(AuthLoginAttemptOrmEntity, {
          key: before.key,
        })
      ).attempts,
    ).toBe(1);
  });
  it('successful login keeps cookie, logout and unauthenticated me behavior', async () => {
    const res = await login('known@test.invalid', 0, 'test-password').expect(
      200,
    );
    expect(res.body).toMatchObject({
      user: { email: 'known@test.invalid', role: 'DIRECTOR_OPS' },
    });
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Lax');
    await request(apps[0].getHttpServer() as Server)
      .post('/api/auth/logout')
      .set('Cookie', cookies[0].split(';')[0])
      .expect(200);
    await request(apps[0].getHttpServer() as Server)
      .get('/api/auth/me')
      .expect(401);
  });
  it('DB failure fails closed without authenticating or leaking diagnostics', async () => {
    const execute = jest.spyOn(apps[0].get(LoginUseCase), 'execute');
    const transaction = jest
      .spyOn(sources[0], 'transaction')
      .mockRejectedValue(new Error('private database credential diagnostic'));
    try {
      const res = await login('known@test.invalid', 0, 'test-password').expect(
        503,
      );
      expect(execute).not.toHaveBeenCalled();
      expect(res.headers['set-cookie']).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('private');
    } finally {
      transaction.mockRestore();
      execute.mockRestore();
    }
  });
  it('malformed/oversized accounts have bounded shared keys without clear identifiers', async () => {
    expect(await guards[0].consume('192.0.2.1', 'x'.repeat(10000))).toBeNull();
    expect(await guards[1].consume('::ffff:192.0.2.1', '')).toBeNull();
    const rows = await sources[0].manager.find(AuthLoginAttemptOrmEntity);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => /^[ia]:[a-f0-9]{64}$/.test(r.key))).toBe(true);
    for (let i = 0; i < 3; i++)
      await guards[0].consume('192.0.2.1', 'no-at-sign');
    expect(
      await guards[1].consume('192.0.2.1', 'y'.repeat(10000)),
    ).toBeGreaterThan(0);
  });
  it('cleanup removes expired keys in bounded batches and preserves active windows', async () => {
    const rows = Array.from({ length: 1005 }, (_, i) => ({
      key: `a:${i.toString(16).padStart(64, '0')}`,
      attempts: 1,
      expiresAt: new Date(0),
    }));
    await sources[0].manager.insert(AuthLoginAttemptOrmEntity, rows);
    await guards[0].consume('192.0.2.1', 'active@test.invalid');
    await guards[0].purgeExpired();
    expect(await sources[0].manager.count(AuthLoginAttemptOrmEntity)).toBe(7);
    await guards[1].purgeExpired();
    expect(await sources[0].manager.count(AuthLoginAttemptOrmEntity)).toBe(2);
    expect(
      await guards[0].consume('192.0.2.1', 'active@test.invalid'),
    ).toBeNull();
  });
  it('R2: equivalent IPv6 addresses cannot rotate their identity', async () => {
    for (let i = 0; i < 60; i++) {
      const ip =
        i % 2 ? '2001:db8::1' : '2001:0db8:0000:0000:0000:0000:0000:0001';
      expect(
        await guards[i % 2].consume(ip, `ipv6-${i}@test.invalid`),
      ).toBeNull();
    }
    expect(
      await guards[0].consume('2001:db8::1', 'blocked@test.invalid'),
    ).toBeGreaterThan(0);
  });
  it('SQL is additive/idempotent and preserves active counters', async () => {
    await guards[0].consume('192.0.2.1', 'sql@test.invalid');
    await sources[0].query(`SET search_path TO "${schema}"`);
    const sql = readFileSync(
      resolve(__dirname, '../scripts/sql/039-auth-login-attempts.sql'),
      'utf8',
    );
    await sources[0].query(sql);
    await sources[0].query(sql);
    expect(await sources[0].manager.count(AuthLoginAttemptOrmEntity)).toBe(2);
    expect(await guards[1].consume('192.0.2.1', 'sql@test.invalid')).toBeNull();
  });
});
