import { ODC_STATUSES } from './odc'
import type { OdcStatus } from './odc'

export interface ExecutiveQuery {
  month: string
  page: number
  q?: string
  status?: OdcStatus
  order?: 'newest' | 'oldest'
  invalid?: boolean
}

export function currentBusinessMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)
  return `${parts.find((part) => part.type === 'year')!.value}-${parts.find((part) => part.type === 'month')!.value}`
}

export function isExecutiveMonth(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value)
}

export function parseExecutiveQuery(
  search: Record<string, unknown>,
  allowAll = false,
): ExecutiveQuery {
  const query: ExecutiveQuery = { month: currentBusinessMonth(), page: 1 }
  if (search.month !== undefined) {
    if (isExecutiveMonth(search.month) || (allowAll && search.month === 'all'))
      query.month = search.month
    else query.invalid = true
  }
  if (search.page !== undefined) {
    const page = Number(search.page)
    if (
      (typeof search.page === 'number' || typeof search.page === 'string') &&
      Number.isInteger(page) &&
      page > 0 &&
      page <= 2147483647
    )
      query.page = page
    else query.invalid = true
  }
  if (search.q !== undefined) {
    if (typeof search.q === 'string' && search.q.trim().length <= 120) {
      if (search.q.trim()) query.q = search.q.trim()
    } else query.invalid = true
  }
  if (search.status !== undefined) {
    if (ODC_STATUSES.includes(search.status as OdcStatus))
      query.status = search.status as OdcStatus
    else query.invalid = true
  }
  if (search.order !== undefined) {
    if (search.order === 'newest' || search.order === 'oldest')
      query.order = search.order
    else query.invalid = true
  }
  return query
}

export function executiveSearchParams(
  query: Partial<ExecutiveQuery>,
): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of ['month', 'page', 'q', 'status', 'order'] as const) {
    const value = query[key]
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return params
}
