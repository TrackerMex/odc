import { DataSource, EntityManager } from 'typeorm';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { OdcStatusHistoryOrmEntity } from '../entities/odc-status-history.orm-entity';
import { PurchaseOrderOrmEntity } from '../entities/purchase-order.orm-entity';
import { PurchaseOrderLineItemOrmEntity } from '../entities/purchase-order-line-item.orm-entity';
import { PurchaseOrderTypeOrmRepository } from './purchase-order.typeorm.repository';

const OPS_ID = 'a3d1c9a2-0000-4000-8000-000000000001';
const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000010';

function buildOrder(
  overrides: Partial<PurchaseOrderProps> = {},
): PurchaseOrder {
  return new PurchaseOrder({
    id: ODC_ID,
    odcNumber: 'ODC-2026-00001',
    status: 'BORRADOR',
    description: 'Cemento gris 50kg',
    quantity: 10,
    unit: 'bulto',
    unitPriceCents: 18550,
    totalCents: 185500,
    supplier: 'CEMEX',
    comments: null,
    createdById: OPS_ID,
    rejectionReason: null,
    paymentDate: null,
    paymentMethod: null,
    paymentReference: null,
    paymentNotes: null,
    paymentEvidenceFile: null,
    evidenceReference: null,
    invoiceFile: null,
    invoiceNumber: null,
    invoiceDate: null,
    warehouseEntryDate: null,
    observations: null,
    createdAt: new Date('2026-07-19T00:00:00Z'),
    updatedAt: new Date('2026-07-19T00:00:00Z'),
    ...overrides,
  });
}

const itemRows = [
  {
    orderId: ODC_ID,
    position: 0,
    description: 'Cemento gris 50kg',
    quantity: 10,
    unit: 'bulto',
    unitPriceCents: 18550,
  },
];

interface ManagerMock {
  save: jest.Mock;
  insert: jest.Mock;
  delete: jest.Mock;
  update: jest.Mock;
  findOneOrFail: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
}

function createManagerMock(): ManagerMock {
  const findOneOrFail = jest.fn();
  return {
    findOneOrFail,
    update: jest
      .fn()
      .mockImplementation(
        (_target: unknown, _where: object, values: object) => {
          findOneOrFail.mockResolvedValue({ id: ODC_ID, ...values });
          return Promise.resolve({ affected: 1 });
        },
      ),
    save: jest.fn(),
    insert: jest.fn().mockResolvedValue({ identifiers: [] }),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
    find: jest
      .fn()
      .mockImplementation((target: unknown) =>
        Promise.resolve(
          target === PurchaseOrderLineItemOrmEntity ? itemRows : [],
        ),
      ),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };
}

interface DataSourceMock {
  manager: ManagerMock;
  transaction: jest.Mock;
}

function createDataSourceMock(manager: ManagerMock): DataSourceMock {
  return {
    manager,
    transaction: jest.fn(
      (callback: (manager: EntityManager) => Promise<unknown>) =>
        callback(manager as unknown as EntityManager),
    ),
  };
}

function createRepository(manager: ManagerMock): {
  repository: PurchaseOrderTypeOrmRepository;
  dataSource: DataSourceMock;
} {
  const dataSource = createDataSourceMock(manager);
  const repository = new PurchaseOrderTypeOrmRepository(
    dataSource as unknown as DataSource,
  );
  return { repository, dataSource };
}

describe('R1,R2 (#36); R5 (#3): ODC conditional update and history insert share a single transaction', () => {
  it('persists the ODC row and its history row through the same transactional manager', async () => {
    const manager = createManagerMock();
    manager.save.mockImplementation((_entity: unknown, row: object) =>
      Promise.resolve({ id: ODC_ID, ...row }),
    );
    const { repository, dataSource } = createRepository(manager);
    const order = buildOrder({ status: 'PENDIENTE_ADMIN' });
    const entry = new OdcStatusHistoryEntry(
      null,
      ODC_ID,
      'BORRADOR',
      'PENDIENTE_ADMIN',
      OPS_ID,
      null,
      null,
    );

    await repository.update(order, entry);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.save).toHaveBeenCalledTimes(1);
    expect(manager.update).toHaveBeenCalledTimes(1);
    const [orderTarget, expected, orderRow] = manager.update.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    const [historyTarget, historyRow] = manager.save.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
    ];
    expect(orderTarget).toBe(PurchaseOrderOrmEntity);
    expect(expected).toMatchObject({
      id: ODC_ID,
      version: 0,
      status: 'BORRADOR',
    });
    expect(orderRow).toMatchObject({
      id: ODC_ID,
      status: 'PENDIENTE_ADMIN',
      version: 1,
    });
    expect(manager.update).toHaveBeenCalledWith(
      PurchaseOrderOrmEntity,
      { id: ODC_ID, version: 0, status: 'BORRADOR' },
      expect.any(Object),
    );
    expect(historyTarget).toBe(OdcStatusHistoryOrmEntity);
    expect(historyRow).toMatchObject({
      odcId: ODC_ID,
      fromStatus: 'BORRADOR',
      toStatus: 'PENDIENTE_ADMIN',
      userId: OPS_ID,
      note: null,
    });
  });

  it('updates without a history row when the change is not a transition', async () => {
    const manager = createManagerMock();
    manager.save.mockImplementation((_entity: unknown, row: object) =>
      Promise.resolve({ id: ODC_ID, ...row }),
    );
    const { repository } = createRepository(manager);

    await repository.update(buildOrder());

    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.findOneOrFail).toHaveBeenCalledTimes(1);
    expect(manager.update).toHaveBeenCalledWith(
      PurchaseOrderOrmEntity,
      { id: ODC_ID, version: 0, status: 'BORRADOR' },
      expect.any(Object),
    );
  });

  it('returns the updated ODC mapped back to the domain', async () => {
    const manager = createManagerMock();
    manager.save.mockImplementation((_entity: unknown, row: object) =>
      Promise.resolve({ id: ODC_ID, ...row }),
    );
    const { repository } = createRepository(manager);
    const order = buildOrder({ status: 'PENDIENTE_ADMIN' });

    const updated = await repository.update(order);

    expect(updated).toBeInstanceOf(PurchaseOrder);
    expect(updated.id).toBe(ODC_ID);
    expect(updated.status).toBe('PENDIENTE_ADMIN');
    expect(updated).toMatchObject({ version: 1 });
  });
});

describe('R1,R2: stale writes skip history (#36)', () => {
  it('rejects when UPDATE affects no row, without inserting history', async () => {
    const manager = createManagerMock();
    manager.update.mockResolvedValue({ affected: 0 });
    const { repository } = createRepository(manager);
    const entry = new OdcStatusHistoryEntry(
      null,
      ODC_ID,
      'BORRADOR',
      'PENDIENTE_ADMIN',
      OPS_ID,
      null,
      null,
    );
    await expect(
      repository.update(buildOrder({ status: 'PENDIENTE_ADMIN' }), entry),
    ).rejects.toMatchObject({ name: 'OdcConcurrentUpdateError' });
    expect(manager.save).not.toHaveBeenCalled();
  });
});

describe('R6: create assigns the next yearly number and retries on UNIQUE collision', () => {
  const year = new Date().getFullYear();

  function uniqueViolation(): Error {
    return Object.assign(new Error('duplicate key value'), {
      driverError: { code: '23505' },
    });
  }

  function openingEntry(): OdcStatusHistoryEntry {
    return new OdcStatusHistoryEntry(
      null,
      null,
      null,
      'BORRADOR',
      OPS_ID,
      null,
      null,
    );
  }

  it('assigns the next correlative of the current year inside the create transaction', async () => {
    const manager = createManagerMock();
    manager.find.mockImplementation((target: unknown) =>
      Promise.resolve(
        target === PurchaseOrderOrmEntity
          ? [{ odcNumber: `ODC-${year}-00041` }]
          : target === PurchaseOrderLineItemOrmEntity
            ? itemRows
            : [],
      ),
    );
    manager.save.mockImplementation((_entity: unknown, row: object) =>
      Promise.resolve({ id: ODC_ID, ...row }),
    );
    const { repository, dataSource } = createRepository(manager);
    const order = buildOrder({ id: null, odcNumber: null });

    const created = await repository.create(order, openingEntry());

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(created.odcNumber).toBe(`ODC-${year}-00042`);
    const [, orderRow] = manager.save.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
    ];
    expect(orderRow.odcNumber).toBe(`ODC-${year}-00042`);
    const [historyTarget, historyRow] = manager.save.mock.calls[1] as [
      unknown,
      Record<string, unknown>,
    ];
    expect(historyTarget).toBe(OdcStatusHistoryOrmEntity);
    expect(historyRow).toMatchObject({
      odcId: ODC_ID,
      fromStatus: null,
      toStatus: 'BORRADOR',
      userId: OPS_ID,
    });
  });

  it('starts at 00001 when the year has no ODCs yet', async () => {
    const manager = createManagerMock();
    manager.find.mockImplementation((target: unknown) =>
      Promise.resolve(
        target === PurchaseOrderLineItemOrmEntity ? itemRows : [],
      ),
    );
    manager.save.mockImplementation((_entity: unknown, row: object) =>
      Promise.resolve({ id: ODC_ID, ...row }),
    );
    const { repository } = createRepository(manager);

    const created = await repository.create(
      buildOrder({ id: null, odcNumber: null }),
      openingEntry(),
    );

    expect(created.odcNumber).toBe(`ODC-${year}-00001`);
  });

  it('retries with the next number when the UNIQUE constraint rejects a concurrent duplicate', async () => {
    const manager = createManagerMock();
    manager.find
      .mockResolvedValueOnce([{ odcNumber: `ODC-${year}-00041` }])
      .mockResolvedValueOnce([{ odcNumber: `ODC-${year}-00042` }])
      .mockImplementation((target: unknown) =>
        Promise.resolve(
          target === PurchaseOrderLineItemOrmEntity ? itemRows : [],
        ),
      );
    manager.save
      .mockRejectedValueOnce(uniqueViolation())
      .mockImplementation((_entity: unknown, row: object) =>
        Promise.resolve({ id: ODC_ID, ...row }),
      );
    const { repository, dataSource } = createRepository(manager);

    const created = await repository.create(
      buildOrder({ id: null, odcNumber: null }),
      openingEntry(),
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(2);
    expect(created.odcNumber).toBe(`ODC-${year}-00043`);
  });

  it('propagates non-UNIQUE errors without retrying', async () => {
    const manager = createManagerMock();
    manager.find.mockImplementation((target: unknown) =>
      Promise.resolve(
        target === PurchaseOrderLineItemOrmEntity ? itemRows : [],
      ),
    );
    manager.save.mockRejectedValue(new Error('connection lost'));
    const { repository, dataSource } = createRepository(manager);

    await expect(
      repository.create(
        buildOrder({ id: null, odcNumber: null }),
        openingEntry(),
      ),
    ).rejects.toThrow('connection lost');
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });
});

describe('R1,R3: persisted mutation history is read inside its transaction (#40)', () => {
  const openingRow = {
    id: 'opening-id',
    odcId: ODC_ID,
    fromStatus: null,
    toStatus: 'BORRADOR',
    userId: OPS_ID,
    note: 'Persisted opening',
    createdAt: new Date('2026-10-01T00:00:00Z'),
  };
  const transitionRow = {
    id: 'transition-id',
    odcId: ODC_ID,
    fromStatus: 'BORRADOR',
    toStatus: 'PENDIENTE_ADMIN',
    userId: OPS_ID,
    note: 'Persisted transition',
    createdAt: new Date('2026-10-02T00:00:00Z'),
  };

  function managerWithHistory(rows: object[]) {
    const manager = createManagerMock();
    manager.save.mockImplementation((_entity: unknown, row: object) =>
      Promise.resolve({ id: ODC_ID, ...row }),
    );
    manager.find.mockImplementation((target: unknown) =>
      Promise.resolve(
        target === OdcStatusHistoryOrmEntity
          ? rows
          : target === PurchaseOrderLineItemOrmEntity
            ? itemRows
            : [],
      ),
    );
    return manager;
  }

  it('R1: create returns persisted opening metadata rather than the unsaved input', async () => {
    const manager = managerWithHistory([openingRow]);
    const { repository } = createRepository(manager);
    const created = await repository.create(
      buildOrder({ id: null, odcNumber: null }),
      new OdcStatusHistoryEntry(
        null,
        null,
        null,
        'BORRADOR',
        OPS_ID,
        null,
        null,
      ),
    );
    expect(created.history).toEqual([
      new OdcStatusHistoryEntry(
        openingRow.id,
        ODC_ID,
        null,
        'BORRADOR',
        OPS_ID,
        openingRow.note,
        openingRow.createdAt,
      ),
    ]);
    expect(manager.find).toHaveBeenLastCalledWith(OdcStatusHistoryOrmEntity, {
      where: { odcId: ODC_ID },
      order: { createdAt: 'ASC' },
    });
    expect(manager.find.mock.invocationCallOrder.at(-1)).toBeGreaterThan(
      manager.save.mock.invocationCallOrder.at(-1)!,
    );
  });

  it('R1: transition returns every persisted event with its stored metadata in chronological order', async () => {
    const manager = managerWithHistory([openingRow, transitionRow]);
    const { repository } = createRepository(manager);
    const saved = await repository.update(
      buildOrder({ status: 'PENDIENTE_ADMIN' }),
      new OdcStatusHistoryEntry(
        null,
        ODC_ID,
        'BORRADOR',
        'PENDIENTE_ADMIN',
        OPS_ID,
        null,
        null,
      ),
    );
    expect(saved.history.map((entry) => ({ ...entry }))).toEqual([
      openingRow,
      transitionRow,
    ]);
    expect(manager.find).toHaveBeenCalledWith(OdcStatusHistoryOrmEntity, {
      where: { odcId: ODC_ID },
      order: { createdAt: 'ASC' },
    });
    expect(manager.find.mock.invocationCallOrder[0]).toBeGreaterThan(
      manager.save.mock.invocationCallOrder[0],
    );
  });

  it('R1: an edit returns unchanged persisted history without inserting or duplicating events', async () => {
    const manager = managerWithHistory([openingRow]);
    const { repository } = createRepository(manager);
    const saved = await repository.update(
      buildOrder({ description: 'Edited' }),
    );
    expect(saved.history.map((entry) => ({ ...entry }))).toEqual([openingRow]);
    expect(manager.save).not.toHaveBeenCalled();
    expect(manager.find).toHaveBeenCalledWith(OdcStatusHistoryOrmEntity, {
      where: { odcId: ODC_ID },
      order: { createdAt: 'ASC' },
    });
  });

  it.each(['create', 'update'] as const)(
    'R3: %s rejects if transactional response history cannot be read',
    async (operation) => {
      const manager = managerWithHistory([]);
      const error = new Error('history read failed');
      manager.find.mockImplementation((target: unknown) =>
        target === OdcStatusHistoryOrmEntity
          ? Promise.reject(error)
          : Promise.resolve([]),
      );
      const { repository, dataSource } = createRepository(manager);
      const entry = new OdcStatusHistoryEntry(
        null,
        null,
        null,
        'BORRADOR',
        OPS_ID,
        null,
        null,
      );
      const pending =
        operation === 'create'
          ? repository.create(buildOrder({ id: null, odcNumber: null }), entry)
          : repository.update(buildOrder());
      await expect(pending).rejects.toBe(error);
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    },
  );
});
