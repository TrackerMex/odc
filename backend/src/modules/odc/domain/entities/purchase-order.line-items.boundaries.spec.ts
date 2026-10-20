import { InvalidOdcInputError } from '../errors/invalid-odc-input.error';
import { PurchaseOrder } from './purchase-order.entity';

const MAX = 2_147_483_647;
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

describe('R4: domain validates each item and the aggregate total', () => {
  it.each([
    { ...first, description: '   ' },
    { ...first, unit: '  ' },
    { ...first, quantity: 0 },
    { ...first, quantity: MAX + 1 },
    { ...first, quantity: 1.5 },
    { ...first, unitPriceCents: 0 },
    { ...first, unitPriceCents: MAX + 1 },
    { ...first, unitPriceCents: 1.5 },
  ])('rejects an invalid line item %j', (item) => {
    expect(() =>
      PurchaseOrder.createDraft(
        {
          items: [item],
          supplier: 'Proveedor',
        },
        actor,
      ),
    ).toThrow(InvalidOdcInputError);
  });

  it('rejects an individual product above MAX_ODC_INTEGER', () => {
    expect(() =>
      PurchaseOrder.createDraft(
        {
          items: [
            { ...first, quantity: 50_000, unitPriceCents: 50_000 },
          ],
          supplier: 'Proveedor',
        },
        actor,
      ),
    ).toThrow(InvalidOdcInputError);
  });

  it('rejects an aggregate sum above MAX_ODC_INTEGER', () => {
    expect(() =>
      PurchaseOrder.createDraft(
        {
          items: [
            { ...first, quantity: MAX, unitPriceCents: 1 },
            { ...second, quantity: 1, unitPriceCents: 1 },
          ],
          supplier: 'Proveedor',
        },
        actor,
      ),
    ).toThrow(InvalidOdcInputError);
  });

  it('rejects an invalid replacement without mutating the existing order', () => {
    const { order } = PurchaseOrder.createDraft(
      { items: [first, second], supplier: 'Proveedor' },
      actor,
    );
    const before = JSON.stringify(order);

    expect(() => order.edit({ items: [{ ...first, unitPriceCents: MAX + 1 }] }))
      .toThrow(InvalidOdcInputError);
    expect(JSON.stringify(order)).toBe(before);
  });
});
