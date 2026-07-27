import { Inject, Injectable } from '@nestjs/common';
import type { UserRole } from '../../../users/domain/entities/user.entity';
import { OdcAccessDeniedError } from '../../domain/errors/odc-access-denied.error';
import type {
  ExecutiveDashboardOrder,
  ExecutiveTaskNextAction,
  OdcViewer,
  PurchaseOrderRepository,
} from '../../domain/repositories/purchase-order.repository';
import type { OdcStatus } from '../../domain/entities/purchase-order.entity';

const PAGE_SIZE = 20;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const EXECUTIVE_ROLES: readonly UserRole[] = [
  'DIRECTOR_OPS',
  'ADMINISTRACION',
  'DIRECTOR_GENERAL',
];

export interface ExecutiveTaskResponse extends ExecutiveDashboardOrder {
  ageDays: number;
  nextAction: ExecutiveTaskNextAction;
}

export interface ExecutiveTaskPageResponse {
  items: ExecutiveTaskResponse[];
  total: number;
  page: number;
  pageSize: number;
}

function nextActionFor(
  role: UserRole,
  status: OdcStatus,
): ExecutiveTaskNextAction {
  if (role === 'DIRECTOR_OPS') {
    if (status === 'BORRADOR' || status === 'RECHAZADA')
      return 'EDITAR_Y_REENVIAR';
    if (status === 'COMPRA_APROBADA') return 'REGISTRAR_PAGO';
    if (status === 'EVIDENCIA_PAGO_SUBIDA') return 'COMPLETAR_FACTURA';
  }
  if (role === 'ADMINISTRACION') {
    if (status === 'PENDIENTE_ADMIN') return 'VALIDAR_PRESUPUESTO';
    if (status === 'PAGO_REGISTRADO') return 'CARGAR_EVIDENCIA_PAGO';
  }
  if (role === 'DIRECTOR_GENERAL' && status === 'PRESUPUESTO_APROBADO')
    return 'APROBAR_COMPRA';
  throw new Error(
    `No executive next action is defined for ${role} and ${status}`,
  );
}

@Injectable()
export class GetExecutiveTasksUseCase {
  constructor(
    @Inject('PurchaseOrderRepository')
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  async execute(
    page: number | undefined,
    viewer: OdcViewer,
  ): Promise<ExecutiveTaskPageResponse> {
    if (!EXECUTIVE_ROLES.includes(viewer.role)) {
      throw new OdcAccessDeniedError(
        'This role does not have access to executive tasks',
      );
    }
    const result = await this.purchaseOrderRepository.getExecutiveTasks(
      viewer,
      page ?? 1,
      PAGE_SIZE,
    );
    const now = new Date();
    return {
      ...result,
      items: result.items.map((task) => ({
        ...task,
        ageDays: Math.max(
          0,
          Math.floor(
            (now.getTime() - task.createdAt.getTime()) / DAY_IN_MILLISECONDS,
          ),
        ),
        nextAction: nextActionFor(viewer.role, task.status),
      })),
    };
  }
}
