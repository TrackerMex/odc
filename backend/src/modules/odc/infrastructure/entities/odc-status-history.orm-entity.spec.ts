import { getMetadataArgsStorage } from 'typeorm';
import { UserOrmEntity } from '../../../users/infrastructure/entities/user.orm-entity';
import { OdcStatusHistoryOrmEntity } from './odc-status-history.orm-entity';
import { PurchaseOrderOrmEntity } from './purchase-order.orm-entity';

describe('R5: ORM entity mapped onto the odc_status_history table', () => {
  it("maps the entity to the 'odc_status_history' table", () => {
    const table = getMetadataArgsStorage().tables.find(
      (t) => t.target === OdcStatusHistoryOrmEntity,
    );

    expect(table).toBeDefined();
    expect(table?.name).toBe('odc_status_history');
  });

  it('declares the history columns of the data model', () => {
    const propertyNames = getMetadataArgsStorage()
      .columns.filter((c) => c.target === OdcStatusHistoryOrmEntity)
      .map((c) => c.propertyName);

    expect(propertyNames).toEqual(
      expect.arrayContaining([
        'id',
        'odcId',
        'fromStatus',
        'toStatus',
        'userId',
        'note',
        'createdAt',
      ]),
    );
  });

  it('keeps fromStatus and note nullable, toStatus and userId required', () => {
    const columns = getMetadataArgsStorage().columns.filter(
      (c) => c.target === OdcStatusHistoryOrmEntity,
    );
    const byName = (name: string) =>
      columns.find((c) => c.propertyName === name);

    expect(byName('fromStatus')?.options.nullable).toBe(true);
    expect(byName('note')?.options.nullable).toBe(true);
    expect(byName('toStatus')?.options.nullable ?? false).toBe(false);
    expect(byName('userId')?.options.nullable ?? false).toBe(false);
  });

  it('declares the odcId foreign key to purchase_orders and userId to users', () => {
    const relations = getMetadataArgsStorage().relations.filter(
      (r) => r.target === OdcStatusHistoryOrmEntity,
    );
    const joinColumns = getMetadataArgsStorage().joinColumns.filter(
      (j) => j.target === OdcStatusHistoryOrmEntity,
    );

    const odcRelation = relations.find((r) => r.propertyName === 'odc');
    expect(odcRelation?.relationType).toBe('many-to-one');
    expect(
      (
        odcRelation?.type as () => typeof PurchaseOrderOrmEntity | undefined
      )?.(),
    ).toBe(PurchaseOrderOrmEntity);
    expect(joinColumns.find((j) => j.propertyName === 'odc')?.name).toBe(
      'odcId',
    );

    const userRelation = relations.find((r) => r.propertyName === 'user');
    expect(userRelation?.relationType).toBe('many-to-one');
    expect(
      (userRelation?.type as () => typeof UserOrmEntity | undefined)?.(),
    ).toBe(UserOrmEntity);
    expect(joinColumns.find((j) => j.propertyName === 'user')?.name).toBe(
      'userId',
    );
  });
});
