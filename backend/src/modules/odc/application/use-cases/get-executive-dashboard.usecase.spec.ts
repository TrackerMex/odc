import type {
  ExecutiveDashboardData,
  PurchaseOrderRepository,
} from '../../domain/repositories/purchase-order.repository';
import { GetExecutiveDashboardUseCase } from './get-executive-dashboard.usecase';

const viewer = { userId: 'ops-1', role: 'DIRECTOR_OPS' as const };

function dashboard(
  overrides: Partial<ExecutiveDashboardData> = {},
): ExecutiveDashboardData {
  return {
    priority: {
      total: 2,
      items: [
        {
          id: 'old',
          odcNumber: 'ODC-2026-00001',
          status: 'BORRADOR',
          description: 'Old',
          supplier: 'Zeta',
          totalCents: 100,
          createdAt: new Date('2026-07-01T00:00:00.000Z'),
        },
        {
          id: 'new',
          odcNumber: 'ODC-2026-00002',
          status: 'COMPRA_APROBADA',
          description: 'New',
          supplier: 'Alpha',
          totalCents: 200,
          createdAt: new Date('2026-07-20T00:00:00.000Z'),
        },
      ],
    },
    pulse: {
      current: { purchaseCount: 3, totalCents: 3_000 },
      previous: { purchaseCount: 2, totalCents: 1_500 },
    },
    oldestActiveOrders: [],
    topSuppliers: [],
    ...overrides,
  };
}

describe('R1,R2,R5,R6,R7,R10: GetExecutiveDashboardUseCase', () => {
  beforeEach(() =>
    jest.useFakeTimers().setSystemTime(new Date('2026-07-21T12:00:00.000Z')),
  );
  afterEach(() => jest.useRealTimers());

  it('uses the authenticated viewer and returns one snapshot with the previous month and UTC ages', async () => {
    const getExecutiveDashboard = jest.fn().mockResolvedValue(dashboard());
    const useCase = new GetExecutiveDashboardUseCase({
      getExecutiveDashboard,
    } as unknown as PurchaseOrderRepository);

    const result = await useCase.execute('2026-07', viewer);

    expect(getExecutiveDashboard).toHaveBeenCalledWith(
      viewer,
      '2026-07',
      '2026-06',
    );
    expect(result).toMatchObject({
      month: '2026-07',
      role: 'DIRECTOR_OPS',
      priority: { total: 2 },
      pulse: {
        current: { purchaseCount: 3, totalCents: 3_000 },
        previous: { month: '2026-06', purchaseCount: 2, totalCents: 1_500 },
        purchaseCountChangePercent: 50,
        totalCentsChangePercent: 100,
      },
    });
    expect(
      result.priority.items.map((item) => [item.id, item.ageDays]),
    ).toEqual([
      ['old', 20],
      ['new', 1],
    ]);
    expect(
      result.priority.items.map((item) => [item.id, item.nextAction]),
    ).toEqual([
      ['old', 'EDITAR_Y_REENVIAR'],
      ['new', 'REGISTRAR_PAGO'],
    ]);
  });

  it('returns null changes with a zero previous denominator and preserves an empty supplier list', async () => {
    const useCase = new GetExecutiveDashboardUseCase({
      getExecutiveDashboard: jest.fn().mockResolvedValue(
        dashboard({
          pulse: {
            current: { purchaseCount: 1, totalCents: 500 },
            previous: { purchaseCount: 0, totalCents: 0 },
          },
          topSuppliers: [],
        }),
      ),
    } as unknown as PurchaseOrderRepository);

    const result = await useCase.execute('2026-07', viewer);

    expect(result.pulse.purchaseCountChangePercent).toBeNull();
    expect(result.pulse.totalCentsChangePercent).toBeNull();
    expect(result.topSuppliers).toEqual([]);
  });

  it.each([
    ['ADMINISTRACION', 'PENDIENTE_ADMIN', 'VALIDAR_PRESUPUESTO'],
    ['ADMINISTRACION', 'PAGO_REGISTRADO', 'CARGAR_EVIDENCIA_PAGO'],
    ['DIRECTOR_GENERAL', 'PRESUPUESTO_APROBADO', 'APROBAR_COMPRA'],
  ] as const)(
    'names the next action for %s tasks in %s',
    async (role, status, nextAction) => {
      const firstTask = dashboard().priority.items[0];
      const useCase = new GetExecutiveDashboardUseCase({
        getExecutiveDashboard: jest.fn().mockResolvedValue(
          dashboard({
            priority: {
              total: 1,
              items: [{ ...firstTask, status }],
            },
          }),
        ),
      } as unknown as PurchaseOrderRepository);

      const result = await useCase.execute('2026-07', {
        userId: 'viewer-1',
        role,
      });

      expect(result.priority.items[0].nextAction).toBe(nextAction);
    },
  );

  it('does not expose a dashboard for a role outside the business roles', async () => {
    const getExecutiveDashboard = jest.fn();
    const useCase = new GetExecutiveDashboardUseCase({
      getExecutiveDashboard,
    } as unknown as PurchaseOrderRepository);

    await expect(
      useCase.execute('2026-07', { userId: 'x', role: 'OTHER' as never }),
    ).rejects.toThrow('does not have access');
    expect(getExecutiveDashboard).not.toHaveBeenCalled();
  });
});
