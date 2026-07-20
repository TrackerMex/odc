import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  OdcStatus,
  PurchaseOrder,
} from '../../domain/entities/purchase-order.entity';
import { OdcPage } from '../../domain/repositories/purchase-order.repository';

// HTTP-facing shape of a PurchaseOrder (R4): the raw paymentEvidenceFile
// Cloudinary public_id is never serialized; hasPaymentEvidence replaces it.
// Lives in infrastructure: a serialization detail, not a domain/application
// concern (docs/architecture.md dependency rule).
export interface OdcResponseDto {
  id: string | null;
  odcNumber: string | null;
  status: OdcStatus;
  description: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  totalCents: number;
  supplier: string;
  comments: string | null;
  createdById: string;
  rejectionReason: string | null;
  paymentDate: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentNotes: string | null;
  hasPaymentEvidence: boolean;
  evidenceReference: string | null;
  invoiceFile: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  warehouseEntryDate: string | null;
  observations: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  history: OdcStatusHistoryEntry[];
}

export interface OdcPageResponseDto {
  items: OdcResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}

export function toOdcResponse(order: PurchaseOrder): OdcResponseDto {
  const { paymentEvidenceFile, ...rest } = order;
  return {
    ...rest,
    hasPaymentEvidence: paymentEvidenceFile !== null,
  };
}

export function toOdcPageResponse(page: OdcPage): OdcPageResponseDto {
  return {
    ...page,
    items: page.items.map(toOdcResponse),
  };
}
