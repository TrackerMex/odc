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
