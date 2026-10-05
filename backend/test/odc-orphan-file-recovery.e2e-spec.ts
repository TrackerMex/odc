import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { PurchaseOrder, OdcStatus } from '../src/modules/odc/domain/entities/purchase-order.entity';
import { OdcStatusHistoryEntry } from '../src/modules/odc/domain/entities/odc-status-history-entry.entity';
import { OdcConcurrentUpdateError } from '../src/modules/odc/domain/errors/odc-concurrent-update.error';
import { OdcFileUploadOrmEntity } from '../src/modules/odc/infrastructure/entities/odc-file-upload.orm-entity';
import { OdcStatusHistoryOrmEntity } from '../src/modules/odc/infrastructure/entities/odc-status-history.orm-entity';
import { PurchaseOrderOrmEntity } from '../src/modules/odc/infrastructure/entities/purchase-order.orm-entity';
import { PurchaseOrderTypeOrmRepository } from '../src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository';
import { UserOrmEntity } from '../src/modules/users/infrastructure/entities/user.orm-entity';
import { UploadInvoiceUseCase } from '../src/modules/odc/application/use-cases/upload-invoice.usecase';
import { UploadPaymentEvidenceUseCase } from '../src/modules/odc/application/use-cases/upload-payment-evidence.usecase';
import { recoverFileUpload } from '../src/modules/odc/application/recover-file-upload';
import { UploadFileInput } from '../src/modules/files/domain/services/file-storage.service';

const schema = `odc_test_${randomUUID().replaceAll('-', '')}`;
const actor = { userId: randomUUID(), role: 'DIRECTOR_OPS' as const };
const sources: DataSource[] = [];
let repos: PurchaseOrderTypeOrmRepository[];
let order: PurchaseOrder;
let schemaCreated = false;
beforeAll(async () => {
  const url = process.env.ODC_TEST_DATABASE_URL;
  if (!url) throw new Error('Use isolated verify-postgres-hardening.sh');
  for (let index = 0; index < 2; index++) {
    const source = new DataSource({ type: 'postgres', url, schema, synchronize: false, extra: { max: 2 },
      entities: [UserOrmEntity, PurchaseOrderOrmEntity, OdcStatusHistoryOrmEntity, OdcFileUploadOrmEntity] });
    sources.push(source); await source.initialize();
  }
  await sources[0].query(`CREATE SCHEMA "${schema}"`); schemaCreated = true;
  await sources[0].synchronize();
  repos = sources.map((s) => new PurchaseOrderTypeOrmRepository(s));
  await sources[0].manager.save(UserOrmEntity, { id: actor.userId, role: actor.role,
    email: 'recovery@test.invalid', passwordHash: 'unused', fullName: 'test' });
}, 30_000);
afterAll(async () => {
  if (schemaCreated) await sources[0].query(`DROP SCHEMA "${schema}" CASCADE`);
  await Promise.all(sources.filter((s) => s.isInitialized).map((s) => s.destroy()));
});
beforeEach(async () => {
  const draft = PurchaseOrder.createDraft({ description: 'test', quantity: 1, unit: 'pza', unitPriceCents: 100, supplier: 'test' }, actor);
  order = await repos[0].create(draft.order, new OdcStatusHistoryEntry(null, null, null, 'BORRADOR', actor.userId, null, null));
});
function files() {
  return { getSignedUrl: jest.fn(),
    upload: jest.fn(async (input: UploadFileInput) => ({ publicId: input.publicId!, resourceType: 'image', format: 'pdf' })),
    deleteIfOwned: jest.fn().mockResolvedValue('deleted') };
}
async function run(invoice: boolean, repo = repos[0], storage = files()) {
  const status: OdcStatus = invoice ? 'EVIDENCIA_PAGO_SUBIDA' : 'PAGO_REGISTRADO';
  await sources[0].manager.update(PurchaseOrderOrmEntity, { id: order.id! }, { status });
  const input = { buffer: Buffer.from('%PDF-'), mimeType: 'application/pdf', warehouseEntryDate: '2026-10-05' };
  return invoice ? new UploadInvoiceUseCase(repo, storage).execute(order.id!, actor, input)
    : new UploadPaymentEvidenceUseCase(repo, storage).execute(order.id!, { ...actor, role: 'ADMINISTRACION' }, input);
}

describe.each([true, false])('R1,R2,R3,R4,R5: real database recovery, invoice=%s', (invoice) => {
  it('associated receipt, version and history commit atomically', async () => {
    const storage = files(); await run(invoice, repos[0], storage);
    const [job] = await sources[0].manager.find(OdcFileUploadOrmEntity, { where: { orderId: order.id! } });
    expect(job).toMatchObject({ state: 'associated', expectedVersion: 0 });
    expect(await repos[1].claimFileRecovery(job.id, { immediate: true })).toBeNull();
    expect((await repos[1].findById(order.id!))!.version).toBe(1);
    expect((await repos[1].findById(order.id!))!.history).toHaveLength(2);
    expect(storage.deleteIfOwned).not.toHaveBeenCalled();
  });
  it('lost commit acknowledgement consults durable receipt and never deletes', async () => {
    const storage = files(), ambiguous = new Error('commit acknowledgement lost');
    const repo = Object.create(repos[0]) as PurchaseOrderTypeOrmRepository;
    repo.update = async (...args) => { await repos[0].update(...args); throw ambiguous; };
    await expect(run(invoice, repo, storage)).rejects.toBe(ambiguous);
    expect(storage.deleteIfOwned).not.toHaveBeenCalled();
    expect((await sources[1].manager.findOneByOrFail(OdcFileUploadOrmEntity, { orderId: order.id! })).state).toBe('associated');
  });
  it('history failure rolls back association and cleans only new asset', async () => {
    const storage = files();
    const repo = Object.create(repos[0]) as PurchaseOrderTypeOrmRepository;
    repo.update = (loaded, entry, ticket) => repos[0].update(loaded,
      new OdcStatusHistoryEntry(null, order.id, entry!.fromStatus, entry!.toStatus, randomUUID(), null, null), ticket);
    await expect(run(invoice, repo, storage)).rejects.toThrow();
    expect(storage.deleteIfOwned).toHaveBeenCalledTimes(1);
    const stored = (await repos[1].findById(order.id!))!;
    expect(stored.version).toBe(0); expect(stored.history).toHaveLength(1);
    expect(stored[invoice ? 'invoiceFile' : 'paymentEvidenceFile']).toBeNull();
    expect((await sources[1].manager.findOneByOrFail(OdcFileUploadOrmEntity, { orderId: order.id! })).state).toBe('done');
  });
  it('cleanup failure survives repository recreation and retry is idempotent', async () => {
    const storage = files(); storage.deleteIfOwned.mockRejectedValueOnce(new Error('cleanup failed'));
    const repo = Object.create(repos[0]) as PurchaseOrderTypeOrmRepository;
    const original = new Error('timeout before commit'); repo.update = async () => { throw original; };
    await expect(run(invoice, repo, storage)).rejects.toBe(original);
    const job = await sources[1].manager.findOneByOrFail(OdcFileUploadOrmEntity, { orderId: order.id! });
    expect(job).toMatchObject({ state: 'retry', attempts: 1, lastOutcome: 'failed', uploadConfirmed: true });
    const fresh = new PurchaseOrderTypeOrmRepository(sources[1]);
    await recoverFileUpload(fresh, storage, job.id, { immediate: true });
    await recoverFileUpload(fresh, storage, job.id, { immediate: true });
    expect(storage.deleteIfOwned).toHaveBeenCalledTimes(2);
    expect((await sources[0].manager.findOneByOrFail(OdcFileUploadOrmEntity, { id: job.id })).state).toBe('done');
  });
});
describe('R2,R3,R4,R5: fencing and durable outcomes', () => {
  it('recovery fences a late update before removing its file', async () => {
    const loaded = (await repos[0].findById(order.id!))!;
    const ticket = await repos[0].prepareFileUpload(loaded, 'invoiceFile', 'odc/test/invoice');
    expect(await repos[1].claimFileRecovery(ticket.id, { immediate: true, uploadConfirmed: true })).toMatchObject({ id: ticket.id });
    loaded.invoiceFile = `cloudinary:v1:image:pdf:${ticket.publicId}`;
    await expect(repos[0].update(loaded, undefined, ticket)).rejects.toBeInstanceOf(OdcConcurrentUpdateError);
    expect((await repos[0].findById(order.id!))!.version).toBe(0);
  });
  it('unknown upload absent now remains durable for a late provider completion', async () => {
    const ticket = await repos[0].prepareFileUpload(order, 'invoiceFile', 'odc/test/invoice');
    const storage = files(); storage.deleteIfOwned.mockResolvedValue('missing');
    await recoverFileUpload(repos[0], storage, ticket.id, { immediate: true });
    expect(await sources[1].manager.findOneByOrFail(OdcFileUploadOrmEntity, { id: ticket.id })).toMatchObject({ state: 'retry', uploadConfirmed: false, lastOutcome: 'missing' });
    storage.deleteIfOwned.mockResolvedValue('deleted');
    await recoverFileUpload(repos[1], storage, ticket.id, { immediate: true });
    expect((await sources[0].manager.findOneByOrFail(OdcFileUploadOrmEntity, { id: ticket.id })).state).toBe('done');
  });
  it('persisted raw/serialized association protects even another document field', async () => {
    const ticket = await repos[0].prepareFileUpload(order, 'invoiceFile', 'odc/test/invoice');
    await sources[0].manager.update(PurchaseOrderOrmEntity, { id: order.id! }, { paymentEvidenceFile: ticket.publicId });
    expect(await repos[1].claimFileRecovery(ticket.id, { immediate: true })).toBeNull();
    expect((await sources[0].manager.findOneByOrFail(OdcFileUploadOrmEntity, { id: ticket.id })).state).toBe('associated');
  });
  it('two connections cannot claim the same active lease', async () => {
    const ticket = await repos[0].prepareFileUpload(order, 'invoiceFile', 'odc/test/invoice');
    const result = await Promise.all(repos.map((repo) => repo.claimFileRecovery(ticket.id, { immediate: true })));
    expect(result.filter(Boolean)).toHaveLength(1);
  });
  it('two concurrent uploads leave winner associated and compensate only loser', async () => {
    await sources[0].manager.update(PurchaseOrderOrmEntity, { id: order.id! }, { status: 'EVIDENCIA_PAGO_SUBIDA' });
    let remaining = 2; let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    const storage = files();
    storage.upload.mockImplementation(async (input) => {
      if (--remaining === 0) release(); await gate;
      return { publicId: input.publicId!, resourceType: 'image', format: 'pdf' };
    });
    const input = { buffer: Buffer.from('%PDF-'), mimeType: 'application/pdf', warehouseEntryDate: '2026-10-05' };
    const results = await Promise.allSettled(repos.map((repo) => new UploadInvoiceUseCase(repo, storage).execute(order.id!, actor, input)));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    const jobs = await sources[0].manager.find(OdcFileUploadOrmEntity, { where: { orderId: order.id! } });
    expect(jobs.map((j) => j.state).sort()).toEqual(['associated', 'done']);
    const loser = jobs.find((j) => j.state === 'done')!;
    expect(storage.deleteIfOwned).toHaveBeenCalledWith({ publicId: loser.publicId, uploadToken: loser.id });
    expect((await repos[0].findById(order.id!))!.invoiceFile).not.toContain(loser.publicId);
  });
  it('additive SQL is idempotent without deleting existing jobs', async () => {
    const ticket = await repos[0].prepareFileUpload(order, 'invoiceFile', 'odc/test/invoice');
    await sources[0].query(`SET search_path TO "${schema}"`);
    const sql = readFileSync(resolve(__dirname, '../scripts/sql/038-odc-file-uploads.sql'), 'utf8');
    await sources[0].query(sql); await sources[0].query(sql);
    expect(await sources[0].manager.findOneByOrFail(OdcFileUploadOrmEntity, { id: ticket.id })).toMatchObject({ publicId: ticket.publicId });
  });
});
