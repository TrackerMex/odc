import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as ApiModule from '@/lib/api'
import { getOdc, listOdcs, listSuppliers } from '@/lib/api'
import { loadOpsDashboard } from '../index'
import { loadOdcDetail } from './$id'

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
