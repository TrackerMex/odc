// @vitest-environment node
//
// Regression test for the SSR crash reported against the real Docker dev
// server: apiFetch used a relative path ('/api/auth/me'), which Node's
// fetch (unlike the browser's) cannot parse into a URL, and even once
// fixed, didn't forward the incoming request's session cookie to the
// backend. Forcing the `node` environment for this file (no `window`
// global, unlike the jsdom environment the rest of the suite runs under)
// exercises the server branch of apiFetch that api.test.ts, running under
// jsdom, cannot reach.
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-start/server', () => ({
  getRequestHeaders: vi.fn(),
}))

import { getRequestHeaders } from '@tanstack/react-start/server'
import { apiFetch } from './api'

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

describe('bug: apiFetch on the server must use an absolute URL and forward the incoming Cookie header', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(getRequestHeaders).mockReturnValue(new Headers())
  })

  it('runs without a window global (sanity check that this exercises the server branch)', () => {
    expect(typeof window).toBe('undefined')
  })

  it('requests an absolute URL instead of the bare path Node cannot parse', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, {}))

    await apiFetch('/api/auth/me')

    const [calledUrl] = vi.mocked(fetch).mock.calls[0]
    expect(calledUrl).toMatch(/^https?:\/\/.+\/api\/auth\/me$/)
  })

  it('forwards the incoming request Cookie header to the backend', async () => {
    vi.mocked(getRequestHeaders).mockReturnValue(
      new Headers({ cookie: 'odc_session=abc123' }),
    )
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, {}))

    await apiFetch('/api/auth/me')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const forwardedHeaders = new Headers(init?.headers)
    expect(forwardedHeaders.get('cookie')).toBe('odc_session=abc123')
  })

  it('does not throw and sends no cookie header outside a request context', async () => {
    vi.mocked(getRequestHeaders).mockImplementation(() => {
      throw new Error('No StartEvent found in AsyncLocalStorage')
    })
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, {}))

    await apiFetch('/api/auth/me')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const forwardedHeaders = new Headers(init?.headers)
    expect(forwardedHeaders.get('cookie')).toBeNull()
  })
})
