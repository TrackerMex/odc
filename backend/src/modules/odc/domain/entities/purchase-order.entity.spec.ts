import { readFileSync } from 'fs';
import { join } from 'path';
import {
  ODC_STATUSES,
  OdcStatus,
  PurchaseOrder,
  PurchaseOrderProps,
} from './purchase-order.entity';

const OPS_ID = 'a3d1c9a2-0000-4000-8000-000000000001';

export function buildProps(
  overrides: Partial<PurchaseOrderProps> = {},
): PurchaseOrderProps {
  return {
    id: 'b4e2d8b3-0000-4000-8000-000000000010',
    odcNumber: 'ODC-2026-00001',
    status: 'BORRADOR',
    description: 'Cemento gris 50kg',
    quantity: 10,
    unit: 'bulto',
    unitPriceCents: 18550,
    totalCents: 185500,
    supplier: 'CEMEX',
    comments: 'Entrega en obra',
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
  };
}

describe('R1: pure PurchaseOrder domain entity with restricted status', () => {
  it('holds the data model properties passed to the constructor', () => {
    const props = buildProps();
    const order = new PurchaseOrder(props);

    expect(order.id).toBe(props.id);
    expect(order.odcNumber).toBe('ODC-2026-00001');
    expect(order.status).toBe('BORRADOR');
    expect(order.description).toBe('Cemento gris 50kg');
    expect(order.quantity).toBe(10);
    expect(order.unit).toBe('bulto');
    expect(order.unitPriceCents).toBe(18550);
    expect(order.totalCents).toBe(185500);
    expect(order.supplier).toBe('CEMEX');
    expect(order.comments).toBe('Entrega en obra');
    expect(order.createdById).toBe(OPS_ID);
    expect(order.rejectionReason).toBeNull();
    expect(order.paymentDate).toBeNull();
    expect(order.paymentMethod).toBeNull();
    expect(order.paymentReference).toBeNull();
    expect(order.paymentNotes).toBeNull();
    expect(order.paymentEvidenceFile).toBeNull();
    expect(order.evidenceReference).toBeNull();
    expect(order.invoiceFile).toBeNull();
    expect(order.invoiceNumber).toBeNull();
    expect(order.invoiceDate).toBeNull();
    expect(order.warehouseEntryDate).toBeNull();
    expect(order.observations).toBeNull();
    expect(order.createdAt).toEqual(new Date('2026-07-19T00:00:00Z'));
    expect(order.updatedAt).toEqual(new Date('2026-07-19T00:00:00Z'));
  });

  it('restricts the status to the 8 Spanish state machine values', () => {
    expect(ODC_STATUSES).toEqual([
      'BORRADOR',
      'PENDIENTE_ADMIN',
      'PRESUPUESTO_APROBADO',
      'COMPRA_APROBADA',
      'PAGO_REGISTRADO',
      'EVIDENCIA_PAGO_SUBIDA',
      'COMPLETADA',
      'RECHAZADA',
    ]);
    // Compile-time check: OdcStatus only admits the 8 literal values.
    const statuses: OdcStatus[] = [
      'BORRADOR',
      'PENDIENTE_ADMIN',
      'PRESUPUESTO_APROBADO',
      'COMPRA_APROBADA',
      'PAGO_REGISTRADO',
      'EVIDENCIA_PAGO_SUBIDA',
      'COMPLETADA',
      'RECHAZADA',
    ];
    expect(statuses).toHaveLength(8);
  });

  it('does not import any framework, ORM or infrastructure library', () => {
    const source = readFileSync(
      join(__dirname, 'purchase-order.entity.ts'),
      'utf8',
    );
    const moduleSpecifiers = [
      ...source.matchAll(/from\s+'([^']+)'/g),
      ...source.matchAll(/require\(\s*'([^']+)'\s*\)/g),
    ].map((match) => match[1]);

    for (const specifier of moduleSpecifiers) {
      expect(specifier).toMatch(/^\.{1,2}\//);
    }
  });
});

describe('R2: totalCents computed in the domain, never accepted from outside', () => {
  it.each([
    [1, 100, 100],
    [3, 4550, 13650],
    [7, 999, 6993],
  ])(
    'createDraft computes totalCents = %i * %i = %i',
    (quantity, unitPriceCents, expectedTotal) => {
      const { order } = PurchaseOrder.createDraft(
        {
          description: 'Cemento gris 50kg',
          quantity,
          unit: 'bulto',
          unitPriceCents,
          supplier: 'CEMEX',
        },
        { userId: OPS_ID, role: 'DIRECTOR_OPS' },
      );

      expect(order.totalCents).toBe(expectedTotal);
    },
  );

  it('recomputes totalCents when the order is edited', () => {
    const order = new PurchaseOrder(buildProps());

    order.edit({ quantity: 4, unitPriceCents: 2000 });

    expect(order.totalCents).toBe(8000);
  });

  it('recomputes totalCents from the untouched fields when only one changes', () => {
    const order = new PurchaseOrder(
      buildProps({ quantity: 10, unitPriceCents: 18550, totalCents: 185500 }),
    );

    order.edit({ quantity: 2 });

    expect(order.totalCents).toBe(37100);
  });
});
