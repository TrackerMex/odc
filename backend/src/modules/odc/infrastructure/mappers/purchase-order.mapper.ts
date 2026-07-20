import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { OdcStatusHistoryOrmEntity } from '../entities/odc-status-history.orm-entity';
import { PurchaseOrderOrmEntity } from '../entities/purchase-order.orm-entity';

export function toDomain(
  row: PurchaseOrderOrmEntity,
  historyRows: OdcStatusHistoryOrmEntity[] = [],
): PurchaseOrder {
  return new PurchaseOrder({
    id: row.id,
    odcNumber: row.odcNumber,
    status: row.status,
    description: row.description,
    quantity: row.quantity,
    unit: row.unit,
    unitPriceCents: row.unitPriceCents,
    totalCents: row.totalCents,
    supplier: row.supplier,
    comments: row.comments ?? null,
    createdById: row.createdById,
    rejectionReason: row.rejectionReason ?? null,
    paymentDate: row.paymentDate ?? null,
    paymentMethod: row.paymentMethod ?? null,
    paymentReference: row.paymentReference ?? null,
    paymentNotes: row.paymentNotes ?? null,
    paymentEvidenceFile: row.paymentEvidenceFile ?? null,
    evidenceReference: row.evidenceReference ?? null,
    invoiceFile: row.invoiceFile ?? null,
    invoiceNumber: row.invoiceNumber ?? null,
    invoiceDate: row.invoiceDate ?? null,
    warehouseEntryDate: row.warehouseEntryDate ?? null,
    observations: row.observations ?? null,
    createdAt: row.createdAt ?? null,
    updatedAt: row.updatedAt ?? null,
    history: historyRows.map(historyToDomain),
  });
}

export function toOrmValues(
  order: PurchaseOrder,
): Partial<PurchaseOrderOrmEntity> {
  return {
    ...(order.id !== null ? { id: order.id } : {}),
    ...(order.odcNumber !== null ? { odcNumber: order.odcNumber } : {}),
    status: order.status,
    description: order.description,
    quantity: order.quantity,
    unit: order.unit,
    unitPriceCents: order.unitPriceCents,
    totalCents: order.totalCents,
    supplier: order.supplier,
    comments: order.comments,
    createdById: order.createdById,
    rejectionReason: order.rejectionReason,
    paymentDate: order.paymentDate,
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    paymentNotes: order.paymentNotes,
    paymentEvidenceFile: order.paymentEvidenceFile,
    evidenceReference: order.evidenceReference,
    invoiceFile: order.invoiceFile,
    invoiceNumber: order.invoiceNumber,
    invoiceDate: order.invoiceDate,
    warehouseEntryDate: order.warehouseEntryDate,
    observations: order.observations,
  };
}

export function historyToDomain(
  row: OdcStatusHistoryOrmEntity,
): OdcStatusHistoryEntry {
  return new OdcStatusHistoryEntry(
    row.id,
    row.odcId,
    row.fromStatus ?? null,
    row.toStatus,
    row.userId,
    row.note ?? null,
    row.createdAt ?? null,
  );
}

export function historyToOrmValues(
  entry: OdcStatusHistoryEntry,
  odcId: string,
): Partial<OdcStatusHistoryOrmEntity> {
  return {
    odcId,
    fromStatus: entry.fromStatus,
    toStatus: entry.toStatus,
    userId: entry.userId,
    note: entry.note,
  };
}
