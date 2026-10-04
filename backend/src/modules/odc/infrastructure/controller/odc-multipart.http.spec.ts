import { INestApplication, Type } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { request as httpRequest, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';
import request from 'supertest';
import { configureApp } from '../../../../bootstrap';
import type {
  UploadFileInput,
  UploadFileResult,
} from '../../../files/domain/services/file-storage.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { UploadInvoiceUseCase } from '../../application/use-cases/upload-invoice.usecase';
import { UploadPaymentEvidenceUseCase } from '../../application/use-cases/upload-payment-evidence.usecase';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { OdcController } from './odc.controller';

const MAX_BYTES = 10_485_760;
const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000034';
const USER_ID = 'a3d1c9a2-0000-4000-8000-000000000001';
const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
const JPEG = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aNgkAAAAASUVORK5CYII=',
  'base64',
);
const FORMATS = [
  ['application/pdf', PDF],
  ['image/jpeg', JPEG],
  ['image/png', PNG],
] as const;
const ROUTES = [
  {
    path: 'payment-evidence',
    role: 'ADMINISTRACION',
    initialStatus: 'PAGO_REGISTRADO',
    finalStatus: 'EVIDENCIA_PAGO_SUBIDA',
    fields: { evidenceReference: 'REF-34' },
    textField: 'evidenceReference',
  },
  {
    path: 'invoice',
    role: 'DIRECTOR_OPS',
    initialStatus: 'EVIDENCIA_PAGO_SUBIDA',
    finalStatus: 'COMPLETADA',
    fields: {
      warehouseEntryDate: '2026-10-04',
      invoiceNumber: 'F-34',
      invoiceDate: '2026-10-03',
      observations: 'Prueba local',
    },
    textField: 'observations',
  },
] as const;

describe('R7: real Nest/Multer HTTP upload boundary (#34)', () => {
  let app: INestApplication;
  let server: Server;
  let jwt: JwtService;
  let order: PurchaseOrder;
  let snapshot: string;
  const repository = {
    findById: jest.fn(),
    update: jest.fn((saved: PurchaseOrder) => Promise.resolve(saved)),
  };
  const storage = {
    upload: jest
      .fn<Promise<UploadFileResult>, [UploadFileInput]>()
      .mockResolvedValue({
        publicId: 'odc/test/34',
        resourceType: 'image',
        format: 'pdf',
      }),
  };
  let evidenceExecute: jest.SpyInstance;
  let invoiceExecute: jest.SpyInstance;

  beforeAll(async () => {
    const dependencies = Reflect.getMetadata(
      'design:paramtypes',
      OdcController,
    ) as Type<unknown>[];
    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'multipart-http-tests-only' })],
      controllers: [OdcController],
      providers: [
        ...dependencies
          .filter(
            (type) =>
              type !== UploadInvoiceUseCase &&
              type !== UploadPaymentEvidenceUseCase,
          )
          .map((type) => ({ provide: type, useValue: { execute: jest.fn() } })),
        UploadInvoiceUseCase,
        UploadPaymentEvidenceUseCase,
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
    evidenceExecute = jest.spyOn(
      module.get(UploadPaymentEvidenceUseCase),
      'execute',
    );
    invoiceExecute = jest.spyOn(module.get(UploadInvoiceUseCase), 'execute');
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => jest.clearAllMocks());

  function cookie(role: string) {
    return `odc_session=${jwt.sign({ sub: USER_ID, role })}`;
  }

  function expectNoEffects() {
    expect(evidenceExecute).not.toHaveBeenCalled();
    expect(invoiceExecute).not.toHaveBeenCalled();
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
    expect(storage.upload).not.toHaveBeenCalled();
    expect(JSON.stringify(order)).toBe(snapshot);
  }

  // Streams without constructing the whole multipart body in memory.
  async function streamUpload(
    path: string,
    role: string,
    fields: Record<string, string>,
    size: number,
  ) {
    const boundary = 'odc34stream';
    function* chunks() {
      for (const [name, value] of Object.entries(fields)) {
        yield Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
        );
      }
      yield Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
      );
      const chunk = Buffer.alloc(64 * 1024);
      PDF.copy(chunk);
      for (let sent = 0; sent < size; sent += chunk.length) {
        yield chunk.subarray(0, Math.min(chunk.length, size - sent));
      }
      yield Buffer.from(`\r\n--${boundary}--\r\n`);
    }
    return new Promise<number>((resolve, reject) => {
      const req = httpRequest(
        {
          host: '127.0.0.1',
          port: (server.address() as AddressInfo).port,
          path: `/api/odcs/${ODC_ID}/${path}`,
          method: 'POST',
          headers: {
            Cookie: cookie(role),
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
        },
        (res) => {
          res.resume();
          res.on('end', () => resolve(res.statusCode!));
          res.on('error', reject);
        },
      );
      req.on('error', reject);
      req.setTimeout(5000, () => req.destroy(new Error('Upload timeout')));
      Readable.from(chunks()).pipe(req);
    });
  }

  describe.each(ROUTES)('$path', (route) => {
    beforeEach(() => {
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
        odcNumber: 'ODC-2026-00034',
        status: route.initialStatus,
      });
      snapshot = JSON.stringify(order);
      repository.findById.mockResolvedValue(order);
    });

    function form(
      fields: Record<string, string> = route.fields,
      fileFirst = false,
    ) {
      const req = request(server)
        .post(`/api/odcs/${ODC_ID}/${route.path}`)
        .set('Cookie', cookie(route.role));
      if (fileFirst)
        req.attach('file', PDF, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });
      for (const [name, value] of Object.entries(fields))
        req.field(name, value);
      return req;
    }

    describe('R1: valid content, inclusive size and metadata', () => {
      it.each(FORMATS)(
        'accepts %s with all supported metadata',
        async (mime, buffer) => {
          const res = await form()
            .attach('file', buffer, { filename: 'test', contentType: mime })
            .expect(200);
          expect(res.body).toMatchObject({
            id: ODC_ID,
            status: route.finalStatus,
            ...route.fields,
          });
          expect(storage.upload).toHaveBeenCalledWith(
            expect.objectContaining({ buffer, mimeType: mime }),
          );
          expect(repository.update).toHaveBeenCalledTimes(1);
        },
      );

      it('accepts exactly 10485760 bytes', async () => {
        expect(
          await streamUpload(route.path, route.role, route.fields, MAX_BYTES),
        ).toBe(200);
        expect(storage.upload).toHaveBeenCalledTimes(1);
        const uploaded = storage.upload.mock.calls[0][0];
        expect(uploaded.buffer.length).toBe(MAX_BYTES);
      });

      it('rejects an empty file (lower boundary)', async () => {
        await form()
          .attach('file', Buffer.alloc(0), {
            filename: 'empty.pdf',
            contentType: 'application/pdf',
          })
          .expect(400);
        expectNoEffects();
      });

      it('accepts omitted optional metadata', async () => {
        const fields =
          route.path === 'invoice' ? { warehouseEntryDate: '2026-10-04' } : {};
        await form(fields)
          .attach('file', PDF, {
            filename: 'test.pdf',
            contentType: 'application/pdf',
          })
          .expect(200);
        expect(repository.update).toHaveBeenCalledTimes(1);
      });
    });

    describe('R2: limit during streamed reception, before buffering or effects', () => {
      it.each([MAX_BYTES + 1, MAX_BYTES + 4 * 1024 * 1024])(
        'rejects %i bytes with 413 and never builds an oversized buffer',
        async (size) => {
          const concat = jest.spyOn(Buffer, 'concat');
          try {
            expect(
              await streamUpload(route.path, route.role, route.fields, size),
            ).toBe(413);
            expect(
              concat.mock.calls.some(
                ([parts]) =>
                  parts.reduce((n, part) => n + part.length, 0) > MAX_BYTES,
              ),
            ).toBe(false);
            expectNoEffects();
          } finally {
            concat.mockRestore();
          }
        },
      );
    });

    describe('R3: detect signatures and match declared MIME', () => {
      it.each([
        [
          'text pretending to be PDF',
          Buffer.from('plain text'),
          'application/pdf',
        ],
        ['PNG pretending to be JPEG', PNG, 'image/jpeg'],
        ['PDF pretending to be PNG', PDF, 'image/png'],
        ['truncated PDF signature', Buffer.from('%PDF'), 'application/pdf'],
        ['truncated PNG signature', PNG.subarray(0, 4), 'image/png'],
        ['truncated JPEG signature', JPEG.subarray(0, 2), 'image/jpeg'],
        ['unsupported format', Buffer.from('GIF89a'), 'image/gif'],
      ])('rejects %s', async (_name, buffer, mime) => {
        await form()
          .attach('file', buffer, { filename: 'test.pdf', contentType: mime })
          .expect(400);
        expectNoEffects();
      });

      it('rejects missing file', async () => {
        await form().expect(400);
        expectNoEffects();
      });
    });

    describe('R4,R5: bounded and flat multipart fields', () => {
      it.each([false, true])(
        'accepts all fields before/after the file (file first: %s)',
        async (fileFirst) => {
          const req = form(route.fields, fileFirst);
          if (!fileFirst)
            req.attach('file', PDF, {
              filename: 'test.pdf',
              contentType: 'application/pdf',
            });
          await req.expect(200);
        },
      );

      describe.each([false, true])(
        'UTF-8 boundaries (file first: %s)',
        (fileFirst) => {
          it.each(['a'.repeat(8192), 'é'.repeat(4096)])(
            'accepts exactly 8192 UTF-8 bytes (%#)',
            async (value) => {
              const req = form(
                { ...route.fields, [route.textField]: value },
                fileFirst,
              );
              if (!fileFirst)
                req.attach('file', PDF, {
                  filename: 'test.pdf',
                  contentType: 'application/pdf',
                });
              await req.expect(200);
            },
          );

          it.each(['a'.repeat(8193), 'é'.repeat(4096) + 'a'])(
            'rejects 8193 UTF-8 bytes (%#)',
            async (value) => {
              const req = form(
                { ...route.fields, [route.textField]: value },
                fileFirst,
              );
              if (!fileFirst)
                req.attach('file', PDF, {
                  filename: 'test.pdf',
                  contentType: 'application/pdf',
                });
              await req.expect(400);
              expectNoEffects();
            },
          );
        },
      );

      it.each([
        'unknown',
        'x'.repeat(100),
        'x'.repeat(101),
        `${route.textField}[]`,
        `${route.textField}[0]`,
        `${route.textField}[1]`,
        `${route.textField}[nested]`,
      ])('rejects unknown/long/structured field %s', async (name) => {
        const fields =
          route.path === 'invoice'
            ? { warehouseEntryDate: '2026-10-04', [name]: 'x' }
            : { [name]: 'x' };
        await form(fields)
          .attach('file', PDF, {
            filename: 'test.pdf',
            contentType: 'application/pdf',
          })
          .expect(400);
        expectNoEffects();
      });

      it('rejects duplicate text fields', async () => {
        await form()
          .field(route.textField, 'duplicate')
          .attach('file', PDF, {
            filename: 'test.pdf',
            contentType: 'application/pdf',
          })
          .expect(400);
        expectNoEffects();
      });

      it('rejects excess fields/parts', async () => {
        await form()
          .field('extra', 'x')
          .attach('file', PDF, {
            filename: 'test.pdf',
            contentType: 'application/pdf',
          })
          .expect(400);
        expectNoEffects();
      });

      it('rejects two files', async () => {
        await form()
          .attach('file', PDF, {
            filename: 'one.pdf',
            contentType: 'application/pdf',
          })
          .attach('file', PDF, {
            filename: 'two.pdf',
            contentType: 'application/pdf',
          })
          .expect(400);
        expectNoEffects();
      });

      it('rejects a file under the wrong field name', async () => {
        await form()
          .attach('other', PDF, {
            filename: 'test.pdf',
            contentType: 'application/pdf',
          })
          .expect(400);
        expectNoEffects();
      });
    });

    describe('R6: guards precede parsing; every rejection preserves state', () => {
      it.each([
        ['no session', '', 401],
        ['invalid session', 'odc_session=invalid', 401],
        ['wrong role', 'DIRECTOR_GENERAL', 403],
      ])(
        'rejects %s before malformed multipart is parsed',
        async (_name, session, status) => {
          const header =
            session === 'DIRECTOR_GENERAL' ? cookie(session) : session;
          await request(server)
            .post(`/api/odcs/${ODC_ID}/${route.path}`)
            .set('Cookie', header)
            .set('Content-Type', 'multipart/form-data')
            .send('not multipart')
            .expect(status);
          expectNoEffects();
        },
      );

      it('rejects malformed multipart for an authorized user', async () => {
        await request(server)
          .post(`/api/odcs/${ODC_ID}/${route.path}`)
          .set('Cookie', cookie(route.role))
          .set('Content-Type', 'multipart/form-data')
          .send('not multipart')
          .expect(400);
        expectNoEffects();
      });

      it('rejects a truncated file stream without effects or hanging', async () => {
        await request(server)
          .post(`/api/odcs/${ODC_ID}/${route.path}`)
          .set('Cookie', cookie(route.role))
          .set('Content-Type', 'multipart/form-data; boundary=truncated')
          .send(
            '--truncated\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.4\n',
          )
          .expect(400);
        expectNoEffects();
      });
    });
  });
});
