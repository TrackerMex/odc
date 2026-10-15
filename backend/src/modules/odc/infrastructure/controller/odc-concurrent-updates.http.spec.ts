import { INestApplication, Type } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { configureApp } from '../../../../bootstrap';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { OdcConcurrentUpdateError } from '../../domain/errors/odc-concurrent-update.error';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { OdcController } from './odc.controller';

const ID = 'b4e2d8b3-0000-4000-8000-000000000036';
const ROUTES = [
  {
    method: 'patch',
    path: '',
    role: 'DIRECTOR_OPS',
    body: { description: 'Test' },
  },
  { method: 'post', path: '/submit', role: 'DIRECTOR_OPS', body: {} },
  { method: 'post', path: '/approve-budget', role: 'ADMINISTRACION', body: {} },
  {
    method: 'post',
    path: '/approve-purchase',
    role: 'DIRECTOR_GENERAL',
    body: {},
  },
  {
    method: 'post',
    path: '/reject',
    role: 'ADMINISTRACION',
    body: { rejectionReason: 'Test' },
  },
  {
    method: 'post',
    path: '/payment',
    role: 'DIRECTOR_OPS',
    body: { paymentDate: '2026-10-05', paymentMethod: 'Transferencia' },
  },
  {
    method: 'post',
    path: '/payment-evidence',
    role: 'ADMINISTRACION',
    body: {},
  },
  {
    method: 'post',
    path: '/invoice',
    role: 'DIRECTOR_OPS',
    body: { warehouseEntryDate: '2026-10-05' },
  },
] as const;

describe('R3: every mutation returns 409 for a stale persisted version (#36)', () => {
  let app: INestApplication;
  let server: Server;
  let jwt: JwtService;
  const execute = jest.fn();
  beforeAll(async () => {
    const dependencies = Reflect.getMetadata(
      'design:paramtypes',
      OdcController,
    ) as Type<unknown>[];
    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'concurrent-http-tests-only' })],
      controllers: [OdcController],
      providers: [
        ...dependencies.map((type) => ({
          provide: type,
          useValue: { execute },
        })),
        JwtAuthGuard,
        RolesGuard,
      ],
    }).compile();
    app = configureApp(module.createNestApplication());
    app.useGlobalGuards(module.get(JwtAuthGuard), module.get(RolesGuard));
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    server = app.getHttpServer() as Server;
    jwt = module.get(JwtService);
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(() => {
    execute.mockReset().mockRejectedValue(new OdcConcurrentUpdateError());
  });
  function cookie(role: string) {
    return `odc_session=${jwt.sign({ sub: 'a3d1c9a2-0000-4000-8000-000000000001', role })}`;
  }
  describe.each(ROUTES)('$method $path', (route) => {
    function send(role: string | null = route.role) {
      const req = request(server)[route.method](`/api/odcs/${ID}${route.path}`);
      if (role !== null) req.set('Cookie', cookie(role));
      if (route.path === '/invoice' || route.path === '/payment-evidence') {
        for (const [field, value] of Object.entries(route.body))
          req.field(field, value);
        return req.attach('file', Buffer.from('%PDF-1.4\n%%EOF\n'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });
      }
      return req.send(route.body);
    }
    it('maps the repository conflict to 409 with a reload instruction', async () => {
      const response = await send().expect(409);
      const body = response.body as { message: string };
      expect(body.message).toContain('Recarga');
      expect(execute).toHaveBeenCalledTimes(1);
    });
    it('preserves 401 and skips the use case for an absent session', async () => {
      await send(null).expect(401);
      expect(execute).not.toHaveBeenCalled();
    });
    it('preserves 403 and skips the use case for a forbidden role', async () => {
      await send(
        route.role === 'DIRECTOR_OPS' ? 'ADMINISTRACION' : 'DIRECTOR_OPS',
      ).expect(403);
      expect(execute).not.toHaveBeenCalled();
    });
    it('preserves 404 for a missing ODC', async () => {
      execute.mockRejectedValueOnce(new OdcNotFoundError(ID));
      await send().expect(404);
    });
  });
});
