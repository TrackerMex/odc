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
    expect(order).toMatchObject({ subtotalCents: 20000, vatRateBps: 1600, vatCents: 3200, totalCents: 23200 });
    order.transition('submit', 'DIRECTOR_OPS');
    expect(order).toMatchObject({ status: 'PENDIENTE_ADMIN', subtotalCents: 20000, vatRateBps: 1600, vatCents: 3200, totalCents: 23200 });
  });

  it('recalculates a rejected taxable order when it is edited', () => {
    const order = createOrder([10000]);
    order.transition('submit', 'DIRECTOR_OPS');
    order.transition('reject', 'ADMINISTRACION', { rejectionReason: 'Corregir' });
    order.edit({ unitPriceCents: 25000 });
    expect(order).toMatchObject({ status: 'RECHAZADA', subtotalCents: 25000, vatRateBps: 1600, vatCents: 4000, totalCents: 29000 });
  });
});
