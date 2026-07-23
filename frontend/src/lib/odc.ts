import { z } from 'zod'

export const ODC_STATUSES = [
  'BORRADOR',
  'PENDIENTE_ADMIN',
  'PRESUPUESTO_APROBADO',
  'COMPRA_APROBADA',
  'PAGO_REGISTRADO',
  'EVIDENCIA_PAGO_SUBIDA',
  'COMPLETADA',
  'RECHAZADA',
] as const

export type OdcStatus = (typeof ODC_STATUSES)[number]

export interface OdcHistoryEntry {
  id: string | null
  odcId: string | null
  fromStatus: OdcStatus | null
  toStatus: OdcStatus
  userId: string
  note: string | null
  createdAt: string | null
}

export interface Odc {
  id: string | null
  odcNumber: string | null
  status: OdcStatus
  description: string
  quantity: number
  unit: string
  unitPriceCents: number
  totalCents: number
  supplier: string
  comments: string | null
  createdById: string
  rejectionReason: string | null
  paymentDate: string | null
  paymentMethod: string | null
  paymentReference: string | null
  paymentNotes: string | null
  hasPaymentEvidence: boolean
  evidenceReference: string | null
  hasInvoice: boolean
  invoiceNumber: string | null
  invoiceDate: string | null
  warehouseEntryDate: string | null
  observations: string | null
  createdAt: string | null
  updatedAt: string | null
  history: OdcHistoryEntry[]
}

export interface OdcPage {
  items: Odc[]
  total: number
  page: number
  pageSize: number
}

export interface Supplier {
  id: string | null
  name: string
}

export interface OdcPayload {
  description: string
  quantity: number
  unit: string
  unitPriceCents: number
  supplier: string
  comments?: string
}

const positiveIntegerString = z
  .string()
  .regex(/^\d+$/, 'Ingresa una cantidad entera.')
  .refine((value) => Number(value) > 0, 'La cantidad debe ser mayor a cero.')

const positiveMoneyString = z
  .string()
  .regex(/^\d+(?:\.\d{1,2})?$/, 'Usa un importe con máximo dos decimales.')
  .refine((value) => Number(value) > 0, 'El precio debe ser mayor a cero.')

export const odcFormSchema = z.object({
  description: z.string().trim().min(1, 'La descripción es obligatoria.'),
  quantity: positiveIntegerString,
  unit: z.string().trim().min(1, 'La unidad es obligatoria.'),
  unitPrice: positiveMoneyString,
  supplier: z.string().trim().min(1, 'Selecciona un proveedor.'),
  comments: z.string(),
})

export type OdcFormValues = z.infer<typeof odcFormSchema>
export type OdcFormField = keyof OdcFormValues

function parseUnitPriceCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null
  const [whole, fraction = ''] = value.split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}

export function computeTotalCents(
  quantityValue: string,
  unitPriceValue: string,
): number {
  if (!/^\d+$/.test(quantityValue)) return 0
  const quantity = Number(quantityValue)
  const unitPriceCents = parseUnitPriceCents(unitPriceValue)
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || !unitPriceCents) {
    return 0
  }
  const total = quantity * unitPriceCents
  return Number.isSafeInteger(total) ? total : 0
}

export function buildOdcPayload(values: OdcFormValues): OdcPayload {
  const unitPriceCents = parseUnitPriceCents(values.unitPrice)
  if (!unitPriceCents) {
    throw new Error('Invalid unit price')
  }

  const comments = values.comments.trim()
  return {
    description: values.description.trim(),
    quantity: Number(values.quantity),
    unit: values.unit.trim(),
    unitPriceCents,
    supplier: values.supplier,
    ...(comments ? { comments } : {}),
  }
}

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

export function formatUnitPriceInput(cents: number): string {
  return `${Math.trunc(cents / 100)}.${String(Math.abs(cents % 100)).padStart(2, '0')}`
}

export function formatDate(value: string | null): string {
  if (!value) return 'Pendiente'
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDateOnly(value: string | null): string {
  if (!value) return 'Pendiente'
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`))
}

export function statusLabel(status: OdcStatus): string {
  const labels: Record<OdcStatus, string> = {
    BORRADOR: 'Borrador',
    PENDIENTE_ADMIN: 'Pendiente de Administración',
    PRESUPUESTO_APROBADO: 'Presupuesto aprobado',
    COMPRA_APROBADA: 'Lista para comprar',
    PAGO_REGISTRADO: 'Pago registrado',
    EVIDENCIA_PAGO_SUBIDA: 'Pendiente de factura',
    COMPLETADA: 'Completada',
    RECHAZADA: 'Rechazada',
  }
  return labels[status]
}
