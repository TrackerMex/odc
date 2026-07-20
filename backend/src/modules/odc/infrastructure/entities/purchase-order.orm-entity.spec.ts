import { getMetadataArgsStorage } from 'typeorm';
import { UserOrmEntity } from '../../../users/infrastructure/entities/user.orm-entity';
import { PurchaseOrderOrmEntity } from './purchase-order.orm-entity';

describe('R5: ORM entity mapped onto the purchase_orders table', () => {
  it("maps the entity to the 'purchase_orders' table", () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === PurchaseOrderOrmEntity,
    );

    expect(table).toBeDefined();
    expect(table?.name).toBe('purchase_orders');
  });

  it('declares every column of the data model, including phase 4-8 ones', () => {
    const propertyNames = getMetadataArgsStorage()
      .columns.filter((c) => c.target === PurchaseOrderOrmEntity)
      .map((c) => c.propertyName);

    expect(propertyNames).toEqual(
      expect.arrayContaining([
        'id',
        'odcNumber',
        'status',
        'description',
        'quantity',
        'unit',
        'unitPriceCents',
        'totalCents',
        'supplier',
        'comments',
        'createdById',
        'rejectionReason',
        'paymentDate',
        'paymentMethod',
        'paymentReference',
        'paymentNotes',
        'paymentEvidenceFile',
        'evidenceReference',
        'invoiceFile',
        'invoiceNumber',
        'invoiceDate',
        'warehouseEntryDate',
        'observations',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('enforces a UNIQUE constraint on odcNumber', () => {
    const odcNumberColumn = getMetadataArgsStorage().columns.find(
      (c) =>
        c.target === PurchaseOrderOrmEntity && c.propertyName === 'odcNumber',
    );

    expect(odcNumberColumn?.options.unique).toBe(true);
  });

  it('declares the createdById foreign key to the users table', () => {
    const relation = getMetadataArgsStorage().relations.find(
      (r) =>
        r.target === PurchaseOrderOrmEntity && r.propertyName === 'createdBy',
    );
    const joinColumn = getMetadataArgsStorage().joinColumns.find(
      (j) =>
        j.target === PurchaseOrderOrmEntity && j.propertyName === 'createdBy',
    );

    expect(relation?.relationType).toBe('many-to-one');
    expect((relation?.type as () => typeof UserOrmEntity | undefined)?.()).toBe(
      UserOrmEntity,
    );
    expect(joinColumn?.name).toBe('createdById');
  });

  it('keeps the phase 4-8 columns nullable', () => {
    const nullableColumns = [
      'comments',
      'rejectionReason',
      'paymentDate',
      'paymentMethod',
      'paymentReference',
      'paymentNotes',
      'paymentEvidenceFile',
      'evidenceReference',
      'invoiceFile',
      'invoiceNumber',
      'invoiceDate',
      'warehouseEntryDate',
      'observations',
    ];
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === PurchaseOrderOrmEntity,
    );

    for (const propertyName of nullableColumns) {
      const column = columns.find((c) => c.propertyName === propertyName);
      expect(column?.options.nullable).toBe(true);
    }
  });

  it('keeps the required T1 columns non-nullable', () => {
    const requiredColumns = [
      'odcNumber',
      'status',
      'description',
      'quantity',
      'unit',
      'unitPriceCents',
      'totalCents',
      'supplier',
      'createdById',
    ];
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === PurchaseOrderOrmEntity,
    );

    for (const propertyName of requiredColumns) {
      const column = columns.find((c) => c.propertyName === propertyName);
      expect(column?.options.nullable ?? false).toBe(false);
    }
  });
});
