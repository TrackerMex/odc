import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSource, QueryRunner } from 'typeorm';

const databaseUrl = process.env.ODC_TEST_DATABASE_URL;
const successfulOrders = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    odcNumber: 'ODC-2026-00001',
    status: 'BORRADOR',
    description: 'Cemento',
    quantity: 2,
    unit: 'bulto',
    unitPriceCents: 1250,
    totalCents: 2500,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    odcNumber: 'ODC-2026-00002',
    status: 'PENDIENTE_ADMIN',
    description: 'Arena',
    quantity: 3,
    unit: 'm3',
    unitPriceCents: 2000,
    totalCents: 6000,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    odcNumber: 'ODC-2026-00003',
    status: 'COMPLETADA',
    description: 'Flete',
    quantity: 1,
    unit: 'viaje',
    unitPriceCents: 3500,
    totalCents: 3500,
  },
];

describe('R6: versioned line-item migration preserves old ODC data', () => {
  let source: DataSource;
  let runner: QueryRunner;
  let schema: string;

  beforeAll(async () => {
    if (!databaseUrl) {
      throw new Error(
        'Use backend/scripts/verify-postgres-hardening.sh; no shared database is allowed.',
      );
    }
    source = new DataSource({ type: 'postgres', url: databaseUrl });
    await source.initialize();
    runner = source.createQueryRunner();
    await runner.connect();
  });

  afterAll(async () => {
    if (runner?.isReleased === false) await runner.release();
    if (source?.isInitialized) await source.destroy();
  });

  beforeEach(async () => {
    schema = `odc_line_items_${randomUUID().replaceAll('-', '')}`;
    await runner.query(`CREATE SCHEMA "${schema}"`);
    await runner.query(`SET search_path TO "${schema}"`);
    await runner.query(`
      CREATE TABLE purchase_orders (
        id uuid PRIMARY KEY,
        "odcNumber" varchar NOT NULL UNIQUE,
        status varchar NOT NULL,
        description varchar NOT NULL,
        quantity integer NOT NULL,
        unit varchar NOT NULL,
        "unitPriceCents" integer NOT NULL,
        "totalCents" integer NOT NULL,
        supplier varchar NOT NULL,
        comments varchar,
        "createdById" uuid NOT NULL,
        "rejectionReason" varchar,
        "paymentDate" date,
        "paymentMethod" varchar,
        "paymentReference" varchar,
        "paymentNotes" varchar,
        "paymentEvidenceFile" varchar,
        "evidenceReference" varchar,
        "invoiceFile" varchar,
        "invoiceNumber" varchar,
        "invoiceDate" date,
        "warehouseEntryDate" date,
        observations varchar,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE odc_status_history (
        id uuid PRIMARY KEY,
        "odcId" uuid NOT NULL,
        "fromStatus" varchar,
        "toStatus" varchar NOT NULL,
        "userId" uuid NOT NULL,
        note varchar,
        "createdAt" timestamp NOT NULL DEFAULT now()
      );
    `);
  });

  afterEach(async () => {
    await runner.query('ROLLBACK').catch(() => undefined);
    await runner.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await runner.query('SET search_path TO public');
  });

  it('R6: backfills one equivalent ordered line per ODC without changing headers or history', async () => {
    await insertOrders(successfulOrders);
    const histories = successfulOrders.map((order, index) => ({
      id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      odcId: order.id,
      fromStatus: null,
      toStatus: order.status,
      userId: '20000000-0000-4000-8000-000000000001',
      note: `historial-${index + 1}`,
    }));
    for (const history of histories) {
      await runner.query(
        `INSERT INTO odc_status_history (id, "odcId", "fromStatus", "toStatus", "userId", note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          history.id,
          history.odcId,
          history.fromStatus,
          history.toStatus,
          history.userId,
          history.note,
        ],
      );
    }
    const headersBefore = await queryRows<Record<string, unknown>>(
      'SELECT * FROM purchase_orders ORDER BY id',
    );
    const historyBefore = await queryRows<Record<string, unknown>>(
      'SELECT * FROM odc_status_history ORDER BY id',
    );

    await applyMigration();

    const lines = await queryRows<Record<string, unknown>>(
      'SELECT "orderId", position, description, quantity, unit, "unitPriceCents" FROM purchase_order_items ORDER BY "orderId", position',
    );
    const headersAfter = await queryRows<Record<string, unknown>>(
      'SELECT * FROM purchase_orders ORDER BY id',
    );
    const historyAfter = await queryRows<Record<string, unknown>>(
      'SELECT * FROM odc_status_history ORDER BY id',
    );

    expect(lines).toHaveLength(successfulOrders.length);
    expect(lines).toEqual(
      successfulOrders.map((order) => ({
        orderId: order.id,
        position: 0,
        description: order.description,
        quantity: order.quantity,
        unit: order.unit,
        unitPriceCents: order.unitPriceCents,
      })),
    );
    expect(headersAfter).toEqual(headersBefore);
    expect(historyAfter).toEqual(historyBefore);
  });

  it('R6: rolls back the table and backfill and identifies an inconsistent historical ODC', async () => {
    const inconsistentOrder = {
      ...successfulOrders[0],
      id: '00000000-0000-4000-8000-000000000099',
      odcNumber: 'ODC-2026-00099',
      totalCents: 2499,
    };
    await insertOrders([successfulOrders[1], inconsistentOrder]);
    const headersBefore = await queryRows<Record<string, unknown>>(
      'SELECT * FROM purchase_orders ORDER BY id',
    );
    const historyBefore = await queryRows<Record<string, unknown>>(
      'SELECT * FROM odc_status_history ORDER BY id',
    );

    let migrationError: Error | undefined;
    try {
      await applyMigration();
    } catch (error) {
      migrationError = error as Error;
    }
    await runner.query('ROLLBACK').catch(() => undefined);

    const tableState = await queryRows<{ table_name: string | null }>(
      "SELECT to_regclass('purchase_order_items') AS table_name",
    );
    const headersAfter = await queryRows<Record<string, unknown>>(
      'SELECT * FROM purchase_orders ORDER BY id',
    );
    const historyAfter = await queryRows<Record<string, unknown>>(
      'SELECT * FROM odc_status_history ORDER BY id',
    );

    expect(migrationError?.message).toContain(inconsistentOrder.id);
    expect(tableState[0]?.table_name).toBeNull();
    expect(headersAfter).toEqual(headersBefore);
    expect(historyAfter).toEqual(historyBefore);
  });

  async function insertOrders(orders: typeof successfulOrders): Promise<void> {
    for (const order of orders) {
      await runner.query(
        `INSERT INTO purchase_orders (id, "odcNumber", status, description, quantity, unit, "unitPriceCents", "totalCents", supplier, comments, "createdById")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          order.id,
          order.odcNumber,
          order.status,
          order.description,
          order.quantity,
          order.unit,
          order.unitPriceCents,
          order.totalCents,
          'Proveedor',
          `comentarios-${order.odcNumber}`,
          '20000000-0000-4000-8000-000000000001',
        ],
      );
    }
  }

  async function applyMigration(): Promise<void> {
    const sql = readFileSync(
      resolve(__dirname, '../scripts/sql/040-odc-line-items.sql'),
      'utf8',
    );
    await runner.query(sql);
  }

  async function queryRows<Row>(query: string): Promise<Row[]> {
    const result: unknown = await runner.query(query);
    return result as Row[];
  }
});
