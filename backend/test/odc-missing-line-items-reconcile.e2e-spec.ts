import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSource, QueryRunner } from 'typeorm';

const databaseUrl = process.env.ODC_TEST_DATABASE_URL;
const missingId = '00000000-0000-4000-8000-000000000001';
const existingId = '00000000-0000-4000-8000-000000000002';

describe('R6: reconcile missing historical lines before VAT migration', () => {
  let source: DataSource;
  let runner: QueryRunner;
  let schema: string;

  beforeAll(async () => {
    if (!databaseUrl)
      throw new Error('An isolated ODC_TEST_DATABASE_URL is required.');
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
    schema = `odc_reconcile_${randomUUID().replaceAll('-', '')}`;
    await runner.query(`CREATE SCHEMA "${schema}"`);
    await runner.query(`SET search_path TO "${schema}"`);
    await runner.query(`
      CREATE TABLE purchase_orders (id uuid PRIMARY KEY, status text NOT NULL,
        version integer NOT NULL, description text NOT NULL, quantity integer NOT NULL,
        unit text NOT NULL, "unitPriceCents" integer NOT NULL, "totalCents" integer NOT NULL);
      CREATE TABLE purchase_order_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL REFERENCES purchase_orders(id), position integer NOT NULL,
        description text NOT NULL, quantity integer NOT NULL, unit text NOT NULL,
        "unitPriceCents" integer NOT NULL, UNIQUE ("orderId", position));
      CREATE TABLE odc_status_history ("odcId" uuid NOT NULL, status text NOT NULL);
      INSERT INTO purchase_orders VALUES ('${missingId}', 'BORRADOR', 3, 'Cemento', 2, 'bulto', 1250, 2500),
        ('${existingId}', 'COMPLETADA', 7, 'Arena', 3, 'm3', 2000, 6000);
      INSERT INTO purchase_order_items ("orderId", position, description, quantity, unit, "unitPriceCents")
        VALUES ('${existingId}', 0, 'Arena', 3, 'm3', 2000);
      INSERT INTO odc_status_history VALUES ('${missingId}', 'BORRADOR');
    `);
  });
  afterEach(async () => {
    await runner.query('ROLLBACK').catch(() => undefined);
    await runner.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await runner.query('SET search_path TO public');
  });
  async function rows<Row>(sql: string): Promise<Row[]> {
    const result: unknown = await runner.query(sql);
    return result as Row[];
  }
  async function reconcile() {
    await runner.query(
      readFileSync(
        resolve(__dirname, '../scripts/sql/040a-reconcile-missing-items.sql'),
        'utf8',
      ),
    );
  }

  it('R6: inserts only missing lines, preserves existing records and can be repeated', async () => {
    const headers = await rows('SELECT * FROM purchase_orders ORDER BY id');
    const history = await rows('SELECT * FROM odc_status_history');
    const existing = await rows(
      `SELECT * FROM purchase_order_items WHERE "orderId" = '${existingId}'`,
    );
    await reconcile();
    await reconcile();
    expect(await rows('SELECT * FROM purchase_orders ORDER BY id')).toEqual(
      headers,
    );
    expect(await rows('SELECT * FROM odc_status_history')).toEqual(history);
    expect(
      await rows(
        `SELECT * FROM purchase_order_items WHERE "orderId" = '${existingId}'`,
      ),
    ).toEqual(existing);
    expect(
      await rows(
        `SELECT description, quantity, unit, "unitPriceCents", position FROM purchase_order_items WHERE "orderId" = '${missingId}'`,
      ),
    ).toEqual([
      {
        description: 'Cemento',
        quantity: 2,
        unit: 'bulto',
        unitPriceCents: 1250,
        position: 0,
      },
    ]);
  });

  it('R6: aborts with the offending id and inserts nothing when a header is inconsistent', async () => {
    await runner.query(
      `UPDATE purchase_orders SET "totalCents" = 2499 WHERE id = '${missingId}'`,
    );
    await expect(reconcile()).rejects.toThrow(missingId);
    await runner.query('ROLLBACK');
    expect(
      await rows(
        `SELECT * FROM purchase_order_items WHERE "orderId" = '${missingId}'`,
      ),
    ).toEqual([]);
  });
});
