import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createOdc,
  getOdc,
  listOdcs,
  listSuppliers,
  submitOdc,
  updateOdc,
} from './api'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('R1,R3,R5,R6,R7,R8,R9: typed ODC API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('requests filtered dashboard pages and the supplier catalog', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ items: [], total: 0, page: 1, pageSize: 20 }),
      )
      .mockResolvedValueOnce(jsonResponse([{ id: 's1', name: 'Suntech' }]))

    await listOdcs('BORRADOR')
    await listSuppliers()

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/odcs?status=BORRADOR&page=1',
      expect.objectContaining({ credentials: 'include' }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/suppliers',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('uses the backend contracts for create, detail, update and submit', async () => {
    const odc = { id: 'o1', status: 'BORRADOR' }
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(jsonResponse(odc)),
    )
    const payload = {
      description: 'Sensores GPS',
      quantity: 2,
      unit: 'pieza',
      unitPriceCents: 12_500,
      supplier: 'Suntech',
    }

    await createOdc(payload)
    await getOdc('o1')
    await updateOdc('o1', payload)
    await submitOdc('o1')

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/odcs',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/odcs/o1',
      expect.objectContaining({ credentials: 'include' }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      '/api/odcs/o1',
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      '/api/odcs/o1/submit',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
