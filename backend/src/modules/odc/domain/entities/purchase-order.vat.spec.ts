import { PurchaseOrder } from './purchase-order.entity';

const actor = { userId: 'ops-user', role: 'DIRECTOR_OPS' as const };

function createOrder(prices: number[]) {
  return PurchaseOrder.createDraft(
    {
      supplier: 'Proveedor',
      items: prices.map((unitPriceCents, index) => ({
        description: `Partida ${index + 1}`,
        quantity: 1,
        unit: 'pieza',
        unitPriceCents,
      })),
    },
    actor,
  ).order;
}

describe('R1: VAT is rounded once on the subtotal of a new ODC', () => {
  it.each([
    [[10000], 10000, 1600, 11600],
    [[3], 3, 0, 3],
    [[4], 4, 1, 5],
    [[3, 3], 6, 1, 7],
  ])(
    'calculates %j as subtotal %i, VAT %i and total %i',
    (prices, subtotalCents, vatCents, totalCents) => {
      const order = createOrder(prices);
      expect(order).toMatchObject({
        subtotalCents,
        vatRateBps: 1600,
        vatCents,
        totalCents,
      });
    },
  );
});

describe('R2: taxable orders recalculate on edit and retain amounts on transitions', () => {
  it('recalculates an editable draft and keeps the same amounts when submitted', () => {
    const order = createOrder([10000]);
    order.edit({ unitPriceCents: 20000 });
    expect(order).toMatchObject({
      subtotalCents: 20000,
      vatRateBps: 1600,
      vatCents: 3200,
      totalCents: 23200,
    });
    order.transition('submit', 'DIRECTOR_OPS');
    expect(order).toMatchObject({
      status: 'PENDIENTE_ADMIN',
      subtotalCents: 20000,
      vatRateBps: 1600,
      vatCents: 3200,
      totalCents: 23200,
    });
  });

  it('recalculates a rejected taxable order when it is edited', () => {
    const order = createOrder([10000]);
    order.transition('submit', 'DIRECTOR_OPS');
    order.transition('reject', 'ADMINISTRACION', {
      rejectionReason: 'Corregir',
    });
    order.edit({ unitPriceCents: 25000 });
    expect(order).toMatchObject({
      status: 'RECHAZADA',
      subtotalCents: 25000,
      vatRateBps: 1600,
      vatCents: 4000,
      totalCents: 29000,
    });
  });
});

describe('R3: historic orders preserve amounts until an old draft is saved', () => {
  function historical(status: 'BORRADOR' | 'RECHAZADA' = 'BORRADOR') {
    return new PurchaseOrder({
      ...createOrder([10000]),
      id: 'old-odc',
      status,
      subtotalCents: 10000,
      vatRateBps: 0,
      vatCents: 0,
      totalCents: 10000,
    });
  }

  it('applies VAT when an old draft is edited even if only comments change', () => {
    const order = historical();
    order.edit({ comments: 'Actualizado' });
    expect(order).toMatchObject({
      subtotalCents: 10000,
      vatRateBps: 1600,
      vatCents: 1600,
      totalCents: 11600,
    });
  });

  it('preserves historic rejected orders when edited and submitted', () => {
    const order = historical('RECHAZADA');
    order.edit({ unitPriceCents: 20000 });
    order.transition('submit', 'DIRECTOR_OPS');
    expect(order).toMatchObject({
      subtotalCents: 20000,
      vatRateBps: 0,
      vatCents: 0,
      totalCents: 20000,
    });
  });

  it('does not apply VAT to an old draft merely submitted without an edit', () => {
    const order = historical();
    order.transition('submit', 'DIRECTOR_OPS');
    expect(order).toMatchObject({
      vatRateBps: 0,
      vatCents: 0,
      totalCents: 10000,
    });
  });
});

describe('R7: VAT arithmetic and hydration respect storage limits', () => {
  it('accepts the largest subtotal whose total fits int and rejects the next cent', () => {
    expect(createOrder([1851279006]).totalCents).toBe(2147483647);
    expect(() => createOrder([1851279007])).toThrow();
  });

  it('rejects inconsistent persisted VAT and total including scalar-only hydration', () => {
    const order = createOrder([10000]);
    expect(() => new PurchaseOrder({ ...order, vatCents: 0 })).toThrow();
    expect(
      () =>
        new PurchaseOrder({ ...order, items: undefined, totalCents: 10000 }),
    ).toThrow();
  });

  it('rejects a partially missing persisted fiscal breakdown', () => {
    const order = createOrder([10000]);
    expect(
      () => new PurchaseOrder({ ...order, subtotalCents: undefined }),
    ).toThrow();
    expect(
      () => new PurchaseOrder({ ...order, vatCents: undefined }),
    ).toThrow();
    expect(
      () =>
        new PurchaseOrder({ ...order, vatRateBps: null as unknown as number }),
    ).toThrow();
  });

  it('does not mutate any order fields if VAT makes an edit overflow', () => {
    const order = createOrder([10000]);
    const before = JSON.stringify(order);
    expect(() => order.edit({ unitPriceCents: 1851279007 })).toThrow();
    expect(JSON.stringify(order)).toBe(before);
  });
});
