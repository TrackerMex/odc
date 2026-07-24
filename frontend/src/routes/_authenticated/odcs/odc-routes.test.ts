import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as ApiModule from '@/lib/api'
import { getOdc, listOdcs, listSuppliers } from '@/lib/api'
import {
  loadAuthenticatedDashboard,
  loadAdminDashboard,
  loadGeneralDashboard,
  loadOpsDashboard,
} from '../index'
import { canEditOdc, loadOdcDetail } from './$id'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return {
    ...actual,
    getOdc: vi.fn(),
    listOdcs: vi.fn(),
    listSuppliers: vi.fn(),
  }
})

const emptyPage = { items: [], total: 0, page: 1, pageSize: 20 }

describe('R3: authenticated dashboard selection is isolated by role', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['DIRECTOR_OPS', 'ops'],
    ['ADMINISTRACION', 'admin'],
    ['DIRECTOR_GENERAL', 'general'],
  ] as const)('selects only the %s dashboard', async (role, kind) => {
    vi.mocked(listOdcs).mockResolvedValue(emptyPage)

    await expect(loadAuthenticatedDashboard({ role })).resolves.toMatchObject({
      kind,
    })
  })

  it('does not select a dashboard for an unknown role', async () => {
    await expect(loadAuthenticatedDashboard({ role: 'UNKNOWN' })).resolves.toBeNull()
    expect(listOdcs).not.toHaveBeenCalled()
  })
})

describe('R1: dashboard loader requests every DIRECTOR_OPS queue', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps the four filtered pages without deriving totals client-side', async () => {
    vi.mocked(listOdcs).mockResolvedValue(emptyPage)

    const result = await loadOpsDashboard()

    expect(listOdcs).toHaveBeenCalledTimes(4)
    expect(listOdcs).toHaveBeenCalledWith('BORRADOR')
    expect(listOdcs).toHaveBeenCalledWith('RECHAZADA')
    expect(listOdcs).toHaveBeenCalledWith('COMPRA_APROBADA')
    expect(listOdcs).toHaveBeenCalledWith('EVIDENCIA_PAGO_SUBIDA')
    expect(Object.keys(result)).toEqual([
      'BORRADOR',
      'RECHAZADA',
      'COMPRA_APROBADA',
      'EVIDENCIA_PAGO_SUBIDA',
    ])
  })
})

describe('R1: dashboard loader requests only ADMINISTRACION queues', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps PENDIENTE_ADMIN and PAGO_REGISTRADO without Ops queues', async () => {
    vi.mocked(listOdcs).mockResolvedValue(emptyPage)

    const result = await loadAdminDashboard()

    expect(listOdcs).toHaveBeenCalledTimes(2)
    expect(listOdcs).toHaveBeenNthCalledWith(1, 'PENDIENTE_ADMIN')
    expect(listOdcs).toHaveBeenNthCalledWith(2, 'PAGO_REGISTRADO')
    expect(Object.keys(result)).toEqual(['PENDIENTE_ADMIN', 'PAGO_REGISTRADO'])
  })
})

describe('R1: dashboard loader requests only the DIRECTOR_GENERAL queue', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads exactly page 1 of PRESUPUESTO_APROBADO', async () => {
    vi.mocked(listOdcs).mockResolvedValue(emptyPage)

    await expect(loadGeneralDashboard()).resolves.toEqual(emptyPage)

    expect(listOdcs).toHaveBeenCalledOnce()
    expect(listOdcs).toHaveBeenCalledWith('PRESUPUESTO_APROBADO', 1)
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
