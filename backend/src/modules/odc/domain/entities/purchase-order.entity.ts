import type { UserRole } from '../../../users/domain/entities/user.entity';
import { InvalidRoleTransitionError } from '../errors/invalid-role-transition.error';
import { InvalidStatusTransitionError } from '../errors/invalid-status-transition.error';
import { MissingTransitionDataError } from '../errors/missing-transition-data.error';

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

export const ODC_ACTIONS = [
  'create',
  'submit',
  'approve_budget',
  'reject',
  'approve_purchase',
  'register_payment',
  'upload_payment_evidence',
  'upload_invoice',
] as const;

export type OdcAction = (typeof ODC_ACTIONS)[number];

export interface TransitionData {
  rejectionReason?: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentNotes?: string;
  paymentEvidenceFile?: string;
  evidenceReference?: string;
  invoiceFile?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  warehouseEntryDate?: string;
  observations?: string;
}

export interface TransitionRecord {
  fromStatus: OdcStatus | null;
  toStatus: OdcStatus;
  note: string | null;
}

interface TransitionRule {
  action: OdcAction;
  from: OdcStatus | null;
  to: OdcStatus;
  role: UserRole;
  requiredData: (keyof TransitionData)[];
}

// T1
const CREATE_RULE: TransitionRule = {
  action: 'create',
  from: null,
  to: 'BORRADOR',
  role: 'DIRECTOR_OPS',
  requiredData: [],
};

// Full T1-T10 table from the master plan. Features 4-8 only invoke it;
// no transition rule is ever duplicated outside this entity (R3).
const TRANSITIONS: TransitionRule[] = [
  CREATE_RULE,
  // T2
  {
    action: 'submit',
    from: 'BORRADOR',
    to: 'PENDIENTE_ADMIN',
    role: 'DIRECTOR_OPS',
    requiredData: [],
  },
  // T3
  {
    action: 'approve_budget',
    from: 'PENDIENTE_ADMIN',
    to: 'PRESUPUESTO_APROBADO',
    role: 'ADMINISTRACION',
    requiredData: [],
  },
  // T4
  {
    action: 'reject',
    from: 'PENDIENTE_ADMIN',
    to: 'RECHAZADA',
    role: 'ADMINISTRACION',
    requiredData: ['rejectionReason'],
  },
  // T5
  {
    action: 'approve_purchase',
    from: 'PRESUPUESTO_APROBADO',
    to: 'COMPRA_APROBADA',
    role: 'DIRECTOR_GENERAL',
    requiredData: [],
  },
  // T6
  {
    action: 'reject',
    from: 'PRESUPUESTO_APROBADO',
    to: 'RECHAZADA',
    role: 'DIRECTOR_GENERAL',
    requiredData: ['rejectionReason'],
  },
  // T7
  {
    action: 'register_payment',
    from: 'COMPRA_APROBADA',
    to: 'PAGO_REGISTRADO',
    role: 'DIRECTOR_OPS',
    requiredData: ['paymentDate', 'paymentMethod'],
  },
  // T8
  {
    action: 'upload_payment_evidence',
    from: 'PAGO_REGISTRADO',
    to: 'EVIDENCIA_PAGO_SUBIDA',
    role: 'ADMINISTRACION',
    requiredData: ['paymentEvidenceFile'],
  },
  // T9
  {
    action: 'upload_invoice',
    from: 'EVIDENCIA_PAGO_SUBIDA',
    to: 'COMPLETADA',
    role: 'DIRECTOR_OPS',
    requiredData: ['invoiceFile', 'warehouseEntryDate'],
  },
  // T10
  {
    action: 'submit',
    from: 'RECHAZADA',
    to: 'PENDIENTE_ADMIN',
    role: 'DIRECTOR_OPS',
    requiredData: [],
  },
];

function assertRequiredData(rule: TransitionRule, data: TransitionData): void {
  const missing = rule.requiredData.filter((field) => {
    const value = data[field];
    return value === undefined || value.trim() === '';
  });
  if (missing.length > 0) {
    throw new MissingTransitionDataError(rule.action, missing);
  }
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
    if (actor.role !== CREATE_RULE.role) {
      throw new InvalidRoleTransitionError(CREATE_RULE.action, actor.role);
    }
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

  transition(
    action: OdcAction,
    role: UserRole,
    data: TransitionData = {},
  ): TransitionRecord {
    const candidates = TRANSITIONS.filter(
      (rule) => rule.action === action && rule.from !== null,
    );
    const rule = candidates.find((candidate) => candidate.from === this.status);
    if (rule === undefined) {
      throw new InvalidStatusTransitionError(action, this.status);
    }
    if (rule.role !== role) {
      throw new InvalidRoleTransitionError(action, role);
    }
    assertRequiredData(rule, data);

    this.applyTransitionData(data);
    const fromStatus = this.status;
    this.status = rule.to;
    return {
      fromStatus,
      toStatus: rule.to,
      note: data.rejectionReason ?? null,
    };
  }

  private applyTransitionData(data: TransitionData): void {
    if (data.rejectionReason !== undefined)
      this.rejectionReason = data.rejectionReason;
    if (data.paymentDate !== undefined) this.paymentDate = data.paymentDate;
    if (data.paymentMethod !== undefined)
      this.paymentMethod = data.paymentMethod;
    if (data.paymentReference !== undefined)
      this.paymentReference = data.paymentReference;
    if (data.paymentNotes !== undefined) this.paymentNotes = data.paymentNotes;
    if (data.paymentEvidenceFile !== undefined)
      this.paymentEvidenceFile = data.paymentEvidenceFile;
    if (data.evidenceReference !== undefined)
      this.evidenceReference = data.evidenceReference;
    if (data.invoiceFile !== undefined) this.invoiceFile = data.invoiceFile;
    if (data.invoiceNumber !== undefined)
      this.invoiceNumber = data.invoiceNumber;
    if (data.invoiceDate !== undefined) this.invoiceDate = data.invoiceDate;
    if (data.warehouseEntryDate !== undefined)
      this.warehouseEntryDate = data.warehouseEntryDate;
    if (data.observations !== undefined) this.observations = data.observations;
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
