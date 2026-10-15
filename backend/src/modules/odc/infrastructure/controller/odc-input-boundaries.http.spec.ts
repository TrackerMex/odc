import { INestApplication, Type } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { configureApp } from '../../../../bootstrap';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { CreateDraftUseCase } from '../../application/use-cases/create-draft.usecase';
import { GetOdcUseCase } from '../../application/use-cases/get-odc.usecase';
import { RegisterPaymentUseCase } from '../../application/use-cases/register-payment.usecase';
import { UpdateDraftUseCase } from '../../application/use-cases/update-draft.usecase';
import { UploadInvoiceUseCase } from '../../application/use-cases/upload-invoice.usecase';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { OdcNotFoundError } from '../../domain/errors/odc-not-found.error';
import { OdcController } from './odc.controller';

const ID = 'b4e2d8b3-0000-4000-8000-000000000037';
const OWNER = 'a3d1c9a2-0000-4000-8000-000000000001';
const MAX = 2_147_483_647;
const INPUT = {
  description: 'Test',
  quantity: 1,
  unit: 'pza',
  unitPriceCents: 1,
  supplier: 'Test',
};
const ROUTES = [
  { method: 'get', path: '', role: 'DIRECTOR_OPS', body: {} },
  { method: 'get', path: '/files/evidence', role: 'ADMINISTRACION', body: {} },
  { method: 'get', path: '/files/invoice', role: 'DIRECTOR_OPS', body: {} },
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

describe('R1,R2,R3,R4: real Nest input boundaries and zero side effects (#37)', () => {
  let app: INestApplication;
  let server: Server;
  let jwt: JwtService;
  let order: PurchaseOrder;
  const repository = {
    prepareFileUpload: jest.fn().mockResolvedValue({
      id: 'ticket',
      publicId: 'odc/test37/invoice',
      uploadConfirmed: false,
    }),
    claimFileRecovery: jest.fn().mockResolvedValue(null),
    finishFileRecovery: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const storage = { upload: jest.fn(), getSignedUrl: jest.fn() };
  const otherExecute = jest.fn();
  const supplier = {
    findByName: jest.fn().mockResolvedValue({ name: 'Test' }),
  };
  beforeAll(async () => {
    const real: Type<unknown>[] = [
      CreateDraftUseCase,
      GetOdcUseCase,
      RegisterPaymentUseCase,
      UpdateDraftUseCase,
      UploadInvoiceUseCase,
    ];
    const dependencies = Reflect.getMetadata(
      'design:paramtypes',
      OdcController,
    ) as Type<unknown>[];
    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'input-boundaries-tests-only' })],
      controllers: [OdcController],
      providers: [
        ...dependencies
          .filter((type) => !real.includes(type))
          .map((type) => ({
            provide: type,
            useValue: { execute: otherExecute },
          })),
        ...real,
        JwtAuthGuard,
        RolesGuard,
        { provide: 'PurchaseOrderRepository', useValue: repository },
        { provide: 'SupplierRepository', useValue: supplier },
        { provide: 'FileStorageService', useValue: storage },
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
    jest.clearAllMocks();
    const { order: draft } = PurchaseOrder.createDraft(INPUT, {
      userId: OWNER,
      role: 'DIRECTOR_OPS',
    });
    order = new PurchaseOrder({
      ...draft,
      id: ID,
      odcNumber: 'ODC-2026-00037',
    });
    repository.findById.mockImplementation(() => Promise.resolve(order));
    repository.create.mockImplementation((saved: PurchaseOrder) =>
      Promise.resolve(
        new PurchaseOrder({ ...saved, id: ID, odcNumber: order.odcNumber }),
      ),
    );
    repository.update.mockImplementation((saved: PurchaseOrder) =>
      Promise.resolve(saved),
    );
    otherExecute.mockRejectedValue(new OdcNotFoundError(ID));
    storage.upload.mockResolvedValue({
      publicId: 'odc/test37/invoice',
      resourceType: 'image',
      format: 'pdf',
    });
  });
  function cookie(role = 'DIRECTOR_OPS') {
    return `odc_session=${jwt.sign({ sub: OWNER, role })}`;
  }
  function noWrites() {
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
    expect(storage.upload).not.toHaveBeenCalled();
  }
  describe.each(['create', 'patch'])('R1: %s', (operation) => {
    function send(input: object) {
      return operation === 'create'
        ? request(server)
            .post('/api/odcs')
            .set('Cookie', cookie())
            .send({ ...INPUT, ...input })
        : request(server)
            .patch(`/api/odcs/${ID}`)
            .set('Cookie', cookie())
            .send(input);
    }
    it.each([0, -1, 0.5, MAX + 1, Number.MAX_SAFE_INTEGER, '1', null])(
      'rejects invalid quantity/price %j before persistence',
      async (value) => {
        const snapshot = JSON.stringify(order);
        await send({ quantity: value }).expect(400);
        await send({ unitPriceCents: value }).expect(400);
        noWrites();
        expect(JSON.stringify(order)).toBe(snapshot);
      },
    );
    it('rejects 50000*50000 with400, without persistence or partial mutations', async () => {
      const snapshot = JSON.stringify(order);
      await send({
        description: 'Must not change',
        quantity: 50_000,
        unitPriceCents: 50_000,
      }).expect(400);
      noWrites();
      expect(JSON.stringify(order)).toBe(snapshot);
    });
    it.each([
      { quantity: MAX, unitPriceCents: 1 },
      { quantity: 1, unitPriceCents: MAX },
    ])('accepts inclusive limits %j', async (fields) => {
      const response = await send(fields).expect(
        operation === 'create' ? 201 : 200,
      );
      expect(response.body).toMatchObject({ ...fields, totalCents: MAX });
      expect(
        operation === 'create' ? repository.create : repository.update,
      ).toHaveBeenCalledTimes(1);
    });
  });
  it.each([
    { quantity: 50_000, unitPriceCents: 1, patch: { unitPriceCents: 50_000 } },
    { quantity: 1, unitPriceCents: 50_000, patch: { quantity: 50_000 } },
  ])(
    'R1: checks partial PATCH against the stored operand %j',
    async (fields) => {
      order = new PurchaseOrder({
        ...order,
        quantity: fields.quantity,
        unitPriceCents: fields.unitPriceCents,
        totalCents: fields.quantity * fields.unitPriceCents,
      });
      const snapshot = JSON.stringify(order);
      await request(server)
        .patch(`/api/odcs/${ID}`)
        .set('Cookie', cookie())
        .send({ ...fields.patch, description: 'Must not change' })
        .expect(400);
      noWrites();
      expect(JSON.stringify(order)).toBe(snapshot);
    },
  );

  describe.each(['paymentDate', 'warehouseEntryDate', 'invoiceDate'] as const)(
    'R2: %s',
    (field) => {
      function send(value: unknown) {
        const payment = field === 'paymentDate';
        order = new PurchaseOrder({
          ...order,
          status: payment ? 'COMPRA_APROBADA' : 'EVIDENCIA_PAGO_SUBIDA',
        });
        if (payment)
          return request(server)
            .post(`/api/odcs/${ID}/payment`)
            .set('Cookie', cookie())
            .send({ paymentDate: value, paymentMethod: 'Transferencia' });
        const req = request(server)
          .post(`/api/odcs/${ID}/invoice`)
          .set('Cookie', cookie());
        const fields = {
          warehouseEntryDate: '2026-10-05',
          [field]: String(value),
        };
        for (const [key, text] of Object.entries(fields)) req.field(key, text);
        return req.attach('file', Buffer.from('%PDF-1.4\n%%EOF\n'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });
      }
      it.each([
        '2026-02-29',
        '1900-02-29',
        '2026-04-31',
        '2026-13-01',
        '0000-01-01',
        '2026-2-01',
        '2026-10-05T00:00:00Z',
        '2026-10-05T12:00:00-06:00',
      ])('rejects %s before upload/persistence', async (value) => {
        await send(value).expect(400);
        noWrites();
      });
      it.each(['0001-01-01', '9999-12-31', '2000-02-29', '2024-02-29'])(
        'accepts calendar date %s exactly',
        async (value) => {
          const response = await send(value).expect(200);
          expect(response.body).toMatchObject({ [field]: value });
          expect(repository.update).toHaveBeenCalledTimes(1);
        },
      );
    },
  );
  describe.each(ROUTES)('R3: $method $path', (route) => {
    function send(id: string, role: string | null = route.role) {
      const req = request(server)[route.method](`/api/odcs/${id}${route.path}`);
      if (role !== null) req.set('Cookie', cookie(role));
      if (route.path === '/invoice' || route.path === '/payment-evidence') {
        for (const [key, value] of Object.entries(route.body))
          req.field(key, value);
        return req.attach('file', Buffer.from('%PDF-1.4\n%%EOF\n'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });
      }
      return req.send(route.body);
    }
    it('rejects a malformed UUID with400 before every use case', async () => {
      await send('not-a-uuid').expect(400);
      expect(repository.findById).not.toHaveBeenCalled();
      expect(otherExecute).not.toHaveBeenCalled();
      noWrites();
    });
    it('preserves401 for malformed UUID without a session', async () => {
      await send('not-a-uuid', null).expect(401);
      expect(repository.findById).not.toHaveBeenCalled();
      expect(otherExecute).not.toHaveBeenCalled();
      noWrites();
    });
    if (route.method !== 'get') {
      it('preserves403 for malformed UUID with a forbidden role', async () => {
        await send(
          'not-a-uuid',
          route.role === 'DIRECTOR_OPS' ? 'ADMINISTRACION' : 'DIRECTOR_OPS',
        ).expect(403);
        expect(repository.findById).not.toHaveBeenCalled();
        expect(otherExecute).not.toHaveBeenCalled();
        noWrites();
      });
    }
    it('preserves404 for a valid nonexistent UUID', async () => {
      repository.findById.mockResolvedValue(null);
      await send(ID).expect(404);
      noWrites();
    });
  });
  it.each([
    '00000000-0000-1000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-5000-8000-000000000001',
    '00000000-0000-7000-8000-000000000001',
  ])('R3: preserves valid UUID versions %s', async (id) => {
    repository.findById.mockResolvedValue(null);
    await request(server)
      .get(`/api/odcs/${id}`)
      .set('Cookie', cookie())
      .expect(404);
  });
});
