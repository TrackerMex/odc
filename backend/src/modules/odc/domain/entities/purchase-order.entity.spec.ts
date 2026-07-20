import { readFileSync } from 'fs';
import { join } from 'path';
import type { UserRole } from '../../../users/domain/entities/user.entity';
import { InvalidRoleTransitionError } from '../errors/invalid-role-transition.error';
import { InvalidStatusTransitionError } from '../errors/invalid-status-transition.error';
import { MissingTransitionDataError } from '../errors/missing-transition-data.error';
import {
  ODC_STATUSES,
  OdcAction,
  OdcStatus,
  PurchaseOrder,
  PurchaseOrderProps,
  TransitionData,
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

function orderIn(status: OdcStatus): PurchaseOrder {
  return new PurchaseOrder(buildProps({ status }));
}

describe('R3: transition covers the whole T1-T10 state machine', () => {
  it('T1: createDraft starts in BORRADOR and records null -> BORRADOR', () => {
    const { order, record } = PurchaseOrder.createDraft(
      {
        description: 'Cemento gris 50kg',
        quantity: 10,
        unit: 'bulto',
        unitPriceCents: 18550,
        supplier: 'CEMEX',
        comments: 'Entrega en obra',
      },
      { userId: OPS_ID, role: 'DIRECTOR_OPS' },
    );

    expect(order.status).toBe('BORRADOR');
    expect(order.createdById).toBe(OPS_ID);
    expect(record).toEqual({
      fromStatus: null,
      toStatus: 'BORRADOR',
      note: null,
    });
  });

  it('T2: submit moves BORRADOR -> PENDIENTE_ADMIN for DIRECTOR_OPS', () => {
    const order = orderIn('BORRADOR');

    const record = order.transition('submit', 'DIRECTOR_OPS');

    expect(order.status).toBe('PENDIENTE_ADMIN');
    expect(record).toEqual({
      fromStatus: 'BORRADOR',
      toStatus: 'PENDIENTE_ADMIN',
      note: null,
    });
  });

  it('T3: approve_budget moves PENDIENTE_ADMIN -> PRESUPUESTO_APROBADO for ADMINISTRACION', () => {
    const order = orderIn('PENDIENTE_ADMIN');

    const record = order.transition('approve_budget', 'ADMINISTRACION');

    expect(order.status).toBe('PRESUPUESTO_APROBADO');
    expect(record).toEqual({
      fromStatus: 'PENDIENTE_ADMIN',
      toStatus: 'PRESUPUESTO_APROBADO',
      note: null,
    });
  });

  it('T4: reject moves PENDIENTE_ADMIN -> RECHAZADA and notes the reason', () => {
    const order = orderIn('PENDIENTE_ADMIN');

    const record = order.transition('reject', 'ADMINISTRACION', {
      rejectionReason: 'Presupuesto excedido',
    });

    expect(order.status).toBe('RECHAZADA');
    expect(order.rejectionReason).toBe('Presupuesto excedido');
    expect(record).toEqual({
      fromStatus: 'PENDIENTE_ADMIN',
      toStatus: 'RECHAZADA',
      note: 'Presupuesto excedido',
    });
  });

  it('T5: approve_purchase moves PRESUPUESTO_APROBADO -> COMPRA_APROBADA for DIRECTOR_GENERAL', () => {
    const order = orderIn('PRESUPUESTO_APROBADO');

    const record = order.transition('approve_purchase', 'DIRECTOR_GENERAL');

    expect(order.status).toBe('COMPRA_APROBADA');
    expect(record).toEqual({
      fromStatus: 'PRESUPUESTO_APROBADO',
      toStatus: 'COMPRA_APROBADA',
      note: null,
    });
  });

  it('T6: reject moves PRESUPUESTO_APROBADO -> RECHAZADA for DIRECTOR_GENERAL and notes the reason', () => {
    const order = orderIn('PRESUPUESTO_APROBADO');

    const record = order.transition('reject', 'DIRECTOR_GENERAL', {
      rejectionReason: 'Compra no prioritaria',
    });

    expect(order.status).toBe('RECHAZADA');
    expect(order.rejectionReason).toBe('Compra no prioritaria');
    expect(record.note).toBe('Compra no prioritaria');
  });

  it('T7: register_payment moves COMPRA_APROBADA -> PAGO_REGISTRADO and applies the payment fields', () => {
    const order = orderIn('COMPRA_APROBADA');

    const record = order.transition('register_payment', 'DIRECTOR_OPS', {
      paymentDate: '2026-07-20',
      paymentMethod: 'transferencia',
      paymentReference: 'SPEI-123',
      paymentNotes: 'Pago anticipado',
    });

    expect(order.status).toBe('PAGO_REGISTRADO');
    expect(order.paymentDate).toBe('2026-07-20');
    expect(order.paymentMethod).toBe('transferencia');
    expect(order.paymentReference).toBe('SPEI-123');
    expect(order.paymentNotes).toBe('Pago anticipado');
    expect(record).toEqual({
      fromStatus: 'COMPRA_APROBADA',
      toStatus: 'PAGO_REGISTRADO',
      note: null,
    });
  });

  it('T8: upload_payment_evidence moves PAGO_REGISTRADO -> EVIDENCIA_PAGO_SUBIDA and applies the evidence fields', () => {
    const order = orderIn('PAGO_REGISTRADO');

    const record = order.transition(
      'upload_payment_evidence',
      'ADMINISTRACION',
      {
        paymentEvidenceFile: 'uploads/evidencia.pdf',
        evidenceReference: 'FOLIO-9',
      },
    );

    expect(order.status).toBe('EVIDENCIA_PAGO_SUBIDA');
    expect(order.paymentEvidenceFile).toBe('uploads/evidencia.pdf');
    expect(order.evidenceReference).toBe('FOLIO-9');
    expect(record.toStatus).toBe('EVIDENCIA_PAGO_SUBIDA');
  });

  it('T9: upload_invoice moves EVIDENCIA_PAGO_SUBIDA -> COMPLETADA and applies the invoice fields', () => {
    const order = orderIn('EVIDENCIA_PAGO_SUBIDA');

    const record = order.transition('upload_invoice', 'DIRECTOR_OPS', {
      invoiceFile: 'uploads/factura.pdf',
      warehouseEntryDate: '2026-07-25',
      invoiceNumber: 'F-778',
      invoiceDate: '2026-07-24',
      observations: 'Material completo',
    });

    expect(order.status).toBe('COMPLETADA');
    expect(order.invoiceFile).toBe('uploads/factura.pdf');
    expect(order.warehouseEntryDate).toBe('2026-07-25');
    expect(order.invoiceNumber).toBe('F-778');
    expect(order.invoiceDate).toBe('2026-07-24');
    expect(order.observations).toBe('Material completo');
    expect(record.toStatus).toBe('COMPLETADA');
  });

  it('T10: submit moves RECHAZADA -> PENDIENTE_ADMIN for DIRECTOR_OPS (resubmission)', () => {
    const order = orderIn('RECHAZADA');

    const record = order.transition('submit', 'DIRECTOR_OPS');

    expect(order.status).toBe('PENDIENTE_ADMIN');
    expect(record).toEqual({
      fromStatus: 'RECHAZADA',
      toStatus: 'PENDIENTE_ADMIN',
      note: null,
    });
  });
});

describe('R4: invalid transitions raise typed domain errors without mutating', () => {
  function snapshot(order: PurchaseOrder): Record<string, unknown> {
    return JSON.parse(JSON.stringify(order)) as Record<string, unknown>;
  }

  const roleCases: [OdcStatus, OdcAction, UserRole, TransitionData?][] = [
    ['BORRADOR', 'submit', 'ADMINISTRACION', undefined],
    ['PENDIENTE_ADMIN', 'approve_budget', 'DIRECTOR_OPS', undefined],
    ['PENDIENTE_ADMIN', 'reject', 'DIRECTOR_GENERAL', { rejectionReason: 'X' }],
    ['PRESUPUESTO_APROBADO', 'approve_purchase', 'ADMINISTRACION', undefined],
    [
      'PRESUPUESTO_APROBADO',
      'reject',
      'ADMINISTRACION',
      { rejectionReason: 'X' },
    ],
    [
      'COMPRA_APROBADA',
      'register_payment',
      'DIRECTOR_GENERAL',
      { paymentDate: '2026-07-20', paymentMethod: 'transferencia' },
    ],
    [
      'PAGO_REGISTRADO',
      'upload_payment_evidence',
      'DIRECTOR_OPS',
      { paymentEvidenceFile: 'uploads/e.pdf' },
    ],
    [
      'EVIDENCIA_PAGO_SUBIDA',
      'upload_invoice',
      'ADMINISTRACION',
      { invoiceFile: 'uploads/f.pdf', warehouseEntryDate: '2026-07-25' },
    ],
    ['RECHAZADA', 'submit', 'DIRECTOR_GENERAL', undefined],
  ];

  it.each(roleCases)(
    'from %s the action %s with unauthorized role %s throws InvalidRoleTransitionError and does not mutate',
    (status, action, wrongRole, data) => {
      const order = orderIn(status);
      const before = snapshot(order);

      expect(() => order.transition(action, wrongRole, data)).toThrow(
        InvalidRoleTransitionError,
      );
      expect(snapshot(order)).toEqual(before);
    },
  );

  const statusCases: [OdcStatus, OdcAction, UserRole, TransitionData?][] = [
    ['BORRADOR', 'approve_budget', 'ADMINISTRACION', undefined],
    ['BORRADOR', 'reject', 'ADMINISTRACION', { rejectionReason: 'X' }],
    ['PENDIENTE_ADMIN', 'submit', 'DIRECTOR_OPS', undefined],
    ['PRESUPUESTO_APROBADO', 'approve_budget', 'ADMINISTRACION', undefined],
    [
      'COMPRA_APROBADA',
      'upload_invoice',
      'DIRECTOR_OPS',
      { invoiceFile: 'uploads/f.pdf', warehouseEntryDate: '2026-07-25' },
    ],
    [
      'PAGO_REGISTRADO',
      'register_payment',
      'DIRECTOR_OPS',
      { paymentDate: '2026-07-20', paymentMethod: 'transferencia' },
    ],
    ['COMPLETADA', 'submit', 'DIRECTOR_OPS', undefined],
    ['COMPLETADA', 'approve_purchase', 'DIRECTOR_GENERAL', undefined],
    ['RECHAZADA', 'reject', 'ADMINISTRACION', { rejectionReason: 'X' }],
  ];

  it.each(statusCases)(
    'from %s the out-of-order action %s throws InvalidStatusTransitionError and does not mutate',
    (status, action, role, data) => {
      const order = orderIn(status);
      const before = snapshot(order);

      expect(() => order.transition(action, role, data)).toThrow(
        InvalidStatusTransitionError,
      );
      expect(snapshot(order)).toEqual(before);
    },
  );

  const missingDataCases: [OdcStatus, OdcAction, UserRole, TransitionData][] = [
    ['PENDIENTE_ADMIN', 'reject', 'ADMINISTRACION', {}],
    ['PENDIENTE_ADMIN', 'reject', 'ADMINISTRACION', { rejectionReason: '  ' }],
    [
      'PRESUPUESTO_APROBADO',
      'reject',
      'DIRECTOR_GENERAL',
      { rejectionReason: '' },
    ],
    [
      'COMPRA_APROBADA',
      'register_payment',
      'DIRECTOR_OPS',
      { paymentMethod: 'transferencia' },
    ],
    [
      'COMPRA_APROBADA',
      'register_payment',
      'DIRECTOR_OPS',
      { paymentDate: '2026-07-20' },
    ],
    ['PAGO_REGISTRADO', 'upload_payment_evidence', 'ADMINISTRACION', {}],
    [
      'EVIDENCIA_PAGO_SUBIDA',
      'upload_invoice',
      'DIRECTOR_OPS',
      { invoiceFile: 'uploads/f.pdf' },
    ],
    [
      'EVIDENCIA_PAGO_SUBIDA',
      'upload_invoice',
      'DIRECTOR_OPS',
      { warehouseEntryDate: '2026-07-25' },
    ],
  ];

  it.each(missingDataCases)(
    'from %s the action %s without its required data throws MissingTransitionDataError and does not mutate',
    (status, action, role, data) => {
      const order = orderIn(status);
      const before = snapshot(order);

      expect(() => order.transition(action, role, data)).toThrow(
        MissingTransitionDataError,
      );
      expect(snapshot(order)).toEqual(before);
    },
  );
});
