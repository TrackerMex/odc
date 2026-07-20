import type { UserRole } from '../../../users/domain/entities/user.entity';
import { OdcStatusHistoryEntry } from '../entities/odc-status-history-entry.entity';
import { OdcStatus, PurchaseOrder } from '../entities/purchase-order.entity';

export interface OdcViewer {
  userId: string;
  role: UserRole;
}

export interface OdcListFilter {
  status?: OdcStatus;
  viewer: OdcViewer;
}

export interface OdcPage {
  items: PurchaseOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PurchaseOrderRepository {
  // Assigns the ODC-YYYY-NNNNN number and persists the order plus its
  // opening history row in a single transaction (R5, R6).
  create(
    order: PurchaseOrder,
    historyEntry: OdcStatusHistoryEntry,
  ): Promise<PurchaseOrder>;
  // Persists the order and, when the change is a transition, its history
  // row in the same transaction (R5).
  update(
    order: PurchaseOrder,
    historyEntry?: OdcStatusHistoryEntry,
  ): Promise<PurchaseOrder>;
  // Includes the status history ordered chronologically (R13).
  findById(id: string): Promise<PurchaseOrder | null>;
  findAll(
    filter: OdcListFilter,
    page: number,
    pageSize: number,
  ): Promise<OdcPage>;
}
