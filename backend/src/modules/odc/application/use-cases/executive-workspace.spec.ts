import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetExecutiveTasksQueryDto } from '../dto/get-executive-tasks.query.dto';
import { GetExecutiveDashboardQueryDto } from '../dto/get-executive-dashboard.query.dto';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { GetExecutiveTasksUseCase } from './get-executive-tasks.usecase';
import { GetExecutiveDashboardUseCase } from './get-executive-dashboard.usecase';

describe('executive-workspace-v2 R2,R3,R4: validated task queries', () => {
  afterEach(() => jest.useRealTimers());

  it.each([
    { month: '2026-13' }, { month: 'anything' }, { month: '0000-01' },
    { q: 'x'.repeat(121) }, { q: ['supplier'] }, { status: 'UNKNOWN' },
    { order: 'random' }, { page: 0 }, { page: 1.5 },
  ])('rejects invalid query %j', async (query) => {
    expect(await validate(plainToInstance(GetExecutiveTasksQueryDto, query)))
      .not.toHaveLength(0);
  });

  it('allows explicit all-month tasks, but never all-month statistics', async () => {
    expect(await validate(plainToInstance(GetExecutiveTasksQueryDto, { month: 'all' }))).toHaveLength(0);
    expect(await validate(plainToInstance(GetExecutiveDashboardQueryDto, { month: 'all' }))).not.toHaveLength(0);
  });

  it('uses the current creation month in Mexico and pages of ten', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-01T02:00:00Z'));
    const getExecutiveTasks = jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 });
    const useCase = new GetExecutiveTasksUseCase({ getExecutiveTasks } as unknown as PurchaseOrderRepository);
    await useCase.execute(undefined, { userId: 'admin', role: 'ADMINISTRACION' });
    expect(getExecutiveTasks).toHaveBeenCalledWith(
      { userId: 'admin', role: 'ADMINISTRACION' }, 1, 10,
      expect.objectContaining({ month: '2026-09' }),
    );
  });

  it('forwards historical filters without taking identity from the query', async () => {
    const getExecutiveTasks = jest.fn().mockResolvedValue({ items: [], total: 0, page: 3, pageSize: 10 });
    const useCase = new GetExecutiveTasksUseCase({ getExecutiveTasks } as unknown as PurchaseOrderRepository);
    const filters = { month: '2025-12', q: 'ACME', status: 'PENDIENTE_ADMIN', order: 'newest' };
    await Reflect.apply(useCase.execute, useCase, [3, { userId: 'admin', role: 'ADMINISTRACION' }, filters]);
    expect(getExecutiveTasks).toHaveBeenCalledWith({ userId: 'admin', role: 'ADMINISTRACION' }, 3, 10, filters);
  });
});

describe('executive-workspace-v2 R5,R7,R8,R9: complete dashboard aggregates', () => {
  it('preserves repository priority order and exposes statistics independently of filtered totals', async () => {
    const order = { odcNumber: 'ODC-2026-00001', status: 'PENDIENTE_ADMIN', description: 'Material', supplier: 'ACME', totalCents: 100 };
    const data = {
      priority: { total: 2, page: 1, pageSize: 10, items: [
        { ...order, id: 'new', createdAt: new Date('2026-09-02T12:00:00Z') },
        { ...order, id: 'old', createdAt: new Date('2026-09-01T12:00:00Z') },
      ] },
      actionableTotal: 29,
      createdOrders: 42,
      monthlyTrend: [{ month: '2026-09', purchaseCount: 2, totalCents: 12345 }],
      statusDistribution: [{ status: 'PENDIENTE_ADMIN', count: 42 }],
      pulse: { current: { purchaseCount: 2, totalCents: 12345 }, previous: { purchaseCount: 0, totalCents: 0 } },
      oldestActiveOrders: [], topSuppliers: [],
    };
    const useCase = new GetExecutiveDashboardUseCase({ getExecutiveDashboard: jest.fn().mockResolvedValue(data) } as unknown as PurchaseOrderRepository);
    const result = await useCase.execute('2026-09', { userId: 'admin', role: 'ADMINISTRACION' });
    expect(result.priority.items.map((item) => item.id)).toEqual(['new', 'old']);
    expect(result).toMatchObject({ actionableTotal: 29, createdOrders: 42, monthlyTrend: data.monthlyTrend, statusDistribution: data.statusDistribution, priority: { page: 1, pageSize: 10 } });
    expect(result.pulse.totalCentsChangePercent).toBeNull();
  });
});
