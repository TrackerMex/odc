import { PurchaseOrder } from '../../domain/entities/purchase-order.entity';
import { PurchaseOrderOrmEntity } from '../entities/purchase-order.orm-entity';
import { toOdcResponse } from './odc-response.mapper';
import { toDomain, toOrmValues } from './purchase-order.mapper';

describe('R4: VAT amounts persist and appear in authenticated ODC responses', () => {
  const order = PurchaseOrder.createDraft(
    { description: 'Material', quantity: 1, unit: 'pieza', unitPriceCents: 10000, supplier: 'Proveedor' },
    { userId: 'ops', role: 'DIRECTOR_OPS' },
  ).order;

  it('serializes the server-calculated amounts into the database and response', () => {
    const amounts = { subtotalCents: 10000, vatRateBps: 1600, vatCents: 1600, totalCents: 11600 };
    expect(toOrmValues(order)).toMatchObject(amounts);
    expect(toOdcResponse(order)).toMatchObject(amounts);
  });

  it('hydrates persisted VAT without interpreting the gross total as the subtotal', () => {
    const row = {
      ...toOrmValues(order), id: 'odc', odcNumber: 'ODC-2026-00001',
      subtotalCents: 10000, vatRateBps: 1600, vatCents: 1600, totalCents: 11600,
    } as PurchaseOrderOrmEntity;
    expect(toDomain(row)).toMatchObject({ subtotalCents: 10000, vatRateBps: 1600, vatCents: 1600, totalCents: 11600 });
  });
});
