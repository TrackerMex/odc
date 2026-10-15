import { InvalidOdcInputError } from '../errors/invalid-odc-input.error';
import { PurchaseOrder } from './purchase-order.entity';

const MAX = 2_147_483_647;
const actor = { userId: 'test-owner', role: 'DIRECTOR_OPS' as const };
const input = {
  description: 'Original',
  quantity: 1,
  unit: 'pza',
  unitPriceCents: 1,
  supplier: 'Test',
};
function draft(quantity = 1, unitPriceCents = 1) {
  return PurchaseOrder.createDraft(
    { ...input, quantity, unitPriceCents },
    actor,
  ).order;
}

describe('R1: positive int32 quantity, price and total in the domain (#37)', () => {
  it.each([
    0,
    -1,
    -0,
    0.5,
    1.5,
    MAX + 1,
    Number.MAX_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER + 1,
    NaN,
    Infinity,
    -Infinity,
  ])('rejects operand %s in either position and draft creation', (value) => {
    expect(() => PurchaseOrder.computeTotalCents(value, 1)).toThrow(
      InvalidOdcInputError,
    );
    expect(() => PurchaseOrder.computeTotalCents(1, value)).toThrow(
      InvalidOdcInputError,
    );
    expect(() => draft(value, 1)).toThrow(InvalidOdcInputError);
    expect(() => draft(1, value)).toThrow(InvalidOdcInputError);
  });
  it.each([
    [MAX, 1],
    [1, MAX],
    [1, 1],
    [2, 1_073_741_823],
  ])('accepts valid limits %i * %i', (quantity, price) => {
    expect(draft(quantity, price).totalCents).toBe(quantity * price);
  });
  it.each([
    [50_000, 50_000],
    [2, 1_073_741_824],
    [MAX, MAX],
  ])('rejects overflowing product %i * %i', (quantity, price) => {
    expect(() => PurchaseOrder.computeTotalCents(quantity, price)).toThrow(
      InvalidOdcInputError,
    );
    expect(() => draft(quantity, price)).toThrow(InvalidOdcInputError);
  });
  it.each([
    {
      initial: [50_000, 1],
      fields: { unitPriceCents: 50_000, description: 'Must not change' },
    },
    {
      initial: [1, 50_000],
      fields: { quantity: 50_000, description: 'Must not change' },
    },
    {
      initial: [1, 1],
      fields: { quantity: 0, description: 'Must not change' },
    },
    {
      initial: [1, 1],
      fields: { unitPriceCents: MAX + 1, description: 'Must not change' },
    },
  ])('rejects a partial edit atomically: %j', ({ initial, fields }) => {
    const order = draft(initial[0], initial[1]);
    const snapshot = JSON.stringify(order);
    expect(() => order.edit(fields)).toThrow(InvalidOdcInputError);
    expect(JSON.stringify(order)).toBe(snapshot);
  });
  it('recomputes an accepted partial edit at the inclusive ceiling', () => {
    const order = draft();
    order.edit({ unitPriceCents: MAX });
    expect(order.totalCents).toBe(MAX);
    order.edit({ unitPriceCents: 1, quantity: MAX });
    expect(order.totalCents).toBe(MAX);
  });
});

const invalidDates: unknown[] = [
  '2026-02-29',
  '1900-02-29',
  '2026-02-30',
  '2026-04-31',
  '2026-00-10',
  '2026-13-01',
  '2026-01-00',
  '2026-01-32',
  '0000-01-01',
  '2026-2-01',
  '2026-10-05T00:00:00Z',
  '2026-10-05T12:00:00-06:00',
  ' 2026-10-05',
  '',
  null,
  20261005,
];
const validDates = [
  '0001-01-01',
  '9999-12-31',
  '2000-02-29',
  '2024-02-29',
  '2026-02-28',
  '2026-04-30',
];

describe.each(['paymentDate', 'warehouseEntryDate', 'invoiceDate'] as const)(
  'R2: calendar-only %s in domain transitions (#37)',
  (field) => {
    function prepare(value: unknown) {
      const payment = field === 'paymentDate';
      const order = new PurchaseOrder({
        ...draft(),
        status: payment ? 'COMPRA_APROBADA' : 'EVIDENCIA_PAGO_SUBIDA',
      });
      const data = {
        paymentDate: '2026-10-05',
        paymentMethod: 'Transferencia',
        invoiceFile: 'test/invoice',
        warehouseEntryDate: '2026-10-05',
      };
      Reflect.set(data, field, value);
      return {
        order,
        action: payment
          ? ('register_payment' as const)
          : ('upload_invoice' as const),
        data,
      };
    }
    it.each(invalidDates)('rejects %j without mutating the order', (value) => {
      const { order, action, data } = prepare(value);
      const snapshot = JSON.stringify(order);
      expect(() => order.transition(action, actor.role, data)).toThrow(
        InvalidOdcInputError,
      );
      expect(JSON.stringify(order)).toBe(snapshot);
    });
    it.each(validDates)('accepts %s without timezone conversion', (value) => {
      const { order, action, data } = prepare(value);
      order.transition(action, actor.role, data);
      expect(order[field]).toBe(value);
    });
  },
);
