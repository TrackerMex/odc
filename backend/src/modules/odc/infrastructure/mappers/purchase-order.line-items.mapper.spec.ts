import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { toOdcPageResponse, toOdcResponse } from './odc-response.mapper';
import { toDomain } from './purchase-order.mapper';
import { PurchaseOrderOrmEntity } from '../entities/purchase-order.orm-entity';
import { PurchaseOrderLineItemOrmEntity } from '../entities/purchase-order-line-item.orm-entity';

const ODC_ID = 'b4e2d8b3-0000-4000-8000-000000000010';
const first = {
  description: 'Cemento',
  quantity: 2,
  unit: 'bulto',
  unitPriceCents: 1250,
};
const second = {
  description: 'Arena',
  quantity: 3,
  unit: 'm3',
  unitPriceCents: 2000,
};

function orderRow(): PurchaseOrderOrmEntity {
  return {
    id: ODC_ID,
    version: 2,
    odcNumber: 'ODC-2026-00001',
    status: 'BORRADOR',
    ...first,
    totalCents: 8500,
    supplier: 'Proveedor',
    comments: null,
    createdById: 'ops-user',
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
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    updatedAt: new Date('2026-10-01T00:00:00.000Z'),
  } as PurchaseOrderOrmEntity;
}

function itemRows(): PurchaseOrderLineItemOrmEntity[] {
  return [
    { ...second, id: 'line-2', orderId: ODC_ID, position: 1 },
    { ...first, id: 'line-1', orderId: ODC_ID, position: 0 },
  ] as PurchaseOrderLineItemOrmEntity[];
}

describe('R5: mappers hydrate and serialize ordered items with the legacy projection', () => {
  it('maps line rows into the domain in position order and calculates the total', () => {
    const mapRows = toDomain as unknown as (
      row: PurchaseOrderOrmEntity,
      history: [],
      items: PurchaseOrderLineItemOrmEntity[],
    ) => PurchaseOrder;

    const order = mapRows(orderRow(), [], itemRows());

    expect(order.items).toEqual([first, second]);
    expect(order.totalCents).toBe(8500);
    expect(order.description).toBe('Cemento');
    expect(order.quantity).toBe(2);
    expect(order.unit).toBe('bulto');
    expect(order.unitPriceCents).toBe(1250);
  });

  it('includes items in detail and list responses without exposing private file identifiers', () => {
    const order = PurchaseOrder.createDraft(
      { items: [first, second], supplier: 'Proveedor' },
      { userId: 'ops-user', role: 'DIRECTOR_OPS' },
    ).order;
    const response = toOdcResponse(order) as unknown as {
      items: typeof first[];
      description: string;
      totalCents: number;
      paymentEvidenceFile?: string;
    };
    const page = toOdcPageResponse({
      items: [order],
      total: 1,
      page: 1,
      pageSize: 20,
    }) as unknown as { items: { items: typeof first[] }[] };

    expect(response.items).toEqual([first, second]);
    expect(response).toMatchObject({ description: 'Cemento', totalCents: 8500 });
    expect(page.items[0].items).toEqual([first, second]);
    expect(response).not.toHaveProperty('paymentEvidenceFile');
  });
});
