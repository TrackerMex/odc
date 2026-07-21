import { readFileSync } from 'fs';
import { join } from 'path';
import { Supplier } from './supplier.entity';

describe('R1: pure Supplier domain entity', () => {
  it('holds the data model properties passed to the constructor', () => {
    const createdAt = new Date('2026-07-19T00:00:00Z');
    const supplier = new Supplier(
      'a3d1c9a2-0000-4000-8000-000000000001',
      'Ruptela',
      createdAt,
    );

    expect(supplier.id).toBe('a3d1c9a2-0000-4000-8000-000000000001');
    expect(supplier.name).toBe('Ruptela');
    expect(supplier.createdAt).toBe(createdAt);
  });

  it('allows a null id and createdAt for a not-yet-persisted supplier', () => {
    const supplier = new Supplier(null, 'RBI Topfly', null);

    expect(supplier.id).toBeNull();
    expect(supplier.createdAt).toBeNull();
  });

  it('does not import any framework, ORM or infrastructure library', () => {
    const source = readFileSync(join(__dirname, 'supplier.entity.ts'), 'utf8');
    const importLines = source
      .split('\n')
      .filter((line) => /^\s*import\s/.test(line) || /require\(/.test(line));

    expect(importLines).toEqual([]);
  });
});
