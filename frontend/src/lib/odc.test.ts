import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildOdcPayload,
  computeTotalCents,
  formatCurrency,
  formatDate,
  formatDateOnly,
  formatUnitPriceInput,
  odcFileUrl,
  odcFormSchema,
} from './odc'

describe('R2,R3: ODC form validation', () => {
  it('requires every T1 field except comments', () => {
    const result = odcFormSchema.safeParse({
      description: '',
      quantity: '',
      unit: '',
      unitPrice: '',
      supplier: '',
      comments: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(Object.keys(errors)).toEqual(
        expect.arrayContaining([
          'description',
          'quantity',
          'unit',
          'unitPrice',
          'supplier',
        ]),
      )
      expect(errors.comments).toBeUndefined()
    }
  })
})

describe('R4: MXN totals and API payload conversion', () => {
  it('computes exact cents and never includes totalCents in the payload', () => {
    expect(computeTotalCents('3', '149.90')).toBe(44_970)

    const payload = buildOdcPayload({
      description: 'Sensores GPS',
      quantity: '3',
      unit: 'pieza',
      unitPrice: '149.90',
      supplier: 'Suntech',
      comments: '',
    })

    expect(payload).toEqual({
      description: 'Sensores GPS',
      quantity: 3,
      unit: 'pieza',
      unitPriceCents: 14_990,
      supplier: 'Suntech',
    })
    expect(payload).not.toHaveProperty('totalCents')
  })

  it('rejects fractional quantities and prices with more than two decimals', () => {
    expect(
      odcFormSchema.safeParse({
        description: 'Sensores GPS',
        quantity: '1.5',
        unit: 'pieza',
        unitPrice: '149.999',
        supplier: 'Suntech',
        comments: '',
      }).success,
    ).toBe(false)
  })

  it('formats backend cents for the UI without floating point drift', () => {
    expect(formatUnitPriceInput(14_990)).toBe('149.90')
    expect(formatCurrency(44_970)).toMatch(/449[.,]70/)
  })
})

describe('R10: file download route builder', () => {
  it('builds the evidence and invoice download routes for an ODC id', () => {
    expect(odcFileUrl('o1', 'evidence')).toBe('/api/odcs/o1/files/evidence')
    expect(odcFileUrl('o1', 'invoice')).toBe('/api/odcs/o1/files/invoice')
  })
})

const NativeDateTimeFormat = Intl.DateTimeFormat

describe('odc-detail-history-hydration R4: explicit Mexico instant formatting', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each(['UTC', 'Asia/Tokyo', 'America/Mexico_City'])(
    'formats the same midnight-boundary instant in Mexico with default zone %s',
    (defaultTimeZone) => {
      vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
        function (locales, options) {
          return new NativeDateTimeFormat(locales, {
            ...options,
            timeZone: options?.timeZone ?? defaultTimeZone,
          })
        },
      )
      const instant = '2026-01-01T05:30:00.000Z'
      const expected = new NativeDateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Mexico_City',
      }).format(new Date(instant))

      expect(formatDate(instant)).toBe(expected)
      expect(formatDate(instant)).toMatch(/31 dic 2025/)
      expect(formatDate(null)).toBe('Pendiente')
    },
  )
})

describe('odc-detail-history-hydration R5: calendar dates retain their received day', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each(['UTC', 'Asia/Tokyo', 'America/Mexico_City'])(
    'preserves leap day and month/year boundaries with default zone %s',
    (defaultTimeZone) => {
      vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
        function (locales, options) {
          return new NativeDateTimeFormat(locales, {
            ...options,
            timeZone: options?.timeZone ?? defaultTimeZone,
          })
        },
      )
      for (const [date, text] of [
        ['2024-02-29', '29 feb 2024'],
        ['2026-12-31', '31 dic 2026'],
        ['2027-01-01', '1 ene 2027'],
      ]) {
        expect(formatDateOnly(date)).toBe(text)
      }
      expect(formatDateOnly(null)).toBe('Pendiente')
    },
  )
})
