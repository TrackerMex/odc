import { getMetadataArgsStorage } from 'typeorm';
import { SupplierOrmEntity } from './supplier.orm-entity';

describe('R2: ORM entity mapped onto the suppliers table', () => {
  it("maps the entity to the 'suppliers' table", () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === SupplierOrmEntity,
    );

    expect(table).toBeDefined();
    expect(table?.name).toBe('suppliers');
  });

  it('declares the data model columns', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === SupplierOrmEntity,
    );
    const propertyNames = columns.map((c) => c.propertyName);

    expect(propertyNames).toEqual(
      expect.arrayContaining(['id', 'name', 'createdAt']),
    );
  });

  it('enforces a UNIQUE constraint on name', () => {
    const nameColumn = getMetadataArgsStorage().columns.find(
      (c) => c.target === SupplierOrmEntity && c.propertyName === 'name',
    );

    expect(nameColumn?.options.unique).toBe(true);
  });
});
