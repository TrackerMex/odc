import { INestApplication, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { v2 as cloudinary } from 'cloudinary';
import { Server } from 'node:http';
import request from 'supertest';
import { configureApp } from '../../../../bootstrap';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { CloudinaryFileStorageService } from '../../../files/infrastructure/services/cloudinary-file-storage.service';
import { GetInvoiceFileUseCase } from '../../application/use-cases/get-invoice-file.usecase';
import { GetOdcUseCase } from '../../application/use-cases/get-odc.usecase';
import { GetPaymentEvidenceFileUseCase } from '../../application/use-cases/get-payment-evidence-file.usecase';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { OdcController } from './odc.controller';

const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000035';
const USER_ID = 'a3d1c9a2-0000-4000-8000-000000000001';
const ROLES = ['DIRECTOR_OPS', 'ADMINISTRACION', 'DIRECTOR_GENERAL'];

describe('R1,R3,R4,R6: authenticated HTTP downloads with real guards, use cases and SDK (#35)', () => {
  let app: INestApplication;
  let server: Server;
  let jwt: JwtService;
  let order: PurchaseOrder;
  let signing: jest.SpyInstance;
  let metadata: jest.SpyInstance;
  const repository = { findById: jest.fn() };

  beforeAll(async () => {
    const real = [
      GetOdcUseCase,
      GetPaymentEvidenceFileUseCase,
      GetInvoiceFileUseCase,
    ];
    const dependencies = Reflect.getMetadata(
      'design:paramtypes',
      OdcController,
    ) as Type<unknown>[];
    const storage = new CloudinaryFileStorageService({
      get: (key: string) =>
        ({
          CLOUDINARY_CLOUD_NAME: 'test35-dummy',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        })[key],
    } as unknown as ConfigService);
    signing = jest.spyOn(storage, 'getSignedUrl');
    metadata = jest.spyOn(cloudinary.api, 'resource');
    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'file-delivery-tests-only' })],
      controllers: [OdcController],
      providers: [
        ...dependencies
          .filter((type) => !real.includes(type as typeof GetOdcUseCase))
          .map((type) => ({ provide: type, useValue: { execute: jest.fn() } })),
        ...real,
        JwtAuthGuard,
        RolesGuard,
        { provide: 'PurchaseOrderRepository', useValue: repository },
        { provide: 'FileStorageService', useValue: storage },
      ],
    }).compile();
    app = configureApp(module.createNestApplication());
    app.useGlobalGuards(module.get(JwtAuthGuard), module.get(RolesGuard));
    await app.listen(0, '127.0.0.1');
    server = app.getHttpServer() as Server;
    jwt = module.get(JwtService);
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    await app?.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    const { order: draft } = PurchaseOrder.createDraft(
      {
        description: 'Test',
        quantity: 1,
        unit: 'pza',
        unitPriceCents: 100,
        supplier: 'Test',
      },
      { userId: USER_ID, role: 'DIRECTOR_OPS' },
    );
    order = new PurchaseOrder({
      ...draft,
      id: ODC_ID,
      status: 'COMPLETADA',
      paymentEvidenceFile: 'cloudinary:v1:image:png:odc/test35/evidence',
      invoiceFile: 'cloudinary:v1:image:pdf:odc/test35/invoice',
    });
    repository.findById.mockResolvedValue(order);
    metadata.mockResolvedValue({ resource_type: 'image', format: 'pdf' });
  });
  function cookie(role = 'DIRECTOR_OPS') {
    return `odc_session=${jwt.sign({ sub: USER_ID, role })}`;
  }

  describe.each(['evidence', 'invoice'])('%s', (kind) => {
    function get() {
      return request(server).get(`/api/odcs/${ODC_ID}/files/${kind}`);
    }
    function field() {
      return kind === 'evidence' ? 'paymentEvidenceFile' : 'invoiceFile';
    }
    it.each(ROLES)(
      'R4: %s can download a visible ODC after authorization',
      async (role) => {
        const before = Math.floor(Date.now() / 1000);
        const res = await get().set('Cookie', cookie(role)).expect(302);
        const url = new URL(res.headers.location);
        expect(url.origin).toBe('https://api.cloudinary.com');
        expect(url.searchParams.get('type')).toBe('authenticated');
        expect(
          Number(url.searchParams.get('expires_at')),
        ).toBeGreaterThanOrEqual(before + 300);
        expect(Number(url.searchParams.get('expires_at'))).toBeLessThanOrEqual(
          Math.floor(Date.now() / 1000) + 300,
        );
        expect(repository.findById).toHaveBeenCalledWith(ODC_ID);
        expect(signing).toHaveBeenCalledTimes(1);
        expect(metadata).not.toHaveBeenCalled();
      },
    );
    it('R4: rejects an absent session before reading or signing', async () => {
      await get().expect(401);
      expect(repository.findById).not.toHaveBeenCalled();
      expect(signing).not.toHaveBeenCalled();
    });
    it('R4: rejects an invalid session before reading or signing', async () => {
      await get().set('Cookie', 'odc_session=invalid').expect(401);
      expect(repository.findById).not.toHaveBeenCalled();
      expect(signing).not.toHaveBeenCalled();
    });
    it('R4: rejects a draft belonging to another creator before signing', async () => {
      order = new PurchaseOrder({
        ...order,
        status: 'BORRADOR',
        createdById: 'another-user',
      });
      repository.findById.mockResolvedValue(order);
      await get().set('Cookie', cookie()).expect(403);
      expect(signing).not.toHaveBeenCalled();
    });
    it('R4: returns 404 for a nonexistent ODC before signing', async () => {
      repository.findById.mockResolvedValue(null);
      await get().set('Cookie', cookie()).expect(404);
      expect(signing).not.toHaveBeenCalled();
    });
    it('R4: returns 404 for an absent document before signing', async () => {
      order = new PurchaseOrder({ ...order, [field()]: null });
      repository.findById.mockResolvedValue(order);
      await get().set('Cookie', cookie()).expect(404);
      expect(signing).not.toHaveBeenCalled();
    });
    it('R3: resolves legacy metadata without changing the stored reference', async () => {
      const publicId = `odc/test35/legacy-${kind}`;
      order = new PurchaseOrder({ ...order, [field()]: publicId });
      repository.findById.mockResolvedValue(order);
      const res = await get().set('Cookie', cookie()).expect(302);
      expect(new URL(res.headers.location).searchParams.get('public_id')).toBe(
        publicId,
      );
      expect(order[field()]).toBe(publicId);
      expect(metadata).toHaveBeenCalledWith(publicId, {
        resource_type: 'image',
        type: 'authenticated',
      });
    });
    it.each([
      ['confirmed missing asset', { http_code: 404 }, 404],
      ['storage outage', new Error('timeout'), 502],
    ] as const)(
      'R3: preserves the error contract for %s',
      async (_name, error, status) => {
        order = new PurchaseOrder({ ...order, [field()]: 'odc/test35/legacy' });
        repository.findById.mockResolvedValue(order);
        metadata.mockRejectedValueOnce(error);
        const res = await get().set('Cookie', cookie()).expect(status);
        expect(res.headers.location).toBeUndefined();
      },
    );
  });
});
