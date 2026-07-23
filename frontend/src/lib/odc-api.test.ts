import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  approveBudget,
  approvePurchase,
  createOdc,
  getOdc,
  listOdcs,
  listSuppliers,
  rejectOdc,
  submitOdc,
  updateOdc,
  uploadPaymentEvidence,
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

describe('R4,R6,R8,R9: ADMINISTRACION and shared rejection contracts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('uses the approve-budget and reject JSON endpoints', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(
        jsonResponse({ id: 'o1', status: 'PRESUPUESTO_APROBADO' }),
      ),
    )

    await approveBudget('o1')
    await rejectOdc('o1', '  Presupuesto insuficiente  ')

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/odcs/o1/approve-budget',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/odcs/o1/reject',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          rejectionReason: 'Presupuesto insuficiente',
        }),
      }),
    )
  })

  it('uploads evidence as FormData without setting Content-Type', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(
        jsonResponse({ id: 'o1', status: 'EVIDENCIA_PAGO_SUBIDA' }),
      ),
    )
    const file = new File(['pdf'], 'comprobante.pdf', {
      type: 'application/pdf',
    })

    await uploadPaymentEvidence('o1', file, '  SPEI-100  ')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(init?.method).toBe('POST')
    expect(init?.headers).toBeUndefined()
    expect(init?.body).toBeInstanceOf(FormData)
    const body = init?.body as FormData
    expect(body.get('file')).toBe(file)
    expect(body.get('evidenceReference')).toBe('SPEI-100')

    await uploadPaymentEvidence('o1', file, '   ')
    const emptyReferenceBody = vi.mocked(fetch).mock.calls[1][1]
      ?.body as FormData
    expect(emptyReferenceBody.has('evidenceReference')).toBe(false)
  })
})

describe('R6: DIRECTOR_GENERAL purchase approval contract', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('posts once to the approve-purchase endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ id: 'o1', status: 'COMPRA_APROBADA' }),
    )

    await approvePurchase('o1')

    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledWith(
      '/api/odcs/o1/approve-purchase',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
