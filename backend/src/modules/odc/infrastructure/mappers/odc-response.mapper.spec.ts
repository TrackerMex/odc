import {
  PurchaseOrder,
  PurchaseOrderProps,
} from '../../domain/entities/purchase-order.entity';
import { toOdcPageResponse, toOdcResponse } from './odc-response.mapper';

const EVIDENCE_PUBLIC_ID = 'odc/ODC-2026-00001/evidence/abc123';

function buildOrder(
  overrides: Partial<PurchaseOrderProps> = {},
): PurchaseOrder {
  return new PurchaseOrder({
    id: 'b4e2d8b3-0000-4000-8000-000000000010',
    odcNumber: 'ODC-2026-00001',
    status: 'EVIDENCIA_PAGO_SUBIDA',
    description: 'Cemento gris 50kg',
    quantity: 10,
    unit: 'bulto',
    unitPriceCents: 18550,
    totalCents: 185500,
    supplier: 'CEMEX',
    comments: null,
    createdById: 'a3d1c9a2-0000-4000-8000-000000000001',
    rejectionReason: null,
    paymentDate: '2026-07-20',
    paymentMethod: 'Transferencia',
    paymentReference: null,
    paymentNotes: null,
    paymentEvidenceFile: EVIDENCE_PUBLIC_ID,
    evidenceReference: 'REF-EV-001',
    invoiceFile: null,
    invoiceNumber: null,
    invoiceDate: null,
    warehouseEntryDate: null,
    observations: null,
    createdAt: new Date('2026-07-19T00:00:00Z'),
    updatedAt: new Date('2026-07-20T00:00:00Z'),
    ...overrides,
  });
}

describe('R4: toOdcResponse hides paymentEvidenceFile and exposes hasPaymentEvidence', () => {
  it('omits paymentEvidenceFile and sets hasPaymentEvidence true when a file is assigned', () => {
    const response = toOdcResponse(buildOrder());

    expect(response).not.toHaveProperty('paymentEvidenceFile');
    expect(response.hasPaymentEvidence).toBe(true);
    expect(response.evidenceReference).toBe('REF-EV-001');
  });

  it('sets hasPaymentEvidence false when paymentEvidenceFile is null', () => {
    const response = toOdcResponse(buildOrder({ paymentEvidenceFile: null }));

    expect(response).not.toHaveProperty('paymentEvidenceFile');
    expect(response.hasPaymentEvidence).toBe(false);
  });

  it('never leaks the public_id or a cloudinary URL in the serialized body', () => {
    const response = toOdcResponse(buildOrder());
    const serialized = JSON.stringify(response);

    expect(serialized).not.toContain(EVIDENCE_PUBLIC_ID);
    expect(serialized).not.toContain('cloudinary.com');
  });

  it('preserves the rest of the ODC fields untouched', () => {
    const order = buildOrder();
    const response = toOdcResponse(order);

    expect(response.id).toBe(order.id);
    expect(response.odcNumber).toBe(order.odcNumber);
    expect(response.status).toBe(order.status);
    expect(response.totalCents).toBe(order.totalCents);
    expect(response.invoiceFile).toBeNull();
  });
});

describe('R4: toOdcPageResponse maps every item through toOdcResponse', () => {
  it('maps all items and preserves pagination metadata', () => {
    const page = {
      items: [buildOrder(), buildOrder({ paymentEvidenceFile: null })],
      total: 2,
      page: 1,
      pageSize: 20,
    };

    const response = toOdcPageResponse(page);

    expect(response.total).toBe(2);
    expect(response.page).toBe(1);
    expect(response.pageSize).toBe(20);
    expect(response.items).toHaveLength(2);
    expect(response.items[0].hasPaymentEvidence).toBe(true);
    expect(response.items[1].hasPaymentEvidence).toBe(false);
    response.items.forEach((item) =>
      expect(item).not.toHaveProperty('paymentEvidenceFile'),
    );
  });
});
