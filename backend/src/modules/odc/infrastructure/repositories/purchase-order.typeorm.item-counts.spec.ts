import { DataSource } from 'typeorm';
import { PurchaseOrderLineItemOrmEntity } from '../entities/purchase-order-line-item.orm-entity';
import { PurchaseOrderOrmEntity } from '../entities/purchase-order.orm-entity';
import { PurchaseOrderTypeOrmRepository } from './purchase-order.typeorm.repository';

function order(id: string, status = 'COMPLETADA') {
  return {
    id,
    odcNumber: `ODC-2026-${id.padStart(5, '0')}`,
    status,
    description: 'Material',
    supplier: 'Proveedor',
    quantity: 2,
    unit: 'pza',
    totalCents: 1000,
    paymentDate: '2026-07-10',
    warehouseEntryDate: null,
    invoiceFile: null,
    comments: null,
    observations: null,
    createdAt: new Date('2026-07-01T00:00:00Z'),
  } as PurchaseOrderOrmEntity;
}

function line(orderId: string, position: number) {
  return {
    id: `line-${orderId}-${position}`,
    orderId,
    position,
    description: 'Material',
    quantity: 1,
    unit: 'pza',
    unitPriceCents: 100,
  } as PurchaseOrderLineItemOrmEntity;
}

function rawQuery(rows: unknown[]) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
  return builder;
}

describe('R5: compact purchase views report the stored line count', () => {
  it('returns itemCount in each monthly purchase', async () => {
    const manager = {
      find: jest.fn().mockImplementation((target: unknown) =>
        Promise.resolve(
          target === PurchaseOrderOrmEntity
            ? [order('1'), order('2')]
            : [line('1', 0), line('1', 1), line('2', 0)],
        ),
      ),
    };
    const repository = new PurchaseOrderTypeOrmRepository({
      manager,
    } as unknown as DataSource);

    const purchases = await repository.findMonthlyPurchases('2026-07');

    expect(purchases.map((purchase) => purchase.itemCount)).toEqual([2, 1]);
  });

  it('returns itemCount for the executive task queue', async () => {
    const manager = {
      findAndCount: jest.fn().mockResolvedValue([[order('1', 'PENDIENTE_ADMIN')], 1]),
      find: jest.fn().mockResolvedValue([line('1', 0), line('1', 1)]),
    };
    const repository = new PurchaseOrderTypeOrmRepository({
      manager,
    } as unknown as DataSource);

    const tasks = await repository.getExecutiveTasks(
      { userId: 'admin', role: 'ADMINISTRACION' },
      1,
      10,
    );

    expect(tasks.items[0].itemCount).toBe(2);
  });

  it('returns itemCount for dashboard priority and oldest-order projections', async () => {
    const metrics = rawQuery([]);
    const suppliers = rawQuery([]);
    const distribution = rawQuery([]);
    const priority = order('1', 'PENDIENTE_ADMIN');
    const oldest = order('2', 'PENDIENTE_ADMIN');
    const manager = {
      count: jest.fn().mockResolvedValue(1),
      findAndCount: jest.fn().mockResolvedValue([[priority], 1]),
      find: jest.fn().mockImplementation((target: unknown) =>
        Promise.resolve(
          target === PurchaseOrderOrmEntity
            ? [oldest]
            : [line('1', 0), line('1', 1), line('2', 0), line('2', 1)],
        ),
      ),
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(metrics)
        .mockReturnValueOnce(suppliers)
        .mockReturnValueOnce(distribution),
    };
    const repository = new PurchaseOrderTypeOrmRepository({
      manager,
    } as unknown as DataSource);

    const dashboard = await repository.getExecutiveDashboard(
      { userId: 'admin', role: 'ADMINISTRACION' },
      '2026-07',
      '2026-06',
    );

    expect(dashboard.priority.items[0].itemCount).toBe(2);
    expect(dashboard.oldestActiveOrders[0].itemCount).toBe(2);
  });
});
