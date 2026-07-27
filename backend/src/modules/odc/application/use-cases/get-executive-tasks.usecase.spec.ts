import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { GetExecutiveTasksUseCase } from './get-executive-tasks.usecase';

describe('R12: GetExecutiveTasksUseCase', () => {
  beforeEach(() =>
    jest.useFakeTimers().setSystemTime(new Date('2026-07-21T12:00:00.000Z')),
  );
  afterEach(() => jest.useRealTimers());

  it('returns an authenticated viewer page with the same explicit next action as the priority queue', async () => {
    const getExecutiveTasks = jest.fn().mockResolvedValue({
      total: 21,
      page: 2,
      pageSize: 20,
      items: [
        {
          id: 'task-1',
          odcNumber: 'ODC-2026-00001',
          status: 'COMPRA_APROBADA',
          description: 'Material',
          supplier: 'Proveedor',
          totalCents: 100_000,
          createdAt: new Date('2026-07-01T00:00:00.000Z'),
        },
      ],
    });
    const useCase = new GetExecutiveTasksUseCase({
      getExecutiveTasks,
    } as unknown as PurchaseOrderRepository);

    const result = await useCase.execute(2, {
      userId: 'ops-1',
      role: 'DIRECTOR_OPS',
    });

    expect(getExecutiveTasks).toHaveBeenCalledWith(
      { userId: 'ops-1', role: 'DIRECTOR_OPS' },
      2,
      20,
    );
    expect(result).toMatchObject({
      total: 21,
      page: 2,
      pageSize: 20,
      items: [{ ageDays: 20, nextAction: 'REGISTRAR_PAGO' }],
    });
  });
});
