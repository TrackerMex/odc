import { DataSource, EntityManager } from 'typeorm';
import { OdcStatusHistoryEntry } from '../../domain/entities/odc-status-history-entry.entity';
import {
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { OdcStatusHistoryOrmEntity } from '../entities/odc-status-history.orm-entity';
import { PurchaseOrderOrmEntity } from '../entities/purchase-order.orm-entity';
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

interface ManagerMock {
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
}

function createManagerMock(): ManagerMock {
  return {
    save: jest.fn(),
    find: jest.fn(),
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

describe('R5: ODC update and history insert share a single transaction', () => {
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
    expect(manager.save).toHaveBeenCalledTimes(2);
    const [orderTarget, orderRow] = manager.save.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
    ];
    const [historyTarget, historyRow] = manager.save.mock.calls[1] as [
      unknown,
      Record<string, unknown>,
    ];
    expect(orderTarget).toBe(PurchaseOrderOrmEntity);
    expect(orderRow).toMatchObject({ id: ODC_ID, status: 'PENDIENTE_ADMIN' });
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

    expect(manager.save).toHaveBeenCalledTimes(1);
    const [savedTarget] = manager.save.mock.calls[0] as [unknown];
    expect(savedTarget).toBe(PurchaseOrderOrmEntity);
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
    manager.find.mockResolvedValue([{ odcNumber: `ODC-${year}-00041` }]);
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
    manager.find.mockResolvedValue([]);
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
      .mockResolvedValueOnce([{ odcNumber: `ODC-${year}-00042` }]);
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
    manager.find.mockResolvedValue([]);
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
