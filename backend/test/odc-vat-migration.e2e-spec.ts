import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DataSource, QueryRunner } from 'typeorm';

const databaseUrl = process.env.ODC_TEST_DATABASE_URL;
const orderId = '00000000-0000-4000-8000-000000000001';

describe('R6: VAT migration preserves historic ODCs or rolls back', () => {
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
    schema = `odc_vat_${randomUUID().replaceAll('-', '')}`;
    await runner.query(`CREATE SCHEMA "${schema}"`);
    await runner.query(`SET search_path TO "${schema}"`);
    await runner.query(`
      CREATE TABLE purchase_orders (id uuid PRIMARY KEY, status text NOT NULL,
        version integer NOT NULL, "totalCents" integer NOT NULL,
        description text NOT NULL, quantity integer NOT NULL, unit text NOT NULL, "unitPriceCents" integer NOT NULL);
      CREATE TABLE purchase_order_items ("orderId" uuid NOT NULL,
        position integer NOT NULL, quantity integer NOT NULL, "unitPriceCents" integer NOT NULL,
        description text NOT NULL, unit text NOT NULL);
      CREATE TABLE odc_status_history ("odcId" uuid NOT NULL, status text NOT NULL);
      INSERT INTO purchase_orders VALUES ('${orderId}', 'BORRADOR', 3, 2500, 'Cemento', 2, 'bulto', 1250),
        ('00000000-0000-4000-8000-000000000002', 'COMPLETADA', 7, 6000, 'Arena', 3, 'm3', 2000);
      INSERT INTO purchase_order_items VALUES ('${orderId}', 0, 2, 1250, 'Cemento', 'bulto'),
        ('00000000-0000-4000-8000-000000000002', 0, 3, 2000, 'Arena', 'm3');
      INSERT INTO odc_status_history VALUES ('${orderId}', 'BORRADOR');
    `);
  });
  afterEach(async () => {
    await runner.query('ROLLBACK').catch(() => undefined);
    await runner.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await runner.query('SET search_path TO public');
  });

  async function rows<Row>(sql: string): Promise<Row[]> {
    const value: unknown = await runner.query(sql);
    return value as Row[];
  }
  async function migrate() {
    const sql = readFileSync(
      resolve(__dirname, '../scripts/sql/041-odc-vat.sql'),
      'utf8',
    );
    await runner.query(sql);
  }

  it('R6: backfills zero VAT while preserving headers, items and history', async () => {
    const headers = await rows<Record<string, unknown>>(
      'SELECT id, status, version, "totalCents" FROM purchase_orders ORDER BY id',
    );
    const items = await rows<Record<string, unknown>>(
      'SELECT * FROM purchase_order_items ORDER BY "orderId"',
    );
    const history = await rows<Record<string, unknown>>(
      'SELECT * FROM odc_status_history',
    );
    await migrate();
    expect(
      await rows(
        'SELECT id, status, version, "totalCents" FROM purchase_orders ORDER BY id',
      ),
    ).toEqual(headers);
    expect(
      await rows('SELECT * FROM purchase_order_items ORDER BY "orderId"'),
    ).toEqual(items);
    expect(await rows('SELECT * FROM odc_status_history')).toEqual(history);
    expect(
      await rows(
        'SELECT "subtotalCents", "vatRateBps", "vatCents", "totalCents" FROM purchase_orders ORDER BY id',
      ),
    ).toEqual([
      { subtotalCents: 2500, vatRateBps: 0, vatCents: 0, totalCents: 2500 },
      { subtotalCents: 6000, vatRateBps: 0, vatCents: 0, totalCents: 6000 },
    ]);
  });

  it.each(['mismatch', 'missing'])(
    'R6: rejects %s items and rolls back schema changes',
    async (problem) => {
      if (problem === 'mismatch')
        await runner.query(
          `UPDATE purchase_order_items SET quantity = 1 WHERE "orderId" = '${orderId}'`,
        );
      else
        await runner.query(
          `DELETE FROM purchase_order_items WHERE "orderId" = '${orderId}'`,
        );
      await expect(migrate()).rejects.toThrow(orderId);
      await runner.query('ROLLBACK');
      const columns = await rows<{ count: string }>(
        `SELECT count(*)::text AS count FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = 'purchase_orders' AND column_name = 'subtotalCents'`,
      );
      expect(columns[0].count).toBe('0');
    },
  );

  it.each([
    ['blank description', "description = '   '"],
    ['blank unit', "unit = '   '"],
    ['negative position', 'position = -1'],
    ['different first-line projection', "description = 'Otra'"],
  ])('R6: rejects %s on stored lines without applying fiscal columns', async (_label, update) => {
    await runner.query(`UPDATE purchase_order_items SET ${update} WHERE "orderId" = '${orderId}'`);
    await expect(migrate()).rejects.toThrow(orderId);
    await runner.query('ROLLBACK');
    const columns = await rows<{ count: string }>(`SELECT count(*)::text AS count FROM information_schema.columns WHERE table_schema = '${schema}' AND table_name = 'purchase_orders' AND column_name = 'subtotalCents'`);
    expect(columns[0].count).toBe('0');
  });
});
