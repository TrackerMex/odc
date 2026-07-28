import { DataSource } from 'typeorm';
import { PurchaseOrderOrmEntity } from '../entities/purchase-order.orm-entity';
import { PurchaseOrderTypeOrmRepository } from './purchase-order.typeorm.repository';

function order(overrides: Partial<PurchaseOrderOrmEntity> = {}) {
  return {
    id: 'odc-1',
    odcNumber: 'ODC-2026-00001',
    status: 'COMPRA_APROBADA' as const,
    description: 'Material',
    supplier: 'Proveedor A',
    totalCents: 1_000,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    ...overrides,
  } as PurchaseOrderOrmEntity;
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

describe('R2,R5,R6,R7,R11: executive dashboard TypeORM snapshot', () => {
  it('uses four bounded queries, keeps private drafts/rejections scoped to their creator, and aggregates monthly data', async () => {
    const metricsQuery = rawQuery([
      { month: '2026-06', purchaseCount: '2', totalCents: '1500' },
      { month: '2026-07', purchaseCount: '3', totalCents: '3000' },
    ]);
    const suppliersQuery = rawQuery([
      { supplier: 'Proveedor A', purchaseCount: '2', totalCents: '2000' },
    ]);
    const manager = {
      findAndCount: jest.fn().mockResolvedValue([[order()], 7]),
      find: jest.fn().mockResolvedValue([order({ id: 'oldest' })]),
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(metricsQuery)
        .mockReturnValueOnce(suppliersQuery),
    };
    const repository = new PurchaseOrderTypeOrmRepository({
      manager,
    } as unknown as DataSource);

    const result = await repository.getExecutiveDashboard(
      { userId: 'ops-1', role: 'DIRECTOR_OPS' },
      '2026-07',
      '2026-06',
    );

    expect(manager.findAndCount).toHaveBeenCalledTimes(1);
    expect(manager.find).toHaveBeenCalledTimes(1);
    expect(manager.createQueryBuilder).toHaveBeenCalledTimes(2);
    const priorityCall = manager.findAndCount.mock.calls.at(0) as unknown;
    const [, priorityOptions] = priorityCall as [
      unknown,
      { take: number; order: { createdAt: string }; where: unknown },
    ];
    expect(priorityCall).toEqual([
      PurchaseOrderOrmEntity,
      expect.objectContaining({ take: 5, order: { createdAt: 'ASC' } }),
    ]);
    expect(priorityOptions.where).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ createdById: 'ops-1' }),
      ]),
    );
    expect(manager.find).toHaveBeenCalledWith(
      PurchaseOrderOrmEntity,
      expect.objectContaining({ take: 5, order: { createdAt: 'ASC' } }),
    );
    expect(result).toMatchObject({
      priority: { total: 7, items: [{ id: 'odc-1' }] },
      pulse: {
        previous: { purchaseCount: 2, totalCents: 1500 },
        current: { purchaseCount: 3, totalCents: 3000 },
      },
      oldestActiveOrders: [{ id: 'oldest' }],
      topSuppliers: [
        { supplier: 'Proveedor A', purchaseCount: 2, totalCents: 2000 },
      ],
    });
    expect(suppliersQuery.orderBy).toHaveBeenCalledWith(
      'SUM(odc.totalCents)',
      'DESC',
    );
    expect(suppliersQuery.addOrderBy).toHaveBeenCalledWith(
      'odc.supplier',
      'ASC',
    );
    expect(suppliersQuery.limit).toHaveBeenCalledWith(5);
  });

  it.each([
    ['ADMINISTRACION', ['PENDIENTE_ADMIN', 'PAGO_REGISTRADO']],
    ['DIRECTOR_GENERAL', ['PRESUPUESTO_APROBADO']],
  ] as const)(
    'limits %s priority tasks to its authorized statuses',
    async (role, expectedStatuses) => {
      const manager = {
        findAndCount: jest.fn().mockResolvedValue([[], 0]),
        find: jest.fn().mockResolvedValue([]),
        createQueryBuilder: jest
          .fn()
          .mockReturnValueOnce(rawQuery([]))
          .mockReturnValueOnce(rawQuery([])),
      };
      const repository = new PurchaseOrderTypeOrmRepository({
        manager,
      } as unknown as DataSource);

      await repository.getExecutiveDashboard(
        { userId: 'viewer', role },
        '2026-07',
        '2026-06',
      );

      const priorityCall = manager.findAndCount.mock.calls.at(0) as unknown;
      const [, options] = priorityCall as [
        unknown,
        { where: { status: unknown } },
      ];
      const status = options.where.status as { value?: unknown } | string;
      expect(typeof status === 'string' ? [status] : status.value).toEqual(
        expectedStatuses,
      );
    },
  );
});
