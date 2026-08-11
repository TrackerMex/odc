import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as ApiModule from '@/lib/api'
import {
  getExecutiveDashboard,
  getOdc,
  listOdcs,
  listSuppliers,
} from '@/lib/api'
import { loadAuthenticatedDashboard } from '../index'
import { canEditOdc, loadOdcDetail } from './$id'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return {
    ...actual,
    getOdc: vi.fn(),
    getExecutiveDashboard: vi.fn(),
    listOdcs: vi.fn(),
    listSuppliers: vi.fn(),
  }
})

const emptyDashboard = {
  month: '2026-07',
  role: 'DIRECTOR_OPS',
  priority: { total: 0, items: [] },
  pulse: {
    current: { purchaseCount: 0, totalCents: 0 },
    previous: { month: '2026-06', purchaseCount: 0, totalCents: 0 },
    purchaseCountChangePercent: null,
    totalCentsChangePercent: null,
  },
  oldestActiveOrders: [],
  topSuppliers: [],
} as const

describe('R2: authenticated home loads one shared executive snapshot by role', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['DIRECTOR_OPS', 'ops'],
    ['ADMINISTRACION', 'admin'],
    ['DIRECTOR_GENERAL', 'general'],
  ] as const)('selects only the %s dashboard', async (role) => {
    vi.mocked(getExecutiveDashboard).mockResolvedValue({
      ...emptyDashboard,
      role,
    })

    await expect(loadAuthenticatedDashboard({ role })).resolves.toMatchObject({
      role,
    })
    expect(getExecutiveDashboard).toHaveBeenCalledOnce()
    expect(getExecutiveDashboard).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}$/),
    )
    expect(listOdcs).not.toHaveBeenCalled()
  })

  it('does not select a dashboard for an unknown role', async () => {
    await expect(
      loadAuthenticatedDashboard({ role: 'UNKNOWN' }),
    ).resolves.toBeNull()
    expect(getExecutiveDashboard).not.toHaveBeenCalled()
    expect(listOdcs).not.toHaveBeenCalled()
  })
})

describe('R3,R7: detail loader resolves the ODC and supplier catalog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads both resources for detail and rejected editing', async () => {
    const odc = { id: 'o1', status: 'RECHAZADA' }
    const suppliers = [{ id: 's1', name: 'Suntech' }]
    vi.mocked(getOdc).mockResolvedValue(odc as never)
    vi.mocked(listSuppliers).mockResolvedValue(suppliers)

    await expect(loadOdcDetail('o1')).resolves.toEqual({ odc, suppliers })
    expect(getOdc).toHaveBeenCalledWith('o1')
    expect(listSuppliers).toHaveBeenCalledOnce()
  })
})

describe('R1,R5: draft editing access is limited to the creator in DIRECTOR_OPS', () => {
  const draft = { id: 'o1', status: 'BORRADOR', createdById: 'u1' } as const

  it('allows the creator to edit a BORRADOR', () => {
    expect(canEditOdc({ id: 'u1', role: 'DIRECTOR_OPS' }, draft)).toBe(true)
  })

  it.each([
    ['another user', { id: 'u2', role: 'DIRECTOR_OPS' }],
    ['another role', { id: 'u1', role: 'ADMINISTRACION' }],
    ['a submitted ODC', { id: 'u1', role: 'DIRECTOR_OPS' }, 'PENDIENTE_ADMIN'],
  ])('does not allow editing for %s', (_label, user, status = draft.status) => {
    expect(canEditOdc(user, { ...draft, status })).toBe(false)
  })

  it('keeps rejected editing available for the creator', () => {
    expect(
      canEditOdc(
        { id: 'u1', role: 'DIRECTOR_OPS' },
        { ...draft, status: 'RECHAZADA' },
      ),
    ).toBe(true)
  })
})
