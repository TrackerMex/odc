import { Inject, Injectable } from '@nestjs/common';
import type { UserRole } from '../../../users/domain/entities/user.entity';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import type {
  ExecutiveDashboardData,
  ExecutiveDashboardOrder,
  ExecutiveTaskNextAction,
  OdcViewer,
  PurchaseOrderRepository,
  ExecutiveTableFilter,
} from '../../domain/repositories/purchase-order.repository';
import type { OdcStatus } from '../../domain/entities/purchase-order.entity';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const DASHBOARD_ROLES: readonly UserRole[] = [
  'DIRECTOR_OPS',
  'ADMINISTRACION',
  'DIRECTOR_GENERAL',
];

export interface ExecutiveDashboardOrderResponse extends ExecutiveDashboardOrder {
  ageDays: number;
}

export interface ExecutiveDashboardTaskResponse extends ExecutiveDashboardOrderResponse {
  nextAction: ExecutiveTaskNextAction;
}

export interface ExecutiveDashboardResponse {
  month: string;
  role: UserRole;
  priority: {
    total: number;
    items: ExecutiveDashboardTaskResponse[];
    page: number;
    pageSize: number;
  };
  actionableTotal: number;
  createdOrders: number;
  monthlyTrend: ExecutiveDashboardData['monthlyTrend'];
  statusDistribution: ExecutiveDashboardData['statusDistribution'];
  pulse: {
    current: { purchaseCount: number; totalCents: number };
    previous: { month: string; purchaseCount: number; totalCents: number };
    purchaseCountChangePercent: number | null;
    totalCentsChangePercent: number | null;
  };
  oldestActiveOrders: ExecutiveDashboardOrderResponse[];
  topSuppliers: ExecutiveDashboardData['topSuppliers'];
}

function previousMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const previous = new Date(Date.UTC(year, monthNumber - 2, 1));
  return `${previous.getUTCFullYear()}-${String(
    previous.getUTCMonth() + 1,
  ).padStart(2, '0')}`;
}

function ageDays(createdAt: Date, now: Date): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - createdAt.getTime()) / DAY_IN_MILLISECONDS),
  );
}

function changePercent(current: number, previous: number): number | null {
  return previous === 0 ? null : ((current - previous) / previous) * 100;
}

function mapOrders(
  orders: ExecutiveDashboardOrder[],
  now: Date,
): ExecutiveDashboardOrderResponse[] {
  return orders
    .slice()
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
    .map((order) => ({ ...order, ageDays: ageDays(order.createdAt, now) }));
}

function nextActionFor(
  role: UserRole,
  status: OdcStatus,
): ExecutiveTaskNextAction {
  switch (role) {
    case 'DIRECTOR_OPS':
      switch (status) {
        case 'BORRADOR':
        case 'RECHAZADA':
          return 'EDITAR_Y_REENVIAR';
        case 'COMPRA_APROBADA':
          return 'REGISTRAR_PAGO';
        case 'EVIDENCIA_PAGO_SUBIDA':
          return 'COMPLETAR_FACTURA';
      }
      break;
    case 'ADMINISTRACION':
      switch (status) {
        case 'PENDIENTE_ADMIN':
          return 'VALIDAR_PRESUPUESTO';
        case 'PAGO_REGISTRADO':
          return 'CARGAR_EVIDENCIA_PAGO';
      }
      break;
    case 'DIRECTOR_GENERAL':
      if (status === 'PRESUPUESTO_APROBADO') {
        return 'APROBAR_COMPRA';
      }
      break;
  }

  throw new Error(
    `No executive next action is defined for ${role} and ${status}`,
  );
}

function mapPriorityOrders(
  orders: ExecutiveDashboardOrder[],
  role: UserRole,
  now: Date,
): ExecutiveDashboardTaskResponse[] {
  return orders.map((order) => ({
    ...order,
    ageDays: ageDays(order.createdAt, now),
    nextAction: nextActionFor(role, order.status),
  }));
}

@Injectable()
export class GetExecutiveDashboardUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  async execute(
    month: string,
    viewer: OdcViewer,
    filters: ExecutiveTableFilter = {},
  ): Promise<ExecutiveDashboardResponse> {
    if (!DASHBOARD_ROLES.includes(viewer.role)) {
      throw new OdcAccessDeniedError(
        'This role does not have access to the executive dashboard',
      );
    }

    const previous = previousMonth(month);
    const dashboard = await this.purchaseOrderRepository.getExecutiveDashboard(
      viewer,
      month,
      previous,
      filters,
    );
    const now = new Date();

    return {
      month,
      role: viewer.role,
      actionableTotal: dashboard.actionableTotal,
      createdOrders: dashboard.createdOrders,
      monthlyTrend: dashboard.monthlyTrend,
      statusDistribution: dashboard.statusDistribution,
      priority: {
        total: dashboard.priority.total,
        page: dashboard.priority.page,
        pageSize: dashboard.priority.pageSize,
        items: mapPriorityOrders(dashboard.priority.items, viewer.role, now),
      },
      pulse: {
        current: dashboard.pulse.current,
        previous: { month: previous, ...dashboard.pulse.previous },
        purchaseCountChangePercent: changePercent(
          dashboard.pulse.current.purchaseCount,
          dashboard.pulse.previous.purchaseCount,
        ),
        totalCentsChangePercent: changePercent(
          dashboard.pulse.current.totalCents,
          dashboard.pulse.previous.totalCents,
        ),
      },
      oldestActiveOrders: mapOrders(dashboard.oldestActiveOrders, now),
      topSuppliers: dashboard.topSuppliers,
    };
  }
}
