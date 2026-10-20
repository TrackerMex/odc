import { DataSource, EntityManager } from 'typeorm';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { OdcStatusHistoryOrmEntity } from '../entities/odc-status-history.orm-entity';
import { PurchaseOrderLineItemOrmEntity } from '../entities/purchase-order-line-item.orm-entity';
import { PurchaseOrderOrmEntity } from '../entities/purchase-order.orm-entity';
import { PurchaseOrderTypeOrmRepository } from './purchase-order.typeorm.repository';

const OWNER = 'ops-user';
const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000010';
const actor = { userId: OWNER, role: 'DIRECTOR_OPS' as const };
const lines = [
  { description: 'Cemento', quantity: 2, unit: 'bulto', unitPriceCents: 1250 },
  { description: 'Arena', quantity: 3, unit: 'm3', unitPriceCents: 2000 },
];

function openingEntry() {
  return new OdcStatusHistoryEntry(
    null,
    null,
    null,
    'BORRADOR',
    OWNER,
    null,
    null,
  );
}

function repositoryWithManager(initialLines: Record<string, unknown>[] = []) {
  const persistedLines = [...initialLines];
  let parent: Record<string, unknown> = {};
  const manager = {
    find: jest.fn().mockImplementation((target: unknown) =>
      Promise.resolve(
        target === PurchaseOrderLineItemOrmEntity ? persistedLines : [],
      ),
    ),
    findOne: jest.fn(),
    findOneOrFail: jest.fn().mockImplementation(() =>
      Promise.resolve({ id: ODC_ID, ...parent }),
    ),
    findAndCount: jest.fn(),
    save: jest.fn().mockImplementation((target: unknown, value: object) => {
      if (target === PurchaseOrderOrmEntity) {
        parent = { ...value };
        return Promise.resolve({ id: ODC_ID, ...parent });
      }
      return Promise.resolve({ id: 'history-1', ...value });
    }),
    insert: jest.fn().mockImplementation((target: unknown, values: object[]) => {
      if (target === PurchaseOrderLineItemOrmEntity)
        persistedLines.push(...values);
      return Promise.resolve({ identifiers: [] });
    }),
    delete: jest.fn().mockImplementation(() => {
      persistedLines.splice(0, persistedLines.length);
      return Promise.resolve({ affected: initialLines.length });
    }),
    update: jest.fn().mockImplementation((_target, _where, values) => {
      parent = { ...values };
      return Promise.resolve({ affected: 1 });
    }),
  };
  const dataSource = {
    manager,
    transaction: jest.fn(
      (callback: (transactionManager: EntityManager) => Promise<unknown>) =>
        callback(manager as unknown as EntityManager),
    ),
  };
  return {
    repository: new PurchaseOrderTypeOrmRepository(
      dataSource as unknown as DataSource,
    ),
    manager,
    dataSource,
    persistedLines,
  };
}

describe('R5: line rows and ODC header share repository transactions', () => {
  it('creates ordered line rows in the same transaction as the header and opening history', async () => {
    const { order } = PurchaseOrder.createDraft(
      { items: lines, supplier: 'Proveedor' },
      actor,
    );
    const { repository, manager, dataSource, persistedLines } =
      repositoryWithManager();

    const created = await repository.create(order, openingEntry());

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.insert).toHaveBeenCalledWith(
      PurchaseOrderLineItemOrmEntity,
      expect.arrayContaining([
        expect.objectContaining({ orderId: ODC_ID, position: 0, ...lines[0] }),
        expect.objectContaining({ orderId: ODC_ID, position: 1, ...lines[1] }),
      ]),
    );
    expect(manager.save).toHaveBeenCalledWith(
      OdcStatusHistoryOrmEntity,
      expect.objectContaining({ odcId: ODC_ID, toStatus: 'BORRADOR' }),
    );
    expect(created.items).toEqual(lines);
    expect(created.totalCents).toBe(8500);
    expect(persistedLines.map((line) => line.position)).toEqual([0, 1]);
  });

  it('replaces all line rows atomically on update and returns their stored order', async () => {
    const { order } = PurchaseOrder.createDraft(
      { items: lines, supplier: 'Proveedor' },
      actor,
    );
    const persistedLines = lines.map((item, position) => ({
      ...item,
      orderId: ODC_ID,
      position,
    }));
    const { repository, manager, dataSource } =
      repositoryWithManager(persistedLines);
    const updatedOrder = new PurchaseOrder({ ...order, id: ODC_ID });
    updatedOrder.edit({ items: [lines[1], lines[0]] });

    const updated = await repository.update(updatedOrder);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.update).toHaveBeenCalledTimes(1);
    expect(manager.delete).toHaveBeenCalledWith(
      PurchaseOrderLineItemOrmEntity,
      { orderId: ODC_ID },
    );
    expect(manager.insert).toHaveBeenCalledWith(
      PurchaseOrderLineItemOrmEntity,
      expect.arrayContaining([
        expect.objectContaining({ orderId: ODC_ID, position: 0, ...lines[1] }),
        expect.objectContaining({ orderId: ODC_ID, position: 1, ...lines[0] }),
      ]),
    );
    expect(updated.items).toEqual([lines[1], lines[0]]);
    expect(updated.totalCents).toBe(8500);
  });
});
