import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ApiError } from './api'
import {
  expireClientSession,
  resetClientSessionExpiration,
} from './session-expiration'

vi.mock('./session-expiration', () => ({
  expireClientSession: vi.fn(),
  resetClientSessionExpiration: vi.fn(),
}))

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

describe('session-isolation R9: apiFetch centralizes protected 401 expiration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(expireClientSession).mockReset()
    vi.mocked(resetClientSessionExpiration).mockReset()
  })

  it('expires the client session before rejecting a protected 401', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(401, { message: 'Unauthorized' }),
    )

    const error = await apiFetch('/api/odcs').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(401)
    expect(expireClientSession).toHaveBeenCalledOnce()
  })

  it('keeps invalid login credentials local to the login form', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(401, { message: 'Invalid credentials' }),
    )

    await expect(
      apiFetch('/api/auth/login', { method: 'POST' }),
    ).rejects.toMatchObject({ status: 401 })

    expect(expireClientSession).not.toHaveBeenCalled()
  })

  it('rearms expiration handling after a successful login', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, {
        user: {
          id: 'u1',
          email: 'user@example.com',
          fullName: 'User Example',
          role: 'ADMINISTRACION',
        },
      }),
    )

    await apiFetch('/api/auth/login', { method: 'POST' })

    expect(resetClientSessionExpiration).toHaveBeenCalledOnce()
  })
})
