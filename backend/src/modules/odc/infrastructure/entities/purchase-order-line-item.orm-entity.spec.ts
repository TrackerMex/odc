import { getMetadataArgsStorage } from 'typeorm';
import { PurchaseOrderOrmEntity } from './purchase-order.orm-entity';
import { PurchaseOrderLineItemOrmEntity } from './purchase-order-line-item.orm-entity';

describe('R5: normalized purchase-order line-item entity', () => {
  it('maps required line fields and an explicit position onto the child table', () => {
    const table = getMetadataArgsStorage().tables.find(
      (entry) => entry.target === PurchaseOrderLineItemOrmEntity,
    );
    const columns = getMetadataArgsStorage()
      .columns.filter((entry) => entry.target === PurchaseOrderLineItemOrmEntity)
      .map((entry) => entry.propertyName);

    expect(table?.name).toBe('purchase_order_items');
    expect(columns).toEqual(
      expect.arrayContaining([
        'id',
        'orderId',
        'position',
        'description',
        'quantity',
        'unit',
        'unitPriceCents',
      ]),
    );
  });

  it('uses a unique order-position pair and cascades deletion with its ODC', () => {
    const index = getMetadataArgsStorage().indices.find(
      (entry) =>
        entry.target === PurchaseOrderLineItemOrmEntity && entry.unique,
    );
    const relation = getMetadataArgsStorage().relations.find(
      (entry) =>
        entry.target === PurchaseOrderLineItemOrmEntity &&
        entry.propertyName === 'order',
    );

    expect(index?.columns).toEqual(['orderId', 'position']);
    expect(relation?.relationType).toBe('many-to-one');
    expect(relation?.options?.onDelete).toBe('CASCADE');
    expect(
      getMetadataArgsStorage().relations.some(
        (entry) =>
          entry.target === PurchaseOrderOrmEntity &&
          entry.propertyName === 'items',
      ),
    ).toBe(true);
  });
});
