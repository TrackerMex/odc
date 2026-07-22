import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ApiError } from './api'

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

describe('R2: apiFetch sends credentials and parses JSON on 2xx', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('includes credentials and resolves the parsed JSON body', async () => {
    const body = { hello: 'world' }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, body))

    const result = await apiFetch('/api/ping')

    expect(fetch).toHaveBeenCalledWith(
      '/api/ping',
      expect.objectContaining({ credentials: 'include' }),
    )
    expect(result).toEqual(body)
  })
})

describe('R3: apiFetch rejects with status + message on non-2xx, non-401 responses', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('rejects with the status and message from a 400 response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(400, { message: 'Bad request' }),
    )

    await expect(apiFetch('/api/thing')).rejects.toMatchObject({
      status: 400,
      message: 'Bad request',
    })
  })

  it('rejects with the status and message from a 500 response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(500, { message: 'Internal error' }),
    )

    await expect(apiFetch('/api/thing')).rejects.toMatchObject({
      status: 500,
      message: 'Internal error',
    })
  })
})

describe('R4: apiFetch rejects with a distinguishable 401 error, without redirecting', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('rejects with status 401 and does not touch navigation', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(401, { message: 'Unauthorized' }),
    )

    const error = await apiFetch('/api/auth/me').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(401)
  })
})
