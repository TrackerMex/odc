import { OdcFileUploadOrmEntity } from '../src/modules/odc/infrastructure/entities/odc-file-upload.orm-entity';
import type { UploadFileInput } from '../src/modules/files/domain/services/file-storage.service';
import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSource, EntityManager } from 'typeorm';
import { INestApplication, Type } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { configureApp } from '../src/bootstrap';
import { JwtAuthGuard } from '../src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/infrastructure/guards/roles.guard';
import { OdcController } from '../src/modules/odc/infrastructure/controller/odc.controller';
import { toOdcResponse } from '../src/modules/odc/infrastructure/mappers/odc-response.mapper';
import { ApproveBudgetUseCase } from '../src/modules/odc/application/use-cases/approve-budget.usecase';
import { ApprovePurchaseUseCase } from '../src/modules/odc/application/use-cases/approve-purchase.usecase';
import { RegisterPaymentUseCase } from '../src/modules/odc/application/use-cases/register-payment.usecase';
import { RejectOdcUseCase } from '../src/modules/odc/application/use-cases/reject-odc.usecase';
import { SubmitOdcUseCase } from '../src/modules/odc/application/use-cases/submit-odc.usecase';
import { UpdateDraftUseCase } from '../src/modules/odc/application/use-cases/update-draft.usecase';
import { UploadInvoiceUseCase } from '../src/modules/odc/application/use-cases/upload-invoice.usecase';
import { UploadPaymentEvidenceUseCase } from '../src/modules/odc/application/use-cases/upload-payment-evidence.usecase';
import { OdcConcurrentUpdateError } from '../src/modules/odc/domain/errors/odc-concurrent-update.error';
import { OdcStatusHistoryEntry } from '../src/modules/odc/domain/entities/odc-status-history-entry.entity';
import {
  OdcActor,
  OdcStatus,
  PurchaseOrder,
} from '../src/modules/odc/domain/entities/purchase-order.entity';
import { PurchaseOrderRepository } from '../src/modules/odc/domain/repositories/purchase-order.repository';
import { OdcStatusHistoryOrmEntity } from '../src/modules/odc/infrastructure/entities/odc-status-history.orm-entity';
import { PurchaseOrderOrmEntity } from '../src/modules/odc/infrastructure/entities/purchase-order.orm-entity';
import { PurchaseOrderLineItemOrmEntity } from '../src/modules/odc/infrastructure/entities/purchase-order-line-item.orm-entity';
import { PurchaseOrderTypeOrmRepository } from '../src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository';
import { UserOrmEntity } from '../src/modules/users/infrastructure/entities/user.orm-entity';

const OPS = {
  userId: '00000000-0000-4000-8000-000000000001',
  role: 'DIRECTOR_OPS' as const,
};
const ADMIN = {
  userId: '00000000-0000-4000-8000-000000000002',
  role: 'ADMINISTRACION' as const,
};
const GENERAL = {
  userId: '00000000-0000-4000-8000-000000000003',
  role: 'DIRECTOR_GENERAL' as const,
};
const schema = `odc_test_${randomUUID().replaceAll('-', '')}`;
type Action =
  | 'submit'
  | 'approve_budget'
  | 'approve_purchase'
  | 'reject'
  | 'edit'
  | 'register_payment'
  | 'upload_payment_evidence'
  | 'upload_invoice';

// Both reads must complete before either use case can mutate the loaded version.
function synchronizeReads(
  repositories: PurchaseOrderTypeOrmRepository[],
): PurchaseOrderRepository[] {
  let remaining = 2;
  let release!: () => void;
  const gate = new Promise<void>((resolveGate) => {
    release = resolveGate;
  });
  return repositories.map((repository) => {
    const synchronized = Object.create(repository) as PurchaseOrderRepository;
    synchronized.findById = async (id) => {
      const order = await repository.findById(id);
      if (--remaining === 0) release();
      await gate;
      return order;
    };
    return synchronized;
  });
}

async function mutate(
  repository: PurchaseOrderRepository,
  action: Action,
  odcId: string,
  actor: OdcActor,
  side: string,
) {
  switch (action) {
    case 'submit':
      return new SubmitOdcUseCase(repository).execute(odcId, actor);
    case 'approve_budget':
      return new ApproveBudgetUseCase(repository).execute(odcId, actor);
    case 'approve_purchase':
      return new ApprovePurchaseUseCase(repository).execute(odcId, actor);
    case 'reject':
      return new RejectOdcUseCase(repository).execute(odcId, actor, {
        rejectionReason: `reason-${side}`,
      });
    case 'edit':
      return new UpdateDraftUseCase(repository, {
        findByName: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
      }).execute(odcId, { description: `edited-${side}` }, actor);
    case 'register_payment':
      return new RegisterPaymentUseCase(repository).execute(odcId, actor, {
        paymentDate: '2026-10-05',
        paymentMethod: `method-${side}`,
      });
    case 'upload_payment_evidence':
    case 'upload_invoice': {
      const storage = {
        upload: jest.fn((input: UploadFileInput) =>
          Promise.resolve({
            publicId: input.publicId!,
            resourceType: 'image',
            format: 'pdf',
          }),
        ),
        deleteIfOwned: jest.fn().mockResolvedValue('deleted'),
        getSignedUrl: jest.fn(),
      };
      const input = {
        buffer: Buffer.from('%PDF-'),
        mimeType: 'application/pdf',
        warehouseEntryDate: '2026-10-05',
        evidenceReference: side,
      };
      return action === 'upload_invoice'
        ? new UploadInvoiceUseCase(repository, storage).execute(
            odcId,
            actor,
            input,
          )
        : new UploadPaymentEvidenceUseCase(repository, storage).execute(
            odcId,
            actor,
            input,
          );
    }
  }
}

const races: {
  name: string;
  status: OdcStatus;
  actions: [Action, Action];
  actor: OdcActor;
}[] = [
  {
    name: 'budget approve/reject',
    status: 'PENDIENTE_ADMIN',
    actions: ['approve_budget', 'reject'],
    actor: ADMIN,
  },
  {
    name: 'purchase approve/reject',
    status: 'PRESUPUESTO_APROBADO',
    actions: ['approve_purchase', 'reject'],
    actor: GENERAL,
  },
  {
    name: 'double submit',
    status: 'BORRADOR',
    actions: ['submit', 'submit'],
    actor: OPS,
  },
  {
    name: 'double resubmit',
    status: 'RECHAZADA',
    actions: ['submit', 'submit'],
    actor: OPS,
  },
  {
    name: 'edit/submit',
    status: 'BORRADOR',
    actions: ['edit', 'submit'],
    actor: OPS,
  },
  {
    name: 'submit/edit',
    status: 'BORRADOR',
    actions: ['submit', 'edit'],
    actor: OPS,
  },
  {
    name: 'two same-state edits',
    status: 'BORRADOR',
    actions: ['edit', 'edit'],
    actor: OPS,
  },
  {
    name: 'double budget approval',
    status: 'PENDIENTE_ADMIN',
    actions: ['approve_budget', 'approve_budget'],
    actor: ADMIN,
  },
  {
    name: 'double purchase approval',
    status: 'PRESUPUESTO_APROBADO',
    actions: ['approve_purchase', 'approve_purchase'],
    actor: GENERAL,
  },
  {
    name: 'double rejection',
    status: 'PENDIENTE_ADMIN',
    actions: ['reject', 'reject'],
    actor: ADMIN,
  },
  {
    name: 'double payment',
    status: 'COMPRA_APROBADA',
    actions: ['register_payment', 'register_payment'],
    actor: OPS,
  },
  {
    name: 'double payment evidence',
    status: 'PAGO_REGISTRADO',
    actions: ['upload_payment_evidence', 'upload_payment_evidence'],
    actor: ADMIN,
  },
  {
    name: 'double invoice',
    status: 'EVIDENCIA_PAGO_SUBIDA',
    actions: ['upload_invoice', 'upload_invoice'],
    actor: OPS,
  },
];

describe('R1,R2,R4,R5,R6: atomic mutations on two isolated PostgreSQL connections (#36)', () => {
  const sources: DataSource[] = [];
  let repositories: PurchaseOrderTypeOrmRepository[];
  let order: PurchaseOrder;
  let schemaCreated = false;
  beforeAll(async () => {
    const url = process.env.ODC_TEST_DATABASE_URL;
    if (!url)
      throw new Error(
        'Use scripts/verify-postgres-hardening.sh; no default/shared database is allowed.',
      );
    for (let index = 0; index < 2; index++) {
      const source = new DataSource({
        type: 'postgres',
        url,
        schema,
        entities: [
          OdcFileUploadOrmEntity,
          UserOrmEntity,
          PurchaseOrderOrmEntity,
          PurchaseOrderLineItemOrmEntity,
          OdcStatusHistoryOrmEntity,
        ],
        synchronize: false,
        extra: { max: 1 },
      });
      sources.push(source);
      await source.initialize();
    }
    await sources[0].query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    await sources[0].synchronize();
    repositories = sources.map(
      (source) => new PurchaseOrderTypeOrmRepository(source),
    );
    for (const actor of [OPS, ADMIN, GENERAL]) {
      await sources[0].manager.save(UserOrmEntity, {
        id: actor.userId,
        role: actor.role,
        email: `${actor.role}@test.invalid`,
        passwordHash: 'unused',
        fullName: actor.role,
      });
    }
    const [left, right] = await Promise.all(
      sources.map((source) =>
        source.query<{ pid: number }[]>('SELECT pg_backend_pid() AS pid'),
      ),
    );
    expect(left[0].pid).not.toBe(right[0].pid);
  }, 30_000);
  afterAll(async () => {
    if (schemaCreated && sources[0]?.isInitialized)
      await sources[0].query(`DROP SCHEMA "${schema}" CASCADE`);
    await Promise.all(
      sources
        .filter((source) => source.isInitialized)
        .map((source) => source.destroy()),
    );
  });
  beforeEach(async () => {
    const draft = PurchaseOrder.createDraft(
      {
        description: 'original',
        quantity: 1,
        unit: 'pza',
        unitPriceCents: 100,
        supplier: 'Test',
      },
      OPS,
    );
    order = await repositories[0].create(
      draft.order,
      new OdcStatusHistoryEntry(
        null,
        null,
        null,
        'BORRADOR',
        OPS.userId,
        null,
        null,
      ),
    );
  });

  it('R2: persists and reloads a new VAT breakdown with its line items', async () => {
    const loaded = (await repositories[1].findById(order.id!))!;
    expect(loaded).toMatchObject({
      subtotalCents: 100,
      vatRateBps: 1600,
      vatCents: 16,
      totalCents: 116,
    });
    expect(loaded.items).toHaveLength(1);
  });

  it('R3: converts a historical draft on a successful save while retaining history', async () => {
    await sources[0].manager.update(
      PurchaseOrderOrmEntity,
      { id: order.id! },
      {
        subtotalCents: 100,
        vatRateBps: 0,
        vatCents: 0,
        totalCents: 100,
      },
    );
    const prior = (await repositories[0].findById(order.id!))!;
    const useCase = new UpdateDraftUseCase(repositories[0], {
      findByName: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    });
    await useCase.execute(order.id!, { comments: 'Nota' }, OPS);
    const saved = (await repositories[1].findById(order.id!))!;
    expect(saved).toMatchObject({
      subtotalCents: 100,
      vatRateBps: 1600,
      vatCents: 16,
      totalCents: 116,
      status: 'BORRADOR',
    });
    expect(saved.history).toEqual(prior.history);
  });

  it('R3: keeps the historical zero rate for a rejected order after an edit', async () => {
    await sources[0].manager.update(
      PurchaseOrderOrmEntity,
      { id: order.id! },
      {
        status: 'RECHAZADA',
        subtotalCents: 100,
        vatRateBps: 0,
        vatCents: 0,
        totalCents: 100,
      },
    );
    const useCase = new UpdateDraftUseCase(repositories[0], {
      findByName: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    });
    await useCase.execute(order.id!, { unitPriceCents: 200 }, OPS);
    const saved = (await repositories[1].findById(order.id!))!;
    expect(saved).toMatchObject({
      subtotalCents: 200,
      vatRateBps: 0,
      vatCents: 0,
      totalCents: 200,
      status: 'RECHAZADA',
    });
  });

  it.each(races)('R1,R2,R4: one winner for $name', async (race) => {
    await sources[0].manager.update(
      PurchaseOrderOrmEntity,
      { id: order.id! },
      { status: race.status },
    );
    const synchronized = synchronizeReads(repositories);
    const results = await Promise.allSettled(
      race.actions.map((action, index) =>
        mutate(
          synchronized[index],
          action,
          order.id!,
          race.actor,
          String(index),
        ),
      ),
    );
    const successes = results.filter((result) => result.status === 'fulfilled');
    const failures = results.filter((result) => result.status === 'rejected');
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].reason).toBeInstanceOf(OdcConcurrentUpdateError);
    const winner = successes[0].value;
    const stored = await repositories[0].findById(order.id!);
    expect(stored).toMatchObject({
      version: 1,
      status: winner.status,
      description: winner.description,
      paymentMethod: winner.paymentMethod,
      paymentDate: winner.paymentDate,
      invoiceDate: winner.invoiceDate,
      warehouseEntryDate: winner.warehouseEntryDate,
      rejectionReason: winner.rejectionReason,
      invoiceFile: winner.invoiceFile,
      paymentEvidenceFile: winner.paymentEvidenceFile,
    });
    const transitions = stored!.history.filter(
      (entry) => entry.fromStatus !== null,
    );
    if (winner.status === race.status) expect(transitions).toHaveLength(0);
    else {
      expect(transitions).toHaveLength(1);
      expect(transitions[0]).toMatchObject({
        fromStatus: race.status,
        toStatus: winner.status,
        userId: race.actor.userId,
      });
    }
  });

  it('R2: rolls back the winning update/version if history insertion fails', async () => {
    const loaded = (await repositories[0].findById(order.id!))!;
    loaded.transition('submit', OPS.role);
    const invalidHistory = new OdcStatusHistoryEntry(
      null,
      order.id,
      'BORRADOR',
      'PENDIENTE_ADMIN',
      randomUUID(),
      null,
      null,
    );
    await expect(
      repositories[0].update(loaded, invalidHistory),
    ).rejects.toThrow();
    const stored = await repositories[0].findById(order.id!);
    expect(stored).toMatchObject({ status: 'BORRADOR', version: 0 });
    expect(stored!.history).toHaveLength(1);
  });

  it('R1,R5: another edit succeeds only after loading the newly persisted version', async () => {
    expect(order).toMatchObject({ version: 0 });
    const first = (await repositories[0].findById(order.id!))!;
    first.edit({ description: 'first' });
    const saved = await repositories[0].update(first);
    expect(saved).toMatchObject({ version: 1 });
    const latest = (await repositories[1].findById(order.id!))!;
    latest.edit({ description: 'second' });
    expect(await repositories[1].update(latest)).toMatchObject({
      version: 2,
      description: 'second',
    });
    first.edit({ description: 'stale' });
    await expect(repositories[0].update(first)).rejects.toMatchObject({
      name: 'OdcConcurrentUpdateError',
    });
    expect(await repositories[0].findById(order.id!)).toMatchObject({
      version: 2,
      description: 'second',
    });
  });

  it('R5: additive SQL initializes legacy rows without changing data and is idempotent', async () => {
    const source = sources[0];
    await source.query(
      `ALTER TABLE "${schema}"."purchase_orders" DROP COLUMN IF EXISTS version`,
    );
    await source.query(`SET search_path TO "${schema}"`);
    const sql = readFileSync(
      resolve(__dirname, '../scripts/sql/036-odc-version.sql'),
      'utf8',
    );
    await source.query(sql);
    await source.query(sql);
    const loaded = await repositories[0].findById(order.id!);
    expect(loaded).toMatchObject({
      version: 0,
      id: order.id,
      description: 'original',
      status: 'BORRADOR',
    });
    expect(loaded!.history).toHaveLength(1);
  });

  describe('R1,R2,R3: persisted mutation responses and rollback (#40)', () => {
    let app: INestApplication;
    let server: Server;
    let jwt: JwtService;
    const storage = {
      upload: jest.fn((input: UploadFileInput) =>
        Promise.resolve({
          publicId: input.publicId!,
          resourceType: 'image',
          format: 'pdf',
        }),
      ),
      deleteIfOwned: jest.fn().mockResolvedValue('deleted'),
      getSignedUrl: jest.fn(),
    };
    const uploads = [
      {
        path: 'payment-evidence',
        status: 'PAGO_REGISTRADO',
        finalStatus: 'EVIDENCIA_PAGO_SUBIDA',
        actor: ADMIN,
        field: 'paymentEvidenceFile',
        flag: 'hasPaymentEvidence',
        fields: { evidenceReference: 'PAY-40' },
      },
      {
        path: 'invoice',
        status: 'EVIDENCIA_PAGO_SUBIDA',
        finalStatus: 'COMPLETADA',
        actor: OPS,
        field: 'invoiceFile',
        flag: 'hasInvoice',
        fields: {
          warehouseEntryDate: '2026-10-05',
          invoiceNumber: 'INV-40',
          invoiceDate: '2026-10-04',
        },
      },
    ] as const;

    beforeAll(async () => {
      const dependencies = Reflect.getMetadata(
        'design:paramtypes',
        OdcController,
      ) as Type<unknown>[];
      const module = await Test.createTestingModule({
        imports: [
          JwtModule.register({ secret: 'history-response-tests-only' }),
        ],
        controllers: [OdcController],
        providers: [
          ...dependencies
            .filter(
              (type) =>
                type !== UploadInvoiceUseCase &&
                type !== UploadPaymentEvidenceUseCase,
            )
            .map((type) => ({
              provide: type,
              useValue: { execute: jest.fn() },
            })),
          UploadInvoiceUseCase,
          UploadPaymentEvidenceUseCase,
          JwtAuthGuard,
          RolesGuard,
          { provide: 'PurchaseOrderRepository', useValue: repositories[0] },
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
      await app?.close();
    });
    beforeEach(() => jest.clearAllMocks());

    function failingHistoryRepository(error: Error) {
      const source = Object.create(sources[0]) as DataSource;
      source.transaction = (async (
        run: (manager: EntityManager) => Promise<unknown>,
      ) =>
        sources[0].transaction(async (manager) => {
          const originalFind = manager.find.bind(
            manager,
          ) as EntityManager['find'];
          jest
            .spyOn(manager, 'find')
            .mockImplementation((target: unknown, options: unknown) => {
              if (target === OdcStatusHistoryOrmEntity)
                return Promise.reject(error);
              return originalFind(target, options);
            });
          return run(manager);
        })) as DataSource['transaction'];
      return new PurchaseOrderTypeOrmRepository(source);
    }

    it('R1: create and an ordinary edit return the complete stored history with no extra event', async () => {
      const persisted = (await repositories[1].findById(order.id!))!;
      expect(order.history).toHaveLength(1);
      expect(order.history).toEqual(persisted.history);
      expect(order.history[0]).toMatchObject({
        id: expect.any(String) as unknown,
        userId: OPS.userId,
        createdAt: expect.any(Date) as unknown,
      });
      order.edit({ description: 'Edited without a transition' });
      const edited = await repositories[0].update(order);
      expect(edited.history).toEqual(persisted.history);
      expect((await repositories[1].findById(order.id!))!.history).toEqual(
        edited.history,
      );
    });

    it.each(uploads)(
      'R2: POST $path returns old events plus the newly persisted transition without another detail read',
      async (upload) => {
        await sources[0].manager.update(
          PurchaseOrderOrmEntity,
          { id: order.id! },
          { status: upload.status },
        );
        await sources[0].manager.update(
          OdcStatusHistoryOrmEntity,
          { odcId: order.id! },
          {
            createdAt: new Date('2000-01-01T00:00:00Z'),
            note: 'Opening retained',
          },
        );
        await sources[0].manager.save(OdcStatusHistoryOrmEntity, {
          odcId: order.id!,
          fromStatus: 'BORRADOR',
          toStatus: upload.status,
          userId: OPS.userId,
          note: 'Earlier event retained',
          createdAt: new Date('2001-01-01T00:00:00Z'),
        });
        const prior = (await repositories[1].findById(order.id!))!.history;
        const detailReads = jest.spyOn(repositories[0], 'findById');
        try {
          const response = await request(server)
            .post('/api/odcs/' + order.id! + '/' + upload.path)
            .set(
              'Cookie',
              'odc_session=' +
                jwt.sign({ sub: upload.actor.userId, role: upload.actor.role }),
            )
            .field(upload.fields)
            .attach('file', Buffer.from('%PDF-1.4\n%%EOF\n'), {
              filename: 'receipt.pdf',
              contentType: 'application/pdf',
            })
            .expect(200);
          const body = response.body as {
            history: (Omit<OdcStatusHistoryEntry, 'createdAt'> & {
              createdAt: string | null;
            })[];
          };
          expect(detailReads).toHaveBeenCalledTimes(1); // The use case loads once before uploading; no repairing GET.
          expect(response.body).toMatchObject({
            status: upload.finalStatus,
            [upload.flag]: true,
          });
          expect(body.history).toHaveLength(prior.length + 1);
          expect(body.history.slice(0, prior.length)).toEqual(
            JSON.parse(JSON.stringify(prior)),
          );
          const persisted = (await repositories[1].findById(order.id!))!;
          expect(body.history).toEqual(
            JSON.parse(JSON.stringify(persisted.history)),
          );
          expect(body.history.at(-1)).toMatchObject({
            id: expect.any(String) as unknown,
            fromStatus: upload.status,
            toStatus: upload.finalStatus,
            userId: upload.actor.userId,
            createdAt: expect.any(String) as unknown,
          });
          expect(persisted[upload.field]).toContain('cloudinary:v1:');
          expect(storage.deleteIfOwned).not.toHaveBeenCalled();
        } finally {
          detailReads.mockRestore();
        }
      },
    );

    it('R3: failed response-history read rolls back a newly created order and its opening event', async () => {
      const counts = await Promise.all([
        sources[1].manager.count(PurchaseOrderOrmEntity),
        sources[1].manager.count(OdcStatusHistoryOrmEntity),
      ]);
      const error = new Error('response history unavailable');
      const draft = PurchaseOrder.createDraft(
        {
          description: 'rolled back',
          quantity: 1,
          unit: 'pza',
          unitPriceCents: 100,
          supplier: 'Test',
        },
        OPS,
      );
      await expect(
        failingHistoryRepository(error).create(
          draft.order,
          new OdcStatusHistoryEntry(
            null,
            null,
            null,
            'BORRADOR',
            OPS.userId,
            null,
            null,
          ),
        ),
      ).rejects.toBe(error);
      expect(
        await Promise.all([
          sources[1].manager.count(PurchaseOrderOrmEntity),
          sources[1].manager.count(OdcStatusHistoryOrmEntity),
        ]),
      ).toEqual(counts);
    });

    it('R3: failed response-history read rolls back the order, transition and upload association', async () => {
      await sources[0].manager.update(
        PurchaseOrderOrmEntity,
        { id: order.id! },
        { status: 'PAGO_REGISTRADO' },
      );
      const loaded = (await repositories[0].findById(order.id!))!;
      const ticket = await repositories[0].prepareFileUpload(
        loaded,
        'paymentEvidenceFile',
        'odc/test/evidence',
      );
      const record = loaded.transition('upload_payment_evidence', ADMIN.role, {
        paymentEvidenceFile: 'cloudinary:v1:image:pdf:' + ticket.publicId,
      });
      const error = new Error('response history unavailable');
      await expect(
        failingHistoryRepository(error).update(
          loaded,
          new OdcStatusHistoryEntry(
            null,
            order.id,
            record.fromStatus,
            record.toStatus,
            ADMIN.userId,
            null,
            null,
          ),
          ticket,
        ),
      ).rejects.toBe(error);
      const persisted = (await repositories[1].findById(order.id!))!;
      expect(persisted).toMatchObject({
        status: 'PAGO_REGISTRADO',
        version: 0,
        paymentEvidenceFile: null,
      });
      expect(persisted.history).toHaveLength(1);
      expect(
        await sources[1].manager.findOneByOrFail(OdcFileUploadOrmEntity, {
          id: ticket.id,
        }),
      ).toMatchObject({ state: 'pending', uploadConfirmed: false });
    });

    it.each(uploads)(
      'R2,R3: failed $path response read preserves history and compensates only the unassociated file',
      async (upload) => {
        await sources[0].manager.update(
          PurchaseOrderOrmEntity,
          { id: order.id! },
          { status: upload.status },
        );
        const prior = (await repositories[1].findById(order.id!))!;
        const previousResponse = toOdcResponse(prior);
        const error = new Error('response history unavailable');
        const repository = failingHistoryRepository(error);
        const input = {
          buffer: Buffer.from('%PDF-'),
          mimeType: 'application/pdf',
          warehouseEntryDate: '2026-10-05',
        };
        const pending =
          upload.path === 'invoice'
            ? new UploadInvoiceUseCase(repository, storage).execute(
                order.id!,
                upload.actor,
                input,
              )
            : new UploadPaymentEvidenceUseCase(repository, storage).execute(
                order.id!,
                upload.actor,
                input,
              );
        await expect(pending).rejects.toBe(error);
        const persisted = (await repositories[1].findById(order.id!))!;
        expect(toOdcResponse(persisted)).toEqual(previousResponse);
        expect(storage.deleteIfOwned).toHaveBeenCalledTimes(1);
        const ticket = await sources[1].manager.findOneByOrFail(
          OdcFileUploadOrmEntity,
          { orderId: order.id! },
        );
        expect(storage.deleteIfOwned).toHaveBeenCalledWith(
          expect.objectContaining({ publicId: ticket.publicId }),
        );
        expect(ticket).toMatchObject({ state: 'done', uploadConfirmed: true });
      },
    );
  });
});
