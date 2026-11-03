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

export interface NotificationItem {
  id: string
  odcId: string
  odcNumber: string
  fromStatus: OdcStatus | null
  toStatus: OdcStatus
  actorName: string
  createdAt: string
  isRead: boolean
}

export interface NotificationFeed {
  items: NotificationItem[]
  unreadCount: number
}

export interface OdcLineItem {
  description: string
  quantity: number
  unit: string
  unitPriceCents: number
}

export interface Odc {
  id: string | null
  odcNumber: string | null
  status: OdcStatus
  /** Present on current API responses; optional for older cached payloads. */
  items?: OdcLineItem[]
  description: string
  quantity: number
  unit: string
  unitPriceCents: number
  subtotalCents?: number
  vatRateBps?: number
  vatCents?: number
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

export interface MonthlyPurchase {
  id: string
  odcNumber: string
  status: OdcStatus
  requesterName: string | null
  description: string
  supplier: string
  quantity: number
  unit: string
  totalCents: number
  paymentDate: string
  warehouseEntryDate: string | null
  hasInvoice: boolean
  comments: string | null
  observations: string | null
  itemCount?: number
}

export interface MonthlyPurchaseStage {
  status: 'PAGO_REGISTRADO' | 'EVIDENCIA_PAGO_SUBIDA' | 'COMPLETADA'
  count: number
  totalCents: number
}

export interface MonthlyPurchaseSummary {
  month: string
  totalCents: number
  purchaseCount: number
  averageTicketCents: number
  averageWarehouseDays: number | null
  stages: MonthlyPurchaseStage[]
  purchases: MonthlyPurchase[]
}

export type ExecutiveDashboardRole =
  'DIRECTOR_OPS' | 'ADMINISTRACION' | 'DIRECTOR_GENERAL'

export type ExecutiveTaskNextAction =
  | 'EDITAR_Y_REENVIAR'
  | 'VALIDAR_PRESUPUESTO'
  | 'APROBAR_COMPRA'
  | 'REGISTRAR_PAGO'
  | 'CARGAR_EVIDENCIA_PAGO'
  | 'COMPLETAR_FACTURA'

export interface ExecutiveTask {
  id: string
  odcNumber: string
  status: OdcStatus
  description: string
  supplier: string
  totalCents: number
  createdAt: string
  ageDays: number
  nextAction: ExecutiveTaskNextAction
  itemCount?: number
}

export interface ExecutiveOrder {
  id: string
  odcNumber: string
  status: OdcStatus
  description: string
  supplier: string
  totalCents: number
  createdAt: string
  ageDays: number
  itemCount?: number
}

export interface ExecutiveDashboardResponse {
  month: string
  role: ExecutiveDashboardRole
  priority: {
    total: number
    items: ExecutiveTask[]
    page: number
    pageSize: number
  }
  actionableTotal: number
  createdOrders: number
  monthlyTrend: Array<{
    month: string
    purchaseCount: number
    totalCents: number
  }>
  statusDistribution: Array<{ status: OdcStatus; count: number }>
  pulse: {
    current: { purchaseCount: number; totalCents: number }
    previous: { month: string; purchaseCount: number; totalCents: number }
    purchaseCountChangePercent: number | null
    totalCentsChangePercent: number | null
  }
  oldestActiveOrders: ExecutiveOrder[]
  topSuppliers: Array<{
    supplier: string
    purchaseCount: number
    totalCents: number
  }>
}

export interface ExecutiveTaskPage {
  items: ExecutiveTask[]
  total: number
  page: number
  pageSize: number
  month?: string
}

export interface Supplier {
  id: string | null
  name: string
}

export interface OdcPayloadFields {
  supplier: string
  comments?: string
}

export type OdcPayload = OdcPayloadFields &
  (
    | {
        items: OdcLineItem[]
        description?: never
        quantity?: never
        unit?: never
        unitPriceCents?: never
      }
    | {
        items?: never
        description: string
        quantity: number
        unit: string
        unitPriceCents: number
      }
  )

export interface OdcLineFormValues {
  description: string
  quantity: string
  unit: string
  unitPrice: string
}

export const MAX_ODC_INTEGER = 2_147_483_647

const positiveIntegerString = z
  .string()
  .regex(/^\d+$/, 'Ingresa una cantidad entera.')
  .refine((value) => Number(value) > 0, 'La cantidad debe ser mayor a cero.')
  .refine(
    (value) =>
      Number.isSafeInteger(Number(value)) && Number(value) <= MAX_ODC_INTEGER,
    'La cantidad supera el límite permitido.',
  )

const positiveMoneyString = z
  .string()
  .regex(/^\d+(?:\.\d{1,2})?$/, 'Usa un importe con máximo dos decimales.')
  .refine((value) => Number(value) > 0, 'El precio debe ser mayor a cero.')
  .refine((value) => {
    const cents = parseUnitPriceCents(value)
    return cents !== null && cents <= MAX_ODC_INTEGER
  }, 'El precio supera el límite permitido.')

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

export const odcLineFormSchema = z.object({
  description: z.string().trim().min(1, 'La descripción es obligatoria.'),
  quantity: positiveIntegerString,
  unit: z.string().trim().min(1, 'La unidad es obligatoria.'),
  unitPrice: positiveMoneyString,
})

export const odcMultiFormSchema = z.object({
  items: z.array(odcLineFormSchema).min(1, 'Agrega al menos una partida.'),
  supplier: z.string().trim().min(1, 'Selecciona un proveedor.'),
  comments: z.string(),
})

export type OdcMultiFormValues = z.infer<typeof odcMultiFormSchema>
export type OdcLineFormField = keyof OdcLineFormValues

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

export function computeItemsTotalCents(
  items: readonly OdcLineFormValues[],
): number {
  let total = 0
  for (const item of items) {
    const lineTotal = computeTotalCents(item.quantity, item.unitPrice)
    if (!lineTotal) continue
    total += lineTotal
    if (!Number.isSafeInteger(total)) return 0
  }
  return total
}

export function computeFiscalAmounts(
  subtotalCents: number,
  vatRateBps: number,
) {
  const vatCents =
    vatRateBps === 1600 ? Math.floor((subtotalCents * 16 + 50) / 100) : 0
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents }
}

export function buildOdcPayload(
  values: OdcFormValues | OdcMultiFormValues,
  useItemsContract = false,
): OdcPayload {
  const items = 'items' in values ? values.items : [values]
  const supplier = values.supplier
  const comments = values.comments.trim()
  const lineItems = items.map((item) => {
    const unitPriceCents = parseUnitPriceCents(item.unitPrice)
    if (!unitPriceCents) {
      throw new Error('Invalid unit price')
    }
    return {
      description: item.description.trim(),
      quantity: Number(item.quantity),
      unit: item.unit.trim(),
      unitPriceCents,
    }
  })

  if (useItemsContract || lineItems.length > 1) {
    return {
      items: lineItems,
      supplier,
      ...(comments ? { comments } : {}),
    }
  }

  if (lineItems.length === 0) {
    throw new Error('At least one ODC item is required')
  }
  const [first] = lineItems
  return {
    ...first,
    supplier,
    ...(comments ? { comments } : {}),
  }
}

export function odcItems(odc: Odc): OdcLineItem[] {
  return odc.items?.length
    ? odc.items
    : [
        {
          description: odc.description,
          quantity: odc.quantity,
          unit: odc.unit,
          unitPriceCents: odc.unitPriceCents,
        },
      ]
}

export function odcPayloadItems(payload: OdcPayload): OdcLineItem[] {
  if (payload.items) return payload.items
  return [
    {
      description: payload.description,
      quantity: payload.quantity,
      unit: payload.unit,
      unitPriceCents: payload.unitPriceCents,
    },
  ]
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

export function formatItemCount(count: number | null | undefined): string {
  const itemCount =
    Number.isSafeInteger(count) && Number(count) > 0 ? count! : 1
  return `${itemCount} ${itemCount === 1 ? 'partida' : 'partidas'}`
}

export function formatUnitPriceInput(cents: number): string {
  return `${Math.trunc(cents / 100)}.${String(Math.abs(cents % 100)).padStart(2, '0')}`
}

export function formatDate(value: string | null): string {
  if (!value) return 'Pendiente'
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(new Date(value))
}

export function formatDateOnly(value: string | null): string {
  if (!value) return 'Pendiente'
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`))
}

export function formatMonth(value: string): string {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

export function formatPercentChange(value: number | null): string {
  if (value === null) return 'Sin base comparable'
  const sign = value > 0 ? '+' : ''
  return `${sign}${new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 1,
  }).format(value)}%`
}

export function odcFileUrl(id: string, kind: 'evidence' | 'invoice'): string {
  return `/api/odcs/${id}/files/${kind}`
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
