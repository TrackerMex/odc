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

export const MONTHLY_PURCHASE_STATUSES: OdcStatus[] = [
  'PAGO_REGISTRADO',
  'EVIDENCIA_PAGO_SUBIDA',
  'COMPLETADA',
];

export interface MonthlyPurchase {
  id: string;
  odcNumber: string;
  status: OdcStatus;
  requesterName: string | null;
  description: string;
  supplier: string;
  quantity: number;
  unit: string;
  totalCents: number;
  paymentDate: string;
  warehouseEntryDate: string | null;
  hasInvoice: boolean;
  comments: string | null;
  observations: string | null;
}

export interface ExecutiveDashboardOrder {
  id: string;
  odcNumber: string;
  status: OdcStatus;
  description: string;
  supplier: string;
  totalCents: number;
  createdAt: Date;
}

export type ExecutiveTaskNextAction =
  | 'EDITAR_Y_REENVIAR'
  | 'VALIDAR_PRESUPUESTO'
  | 'APROBAR_COMPRA'
  | 'REGISTRAR_PAGO'
  | 'CARGAR_EVIDENCIA_PAGO'
  | 'COMPLETAR_FACTURA';

export interface ExecutiveDashboardSupplier {
  supplier: string;
  purchaseCount: number;
  totalCents: number;
}

export interface ExecutiveDashboardData {
  priority: {
    total: number;
    items: ExecutiveDashboardOrder[];
    page: number;
    pageSize: number;
  };
  actionableTotal: number;
  createdOrders: number;
  monthlyTrend: { month: string; purchaseCount: number; totalCents: number }[];
  statusDistribution: { status: OdcStatus; count: number }[];
  pulse: {
    current: { purchaseCount: number; totalCents: number };
    previous: { purchaseCount: number; totalCents: number };
  };
  oldestActiveOrders: ExecutiveDashboardOrder[];
  topSuppliers: ExecutiveDashboardSupplier[];
}

export interface ExecutiveTaskPage {
  items: ExecutiveDashboardOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ExecutiveTableFilter {
  month?: string;
  q?: string;
  status?: OdcStatus;
  order?: 'newest' | 'oldest';
  page?: number;
}

export interface PurchaseOrderRepository {
  // Assigns the ODC-YYYY-NNNNN number and persists the order plus its
  // opening history row in a single transaction (R5, R6).
  create(
    order: PurchaseOrder,
    historyEntry: OdcStatusHistoryEntry,
  ): Promise<PurchaseOrder>;
  // Persists only when id/version/previous status still match (#36). An
  // OdcConcurrentUpdateError rejects stale writes; increments version once.
  // A transition's history row shares that transaction (R5).
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
  findMonthlyPurchases(month: string): Promise<MonthlyPurchase[]>;
  getExecutiveDashboard(
    viewer: OdcViewer,
    month: string,
    previousMonth: string,
    filters?: ExecutiveTableFilter,
  ): Promise<ExecutiveDashboardData>;
  getExecutiveTasks(
    viewer: OdcViewer,
    page: number,
    pageSize: number,
    filters?: ExecutiveTableFilter,
  ): Promise<ExecutiveTaskPage>;
}
