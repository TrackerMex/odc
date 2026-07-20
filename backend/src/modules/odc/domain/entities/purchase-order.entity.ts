import type { UserRole } from '../../../users/domain/entities/user.entity';

export const ODC_STATUSES = [
  'BORRADOR',
  'PENDIENTE_ADMIN',
  'PRESUPUESTO_APROBADO',
  'COMPRA_APROBADA',
  'PAGO_REGISTRADO',
  'EVIDENCIA_PAGO_SUBIDA',
  'COMPLETADA',
  'RECHAZADA',
] as const;

export type OdcStatus = (typeof ODC_STATUSES)[number];

export interface OdcActor {
  userId: string;
  role: UserRole;
}

export interface CreateDraftInput {
  description: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  supplier: string;
  comments?: string;
}

export type EditableOdcFields = Partial<CreateDraftInput>;

export interface TransitionRecord {
  fromStatus: OdcStatus | null;
  toStatus: OdcStatus;
  note: string | null;
}

export interface PurchaseOrderProps {
  id: string | null;
  odcNumber: string | null;
  status: OdcStatus;
  description: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  totalCents: number;
  supplier: string;
  comments: string | null;
  createdById: string;
  rejectionReason: string | null;
  paymentDate: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentNotes: string | null;
  paymentEvidenceFile: string | null;
  evidenceReference: string | null;
  invoiceFile: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  warehouseEntryDate: string | null;
  observations: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export class PurchaseOrder {
  public readonly id: string | null;
  public odcNumber: string | null;
  public status: OdcStatus;
  public description: string;
  public quantity: number;
  public unit: string;
  public unitPriceCents: number;
  public totalCents: number;
  public supplier: string;
  public comments: string | null;
  public readonly createdById: string;
  public rejectionReason: string | null;
  public paymentDate: string | null;
  public paymentMethod: string | null;
  public paymentReference: string | null;
  public paymentNotes: string | null;
  public paymentEvidenceFile: string | null;
  public evidenceReference: string | null;
  public invoiceFile: string | null;
  public invoiceNumber: string | null;
  public invoiceDate: string | null;
  public warehouseEntryDate: string | null;
  public observations: string | null;
  public createdAt: Date | null;
  public updatedAt: Date | null;

  constructor(props: PurchaseOrderProps) {
    this.id = props.id;
    this.odcNumber = props.odcNumber;
    this.status = props.status;
    this.description = props.description;
    this.quantity = props.quantity;
    this.unit = props.unit;
    this.unitPriceCents = props.unitPriceCents;
    this.totalCents = props.totalCents;
    this.supplier = props.supplier;
    this.comments = props.comments;
    this.createdById = props.createdById;
    this.rejectionReason = props.rejectionReason;
    this.paymentDate = props.paymentDate;
    this.paymentMethod = props.paymentMethod;
    this.paymentReference = props.paymentReference;
    this.paymentNotes = props.paymentNotes;
    this.paymentEvidenceFile = props.paymentEvidenceFile;
    this.evidenceReference = props.evidenceReference;
    this.invoiceFile = props.invoiceFile;
    this.invoiceNumber = props.invoiceNumber;
    this.invoiceDate = props.invoiceDate;
    this.warehouseEntryDate = props.warehouseEntryDate;
    this.observations = props.observations;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static computeTotalCents(quantity: number, unitPriceCents: number): number {
    return quantity * unitPriceCents;
  }

  static createDraft(
    input: CreateDraftInput,
    actor: OdcActor,
  ): { order: PurchaseOrder; record: TransitionRecord } {
    const order = new PurchaseOrder({
      id: null,
      odcNumber: null,
      status: 'BORRADOR',
      description: input.description,
      quantity: input.quantity,
      unit: input.unit,
      unitPriceCents: input.unitPriceCents,
      totalCents: PurchaseOrder.computeTotalCents(
        input.quantity,
        input.unitPriceCents,
      ),
      supplier: input.supplier,
      comments: input.comments ?? null,
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
    });
    return {
      order,
      record: { fromStatus: null, toStatus: 'BORRADOR', note: null },
    };
  }

  edit(fields: EditableOdcFields): void {
    if (fields.description !== undefined) this.description = fields.description;
    if (fields.quantity !== undefined) this.quantity = fields.quantity;
    if (fields.unit !== undefined) this.unit = fields.unit;
    if (fields.unitPriceCents !== undefined)
      this.unitPriceCents = fields.unitPriceCents;
    if (fields.supplier !== undefined) this.supplier = fields.supplier;
    if (fields.comments !== undefined) this.comments = fields.comments;
    this.totalCents = PurchaseOrder.computeTotalCents(
      this.quantity,
      this.unitPriceCents,
    );
  }
}
