import { describe, expect, it } from 'vitest'
import {
  buildOdcPayload,
  computeTotalCents,
  formatCurrency,
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
