import {
  PurchaseOrder,
  PurchaseOrderProps,
} from './purchase-order.entity';

const actor = { userId: 'ops-user', role: 'DIRECTOR_OPS' as const };
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

function lineItems(order: PurchaseOrder) {
  return (order as unknown as { items: typeof first[] }).items;
}

describe('R1: purchase orders calculate their total from ordered line items', () => {
  it('creates multiple ordered items and projects the first one to legacy fields', () => {
    const { order } = PurchaseOrder.createDraft(
      {
        items: [first, second],
        supplier: 'Proveedor',
        comments: 'Entregar por la mañana',
      } as unknown as Parameters<typeof PurchaseOrder.createDraft>[0],
      actor,
    );

    expect(lineItems(order)).toEqual([first, second]);
    expect(order.totalCents).toBe(8500);
    expect(order.description).toBe('Cemento');
    expect(order.quantity).toBe(2);
    expect(order.unit).toBe('bulto');
    expect(order.unitPriceCents).toBe(1250);
    expect(order.supplier).toBe('Proveedor');
    expect(order.comments).toBe('Entregar por la mañana');
  });

  it('keeps the legacy scalar creation as exactly one line item', () => {
    const { order } = PurchaseOrder.createDraft(
      {
        ...first,
        supplier: 'Proveedor',
      },
      actor,
    );

    expect(lineItems(order)).toEqual([first]);
    expect(order.totalCents).toBe(2500);
  });

  it('replaces the line items on edit and recalculates the aggregate total', () => {
    const { order } = PurchaseOrder.createDraft(
      { ...first, supplier: 'Proveedor' },
      actor,
    );

    order.edit({
      items: [second, first],
    } as unknown as Parameters<typeof order.edit>[0]);

    expect(lineItems(order)).toEqual([second, first]);
    expect(order.totalCents).toBe(8500);
    expect(order.description).toBe('Arena');
    expect(order.quantity).toBe(3);
    expect(order.unit).toBe('m3');
    expect(order.unitPriceCents).toBe(2000);
  });

  it('preserves extra items when a legacy scalar edit changes the first line', () => {
    const props = {
      id: null,
      odcNumber: null,
      status: 'BORRADOR',
      ...first,
      items: [first, second],
      totalCents: 8500,
      supplier: 'Proveedor',
      comments: null,
      createdById: actor.userId,
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
      createdAt: null,
      updatedAt: null,
    } as unknown as PurchaseOrderProps;
    const order = new PurchaseOrder(props);

    order.edit({ quantity: 4 });

    expect(lineItems(order)).toEqual([{ ...first, quantity: 4 }, second]);
    expect(order.totalCents).toBe(11000);
    expect(order.quantity).toBe(4);
  });

  it('reconciles legacy scalar projections when cloning an order with spread', () => {
    const { order } = PurchaseOrder.createDraft(
      { items: [first, second], supplier: 'Proveedor' },
      actor,
    );

    const clone = new PurchaseOrder({
      ...order,
      quantity: 4,
      totalCents: 11000,
    });

    expect(lineItems(clone)).toEqual([{ ...first, quantity: 4 }, second]);
    expect(clone.totalCents).toBe(11000);
  });
});
