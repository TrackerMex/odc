import { describe, expect, it } from 'vitest'
import {
  currentBusinessMonth,
  executiveSearchParams,
  parseExecutiveQuery,
} from './executive-query'

describe('executive-workspace-v2 R2,R3,R4,R6: stable URL filters', () => {
  it('uses Mexico month at UTC month/year boundaries', () => {
    expect(currentBusinessMonth(new Date('2026-10-01T02:00:00Z'))).toBe(
      '2026-09',
    )
    expect(currentBusinessMonth(new Date('2027-01-01T05:59:59Z'))).toBe(
      '2026-12',
    )
    expect(currentBusinessMonth(new Date('2027-01-01T06:00:00Z'))).toBe(
      '2027-01',
    )
  })
  it('round-trips a historical filtered page without identity or unknown fields', () => {
    const query = parseExecutiveQuery(
      {
        month: '2025-12',
        page: '3',
        q: '  100%_MX  ',
        status: 'BORRADOR',
        order: 'oldest',
        userId: 'other',
      },
      true,
    )
    expect(query).toEqual({
      month: '2025-12',
      page: 3,
      q: '100%_MX',
      status: 'BORRADOR',
      order: 'oldest',
    })
    expect(
      parseExecutiveQuery(
        Object.fromEntries(executiveSearchParams(query)),
        true,
      ),
    ).toEqual(query)
  })
  it.each([
    { month: '2026-13' },
    { month: '' },
    { page: -1 },
    { page: ['2'] },
    { q: ['supplier'] },
    { q: 'x'.repeat(121) },
    { status: 'ADMIN' },
    { order: 'random' },
  ])('reports invalid input instead of opening all months: %j', (search) => {
    const parsed = parseExecutiveQuery(search, true)
    expect(parsed.invalid).toBe(true)
    expect(parsed.month).not.toBe('all')
  })
  it('accepts all only in tasks and only when explicit', () => {
    expect(parseExecutiveQuery({ month: 'all' }, true).month).toBe('all')
    expect(parseExecutiveQuery({ month: 'all' }).invalid).toBe(true)
    expect(parseExecutiveQuery({}, true).month).not.toBe('all')
  })
})
