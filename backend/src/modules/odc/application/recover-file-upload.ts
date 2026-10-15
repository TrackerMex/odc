import { FileStorageUnavailableError } from '../../files/domain/errors/file-storage-unavailable.error';
import {
  serializeFileReference,
  type UploadFileInput,
} from '../../files/domain/services/file-storage.service';
import type { PurchaseOrder } from '../domain/entities/purchase-order.entity';
import type { OdcStatusHistoryEntry } from '../domain/entities/odc-status-history-entry.entity';
import type { UploadField } from '../domain/repositories/purchase-order.repository';
import type { FileStorageService } from '../../files/domain/services/file-storage.service';
import type {
  PurchaseOrderRepository,
  FileRecoveryOptions,
} from '../domain/repositories/purchase-order.repository';

// Failure leaves an already durable ticket. Never mask the request's original error.
export async function recoverFileUpload(
  repo: PurchaseOrderRepository,
  storage: FileStorageService,
  id: string,
  options: FileRecoveryOptions = {},
): Promise<boolean> {
  try {
    const ticket = await repo.claimFileRecovery(id, options);
    if (!ticket) return true;
    let outcome: 'deleted' | 'missing' | 'not_owned' | 'failed';
    try {
      outcome = await storage.deleteIfOwned({
        publicId: ticket.publicId,
        uploadToken: ticket.id,
      });
    } catch {
      outcome = 'failed';
    }
    await repo.finishFileRecovery(id, outcome);
    return outcome !== 'failed';
  } catch {
    return false;
  }
}

export async function uploadOrderFile(
  repo: PurchaseOrderRepository,
  storage: FileStorageService,
  order: PurchaseOrder,
  entry: OdcStatusHistoryEntry,
  field: UploadField,
  input: UploadFileInput,
): Promise<PurchaseOrder> {
  const ticket = await repo.prepareFileUpload(order, field, input.folder);
  let uploadConfirmed = false;
  try {
    const file = await storage.upload({
      ...input,
      publicId: ticket.publicId,
      uploadToken: ticket.id,
    });
    uploadConfirmed = true;
    if (
      file.publicId !== ticket.publicId ||
      file.resourceType !== 'image' ||
      !['pdf', 'jpg', 'jpeg', 'png'].includes(file.format)
    )
      throw new FileStorageUnavailableError();
    order[field] = serializeFileReference(file);
    return await repo.update(order, entry, ticket);
  } catch (error) {
    await recoverFileUpload(repo, storage, ticket.id, {
      immediate: true,
      uploadConfirmed,
    });
    throw error;
  }
}
