import type { UserRole } from '../../../users/domain/entities/user.entity';
import type { OdcStatusHistoryEntry } from './odc-status-history-entry.entity';
import { InvalidRoleTransitionError } from '../errors/invalid-role-transition.error';
import { InvalidStatusTransitionError } from '../errors/invalid-status-transition.error';
import { MissingTransitionDataError } from '../errors/missing-transition-data.error';
import { InvalidOdcInputError } from '../errors/invalid-odc-input.error';
import { isCalendarDate, MAX_ODC_INTEGER } from '../input-boundaries';

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

export interface OdcLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
}

export interface CreateDraftInput {
  items?: OdcLineItem[];
  description?: string;
  quantity?: number;
  unit?: string;
  unitPriceCents?: number;
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

// ODC-YYYY-NNNNN: 5-digit zero-padded sequence that restarts every year (R6).
export function formatOdcNumber(year: number, sequence: number): string {
  return `ODC-${year}-${String(sequence).padStart(5, '0')}`;
}

export function nextOdcNumber(
  year: number,
  lastOdcNumberInYear: string | null,
): string {
  if (lastOdcNumberInYear === null) {
    return formatOdcNumber(year, 1);
  }
  const lastSequence = Number(lastOdcNumberInYear.slice(-5));
  return formatOdcNumber(year, lastSequence + 1);
}

function assertRequiredData(rule: TransitionRule, data: TransitionData): void {
  const missing = rule.requiredData.filter((field) => {
    const value = data[field];
    return typeof value !== 'string' || value.trim() === '';
  });
  if (missing.length > 0) {
    throw new MissingTransitionDataError(rule.action, missing);
  }
}

export interface PurchaseOrderProps {
  id: string | null;
  version?: number;
  odcNumber: string | null;
  status: OdcStatus;
  items?: OdcLineItem[];
  description: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  subtotalCents?: number;
  vatRateBps?: number;
  vatCents?: number;
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
  history?: OdcStatusHistoryEntry[];
}

export class PurchaseOrder {
  public readonly id: string | null;
  public readonly version: number;
  public odcNumber: string | null;
  public status: OdcStatus;
  public items: OdcLineItem[];
  public description: string;
  public quantity: number;
  public unit: string;
  public unitPriceCents: number;
  public subtotalCents: number;
  public vatRateBps: number;
  public vatCents: number;
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
  public history: OdcStatusHistoryEntry[];

  constructor(props: PurchaseOrderProps) {
    this.id = props.id;
    this.version = props.version ?? 0;
    this.odcNumber = props.odcNumber;
    this.status = props.status;
    let items = PurchaseOrder.copyAndValidateItems(
      props.items ?? [
        {
          description: props.description,
          quantity: props.quantity,
          unit: props.unit,
          unitPriceCents: props.unitPriceCents,
        },
      ],
    );
    const vatRateBps = props.vatRateBps ?? 0;
    let amounts = PurchaseOrder.computeFiscalAmounts(
      PurchaseOrder.computeItemsTotalCents(items),
      vatRateBps,
    );
    if (
      props.vatRateBps !== undefined &&
      props.totalCents !== amounts.totalCents
    ) {
      throw new InvalidOdcInputError(
        'El total de la ODC no coincide con su desglose fiscal.',
      );
    }
    if (props.items !== undefined && props.totalCents !== amounts.totalCents) {
      const scalarProjection = [
        {
          description: props.description,
          quantity: props.quantity,
          unit: props.unit,
          unitPriceCents: props.unitPriceCents,
        },
        ...items.slice(1),
      ];
      const scalarAmounts = PurchaseOrder.computeFiscalAmounts(
        PurchaseOrder.computeItemsTotalCents(scalarProjection),
        vatRateBps,
      );
      if (props.totalCents !== scalarAmounts.totalCents) {
        throw new InvalidOdcInputError(
          'El total de la ODC debe coincidir con la suma de sus partidas.',
        );
      }
      items = PurchaseOrder.copyAndValidateItems(scalarProjection);
      amounts = scalarAmounts;
    }
    if (
      (props.subtotalCents !== undefined &&
        props.subtotalCents !== amounts.subtotalCents) ||
      (props.vatCents !== undefined && props.vatCents !== amounts.vatCents)
    ) {
      throw new InvalidOdcInputError(
        'El desglose fiscal de la ODC no coincide con sus partidas.',
      );
    }
    this.items = items;
    this.description = this.items[0].description;
    this.quantity = this.items[0].quantity;
    this.unit = this.items[0].unit;
    this.unitPriceCents = this.items[0].unitPriceCents;
    this.subtotalCents = amounts.subtotalCents;
    this.vatRateBps = vatRateBps;
    this.vatCents = amounts.vatCents;
    this.totalCents = amounts.totalCents;
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
    this.history = props.history ?? [];
  }

  static computeTotalCents(quantity: number, unitPriceCents: number): number {
    const total = quantity * unitPriceCents;
    if (
      [quantity, unitPriceCents, total].some(
        (value) =>
          !Number.isSafeInteger(value) || value < 1 || value > MAX_ODC_INTEGER,
      )
    ) {
      throw new InvalidOdcInputError(
        `Cantidad, precio y total deben ser enteros positivos hasta ${MAX_ODC_INTEGER}.`,
      );
    }
    return total;
  }

  static computeFiscalAmounts(subtotalCents: number, vatRateBps: number) {
    if (
      !Number.isSafeInteger(subtotalCents) ||
      subtotalCents < 1 ||
      subtotalCents > MAX_ODC_INTEGER ||
      (vatRateBps !== 0 && vatRateBps !== 1600)
    ) {
      throw new InvalidOdcInputError('Subtotal o tasa de IVA inválidos.');
    }
    const vatCents =
      vatRateBps === 0 ? 0 : Math.floor((subtotalCents * 16 + 50) / 100);
    const totalCents = subtotalCents + vatCents;
    if (!Number.isSafeInteger(totalCents) || totalCents > MAX_ODC_INTEGER) {
      throw new InvalidOdcInputError(
        'El total con IVA excede el límite permitido.',
      );
    }
    return { subtotalCents, vatCents, totalCents };
  }

  static computeItemsTotalCents(items: OdcLineItem[]): number {
    if (!Array.isArray(items) || items.length === 0) {
      throw new InvalidOdcInputError(
        'La ODC debe incluir al menos una partida.',
      );
    }
    return items.reduce((sum, item) => {
      PurchaseOrder.validateLineItem(item);
      const total =
        sum +
        PurchaseOrder.computeTotalCents(item.quantity, item.unitPriceCents);
      if (!Number.isSafeInteger(total) || total > MAX_ODC_INTEGER) {
        throw new InvalidOdcInputError(
          `La suma de partidas debe ser un entero positivo hasta ${MAX_ODC_INTEGER}.`,
        );
      }
      return total;
    }, 0);
  }

  private static validateLineItem(item: OdcLineItem): void {
    if (
      item === null ||
      typeof item !== 'object' ||
      typeof item.description !== 'string' ||
      item.description.trim() === '' ||
      typeof item.unit !== 'string' ||
      item.unit.trim() === ''
    ) {
      throw new InvalidOdcInputError(
        'Cada partida debe incluir una descripción y unidad no vacías.',
      );
    }
  }

  private static copyAndValidateItems(items: OdcLineItem[]): OdcLineItem[] {
    PurchaseOrder.computeItemsTotalCents(items);
    return items.map((item) => ({ ...item }));
  }

  private static normalizeCreateItems(input: CreateDraftInput): OdcLineItem[] {
    const hasItems = input.items !== undefined;
    const hasLegacyLine =
      input.description !== undefined ||
      input.quantity !== undefined ||
      input.unit !== undefined ||
      input.unitPriceCents !== undefined;
    if (hasItems && hasLegacyLine) {
      throw new InvalidOdcInputError(
        'Envía items o los campos escalares, pero no ambos.',
      );
    }
    if (hasItems) return input.items!;
    return [
      {
        description: input.description!,
        quantity: input.quantity!,
        unit: input.unit!,
        unitPriceCents: input.unitPriceCents!,
      },
    ];
  }

  static createDraft(
    input: CreateDraftInput,
    actor: OdcActor,
  ): { order: PurchaseOrder; record: TransitionRecord } {
    if (actor.role !== CREATE_RULE.role) {
      throw new InvalidRoleTransitionError(CREATE_RULE.action, actor.role);
    }
    const items = PurchaseOrder.copyAndValidateItems(
      PurchaseOrder.normalizeCreateItems(input),
    );
    const firstItem = items[0];
    const amounts = PurchaseOrder.computeFiscalAmounts(
      PurchaseOrder.computeItemsTotalCents(items),
      1600,
    );
    const order = new PurchaseOrder({
      id: null,
      odcNumber: null,
      status: 'BORRADOR',
      items,
      description: firstItem.description,
      quantity: firstItem.quantity,
      unit: firstItem.unit,
      unitPriceCents: firstItem.unitPriceCents,
      ...amounts,
      vatRateBps: 1600,
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
    for (const field of [
      'paymentDate',
      'warehouseEntryDate',
      'invoiceDate',
    ] as const) {
      if (data[field] !== undefined && !isCalendarDate(data[field])) {
        throw new InvalidOdcInputError(
          `${field} debe ser una fecha real YYYY-MM-DD, sin hora ni zona.`,
        );
      }
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

  // T1 fields are only editable while the ODC belongs to its creator's
  // workspace: BORRADOR or RECHAZADA (R11). The status never changes here;
  // resubmission is the submit transition (T10).
  edit(fields: EditableOdcFields): void {
    if (this.status !== 'BORRADOR' && this.status !== 'RECHAZADA') {
      throw new InvalidStatusTransitionError('edit', this.status);
    }
    const hasItems = fields.items !== undefined;
    const hasLegacyLine =
      fields.description !== undefined ||
      fields.quantity !== undefined ||
      fields.unit !== undefined ||
      fields.unitPriceCents !== undefined;
    if (hasItems && hasLegacyLine) {
      throw new InvalidOdcInputError(
        'Envía items o los campos escalares, pero no ambos.',
      );
    }
    const items = hasItems
      ? PurchaseOrder.copyAndValidateItems(fields.items!)
      : PurchaseOrder.copyAndValidateItems([
          {
            ...this.items[0],
            ...(fields.description !== undefined
              ? { description: fields.description }
              : {}),
            ...(fields.quantity !== undefined
              ? { quantity: fields.quantity }
              : {}),
            ...(fields.unit !== undefined ? { unit: fields.unit } : {}),
            ...(fields.unitPriceCents !== undefined
              ? { unitPriceCents: fields.unitPriceCents }
              : {}),
          },
          ...this.items.slice(1),
        ]);
    const nextVatRateBps =
      this.status === 'BORRADOR' && this.vatRateBps === 0
        ? 1600
        : this.vatRateBps;
    const amounts = PurchaseOrder.computeFiscalAmounts(
      PurchaseOrder.computeItemsTotalCents(items),
      nextVatRateBps,
    );
    this.items = items;
    this.description = items[0].description;
    this.quantity = items[0].quantity;
    this.unit = items[0].unit;
    this.unitPriceCents = items[0].unitPriceCents;
    if (fields.supplier !== undefined) this.supplier = fields.supplier;
    if (fields.comments !== undefined) this.comments = fields.comments;
    this.subtotalCents = amounts.subtotalCents;
    this.vatRateBps = nextVatRateBps;
    this.vatCents = amounts.vatCents;
    this.totalCents = amounts.totalCents;
  }
}
