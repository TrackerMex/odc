import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { FileStorageService } from '../../../files/domain/services/file-storage.service';
import { UploadInvoiceUseCase } from './upload-invoice.usecase';
import { UploadPaymentEvidenceUseCase } from './upload-payment-evidence.usecase';

const ticket = {
  id: 'test-ticket', publicId: 'odc/test/new', field: 'invoiceFile',
  orderId: 'test-order', expectedVersion: 0, uploadConfirmed: true,
};
const original = new Error('original database failure');
function setup(invoice: boolean) {
  const order = PurchaseOrder.createDraft({ description: 'test', quantity: 1,
    unit: 'pza', unitPriceCents: 100, supplier: 'test' },
    { userId: 'ops', role: 'DIRECTOR_OPS' }).order;
  Object.assign(order, { id: 'test-order', odcNumber: 'ODC-test',
    status: invoice ? 'EVIDENCIA_PAGO_SUBIDA' : 'PAGO_REGISTRADO' });
  const repo = {
    findById: jest.fn().mockResolvedValue(order),
    prepareFileUpload: jest.fn().mockResolvedValue(ticket),
    update: jest.fn().mockRejectedValue(original),
    claimFileRecovery: jest.fn().mockResolvedValue(ticket),
    finishFileRecovery: jest.fn().mockResolvedValue(undefined),
  };
  const storage = {
    upload: jest.fn().mockResolvedValue({ publicId: ticket.publicId, resourceType: 'image', format: 'pdf' }),
    deleteIfOwned: jest.fn().mockResolvedValue('deleted'),
    getSignedUrl: jest.fn(),
  };
  const port = repo as unknown as PurchaseOrderRepository;
  const files = storage as FileStorageService;
  const input = { buffer: Buffer.from('%PDF-'), mimeType: 'application/pdf', warehouseEntryDate: '2026-10-05' };
  const run = () => invoice
    ? new UploadInvoiceUseCase(port, files).execute('test-order', { userId: 'ops', role: 'DIRECTOR_OPS' }, input)
    : new UploadPaymentEvidenceUseCase(port, files).execute('test-order', { userId: 'admin', role: 'ADMINISTRACION' }, input);
  return { repo, storage, run, order };
}

describe.each([true, false])('R1,R2,R4,R5: durable recovery, invoice=%s', (invoice) => {
  it('reserves before upload, compensates the new asset and preserves the DB error', async () => {
    const { repo, storage, run } = setup(invoice);
    await expect(run()).rejects.toBe(original);
    expect(repo.prepareFileUpload).toHaveBeenCalledTimes(1);
    expect(repo.prepareFileUpload.mock.invocationCallOrder[0]).toBeLessThan(storage.upload.mock.invocationCallOrder[0]);
    expect(storage.upload).toHaveBeenCalledWith(expect.objectContaining({ publicId: ticket.publicId, uploadToken: ticket.id }));
    expect(repo.update).toHaveBeenCalledWith(expect.any(PurchaseOrder), expect.anything(), ticket);
    expect(repo.claimFileRecovery).toHaveBeenCalledWith(ticket.id, { immediate: true, uploadConfirmed: true });
    expect(storage.deleteIfOwned).toHaveBeenCalledWith({ publicId: ticket.publicId, uploadToken: ticket.id });
    expect(repo.finishFileRecovery).toHaveBeenCalledWith(ticket.id, 'deleted');
  });
  it('failed cleanup remains durable and does not replace the original failure', async () => {
    const { repo, storage, run } = setup(invoice);
    storage.deleteIfOwned.mockRejectedValue(new Error('provider secret diagnostic'));
    await expect(run()).rejects.toBe(original);
    expect(repo.finishFileRecovery).toHaveBeenCalledWith(ticket.id, 'failed');
  });
  it('unresolved database outcome never authorizes deletion', async () => {
    const { repo, storage, run } = setup(invoice);
    repo.claimFileRecovery.mockRejectedValue(new Error('offline'));
    await expect(run()).rejects.toBe(original);
    expect(storage.deleteIfOwned).not.toHaveBeenCalled();
  });
  it('acknowledgement lost after commit protects the associated asset', async () => {
    const { repo, storage, run } = setup(invoice);
    repo.claimFileRecovery.mockResolvedValue(null);
    await expect(run()).rejects.toBe(original);
    expect(storage.deleteIfOwned).not.toHaveBeenCalled();
  });
  it('failed durable reservation never uploads', async () => {
    const { repo, storage, run } = setup(invoice);
    repo.prepareFileUpload.mockRejectedValue(original);
    await expect(run()).rejects.toBe(original);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it('provider timeout keeps a recovery ticket without claiming a successful upload', async () => {
    const { repo, storage, run } = setup(invoice);
    storage.upload.mockRejectedValue(original);
    await expect(run()).rejects.toBe(original);
    expect(repo.claimFileRecovery).toHaveBeenCalledWith(ticket.id, { immediate: true, uploadConfirmed: false });
    expect(repo.update).not.toHaveBeenCalled();
  });
});
