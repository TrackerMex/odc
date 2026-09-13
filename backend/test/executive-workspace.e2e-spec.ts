import 'reflect-metadata';
import { DataSource, QueryRunner } from 'typeorm';
import { PurchaseOrderOrmEntity } from '../src/modules/odc/infrastructure/entities/purchase-order.orm-entity';
import { UserOrmEntity } from '../src/modules/users/infrastructure/entities/user.orm-entity';
import { PurchaseOrderTypeOrmRepository } from '../src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository';
import { OdcStatus } from '../src/modules/odc/domain/entities/purchase-order.entity';

const owner = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const admin = { userId: owner, role: 'ADMINISTRACION' as const };
const ops = { userId: owner, role: 'DIRECTOR_OPS' as const };
const id = (number: number) =>
  `10000000-0000-4000-8000-${String(number).padStart(12, '0')}`;

describe('executive-workspace-v2 R2-R10: real PostgreSQL queries on isolated temporary data', () => {
  let source: DataSource;
  let runner: QueryRunner;
  let repository: PurchaseOrderTypeOrmRepository;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL)
      throw new Error(
        'Run with DATABASE_URL configured (e.g. docker compose exec backend).',
      );
    source = await new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [PurchaseOrderOrmEntity, UserOrmEntity],
      synchronize: false,
    }).initialize();
    runner = source.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    // All fixtures live only in this connection; rollback never touches public rows.
    await runner.query(
      'CREATE TEMP TABLE purchase_orders (LIKE public.purchase_orders INCLUDING ALL) ON COMMIT DROP',
    );
    const targets = (await runner.query(
      "SELECT 'purchase_orders'::regclass::oid = 'pg_temp.purchase_orders'::regclass::oid AS isolated",
    )) as { isolated: boolean }[];
    expect(targets[0].isolated).toBe(true);
    repository = new PurchaseOrderTypeOrmRepository({
      manager: runner.manager,
    } as DataSource);
    const insert = async (
      number: number,
      status: OdcStatus,
      createdAt: string,
      creator = owner,
      paymentDate: string | null = null,
      supplier = 'ACME',
    ) => {
      await runner.query(
        `INSERT INTO purchase_orders (id, "odcNumber", status, description, quantity, unit, "unitPriceCents", "totalCents", supplier, "createdById", "createdAt", "paymentDate") VALUES ($1,$2,$3,'Material',1,'pieza',12345,12345,$4,$5,$6::timestamp,$7::date)`,
        [
          id(number),
          `ODC-2026-${String(number).padStart(5, '0')}`,
          status,
          supplier,
          creator,
          createdAt,
          paymentDate,
        ],
      );
    };
    for (let number = 1; number <= 25; number++)
      await insert(
        number,
        'PENDIENTE_ADMIN',
        '2026-09-15 12:00:00',
        owner,
        null,
        number === 1 ? 'ACME 100%_MX' : 'ACME',
      );
    await insert(26, 'PENDIENTE_ADMIN', '2026-09-01 05:59:59');
    await insert(27, 'PENDIENTE_ADMIN', '2026-09-01 06:00:00');
    await insert(28, 'PENDIENTE_ADMIN', '2026-10-01 05:59:59');
    await insert(29, 'PENDIENTE_ADMIN', '2026-10-01 06:00:00');
    await insert(30, 'BORRADOR', '2026-09-15 12:00:00');
    await insert(31, 'BORRADOR', '2026-09-15 12:00:00', other);
    await insert(32, 'RECHAZADA', '2026-09-15 12:00:00');
    await insert(33, 'RECHAZADA', '2026-09-15 12:00:00', other);
    await insert(34, 'PRESUPUESTO_APROBADO', '2026-09-15 12:00:00');
    await insert(35, 'COMPLETADA', '2026-09-15 12:00:00', owner, '2026-09-01');
    await insert(
      36,
      'EVIDENCIA_PAGO_SUBIDA',
      '2026-09-15 12:00:00',
      owner,
      '2026-08-31',
    );
    await insert(37, 'COMPLETADA', '2026-09-15 12:00:00', other, '2025-12-31');
  }, 30000);

  afterAll(async () => {
    if (runner?.isTransactionActive) await runner.rollbackTransaction();
    if (runner && !runner.isReleased) await runner.release();
    if (source?.isInitialized) await source.destroy();
  });

  it('R2,R4,R5: counts before pagination, includes only Mexico month boundaries and has stable newest-first pages', async () => {
    const pages = await Promise.all(
      [1, 2, 3].map((page) =>
        repository.getExecutiveTasks(admin, page, 10, { month: '2026-09' }),
      ),
    );
    expect(pages.map((page) => page.items.length)).toEqual([10, 10, 7]);
    expect(pages.every((page) => page.total === 27)).toBe(true);
    const ids = pages.flatMap((page) => page.items.map((item) => item.id));
    expect(new Set(ids).size).toBe(27);
    expect(ids[0]).toBe(id(28));
    expect(ids[1]).toBe(id(25));
    expect(ids.at(-1)).toBe(id(27));
    expect(ids).not.toContain(id(26));
    expect(ids).not.toContain(id(29));
    expect(
      (await repository.getExecutiveTasks(admin, 1, 10, { month: 'all' }))
        .total,
    ).toBe(29);
    expect(
      (await repository.getExecutiveTasks(admin, 9, 10, { month: '2026-09' }))
        .items,
    ).toEqual([]);
  });

  it('R3: finds beyond page one, treats wildcard characters literally and intersects every role restriction', async () => {
    expect(
      (
        await repository.getExecutiveTasks(admin, 1, 10, {
          month: '2026-09',
          q: '100%_mx',
        })
      ).items.map((item) => item.id),
    ).toEqual([id(1)]);
    expect(
      (
        await repository.getExecutiveTasks(admin, 1, 10, { q: '00027' })
      ).items.map((item) => item.id),
    ).toEqual([id(27)]);
    expect(
      (await repository.getExecutiveTasks(admin, 1, 10, { status: 'BORRADOR' }))
        .total,
    ).toBe(0);
    expect(
      (
        await repository.getExecutiveTasks(ops, 1, 10, { month: '2026-09' })
      ).items.map((item) => item.id),
    ).toEqual([id(30), id(32), id(36)]);
    expect(
      (
        await repository.getExecutiveTasks(
          { ...admin, role: 'DIRECTOR_GENERAL' },
          1,
          10,
          { month: '2026-09' },
        )
      ).items.map((item) => item.id),
    ).toEqual([id(34)]);
  });

  it('R6-R10: statistics remain complete under table filters, with zero-filled twelve months and private draft exclusion', async () => {
    const dashboard = await repository.getExecutiveDashboard(
      admin,
      '2026-09',
      '2026-08',
      { q: '100%_MX', page: 1 },
    );
    expect(dashboard.priority.total).toBe(1);
    expect(dashboard.actionableTotal).toBe(29);
    expect(dashboard.monthlyTrend).toHaveLength(12);
    expect(dashboard.monthlyTrend[0]).toEqual({
      month: '2025-10',
      purchaseCount: 0,
      totalCents: 0,
    });
    expect(dashboard.monthlyTrend[2]).toEqual({
      month: '2025-12',
      purchaseCount: 1,
      totalCents: 12345,
    });
    expect(dashboard.monthlyTrend.at(-1)).toEqual({
      month: '2026-09',
      purchaseCount: 1,
      totalCents: 12345,
    });
    expect(dashboard.statusDistribution).toHaveLength(8);
    expect(
      dashboard.statusDistribution.find((item) => item.status === 'BORRADOR')
        ?.count,
    ).toBe(1);
    expect(dashboard.createdOrders).toBe(34);
    expect(dashboard.topSuppliers).toEqual([
      { supplier: 'ACME', purchaseCount: 1, totalCents: 12345 },
    ]);
    expect(dashboard.oldestActiveOrders[0].id).toBe(id(26));
    expect(dashboard.oldestActiveOrders).toHaveLength(5);
  });
});
