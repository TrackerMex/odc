// @vitest-environment node
//
// Regression test for a cross-visitor session leak found running the real
// Docker dev server: `useSessionStore` is a single zustand instance created
// once at module scope, shared by every request the same Node process ever
// handles during SSR — not scoped per request/user. resolveSession() used
// to check that store before calling getMe(), so once one visitor's session
// populated it, every later visitor in the same process — even one with no
// cookie at all — saw the first visitor's user resolved out of the store
// instead of getting a fresh (and correctly unauthenticated) result.
// Forcing the `node` environment here (no `window` global, unlike the jsdom
// environment the rest of the suite runs under) exercises the server branch
// of resolveSession(), the same branch SSR beforeLoad hooks run through.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import * as api from './api'
import { useSessionStore } from '../stores/session.store'
import { resolveSession } from './session'

const visitorA = {
  id: 'a1',
  email: 'a@example.com',
  fullName: 'Visitor A',
  role: 'ADMINISTRACION',
}

describe('bug: resolveSession() must not read or write the shared store on the server', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null })
    vi.restoreAllMocks()
  })

  it('runs without a window global (sanity check that this exercises the server branch)', () => {
    expect(typeof window).toBe('undefined')
  })

  it('ignores a populated store and still calls getMe fresh', async () => {
    useSessionStore.setState({ user: visitorA })
    const getMeSpy = vi
      .spyOn(api, 'getMe')
      .mockRejectedValue(new ApiError(401, 'Unauthorized'))

    const result = await resolveSession()

    expect(getMeSpy).toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it('never writes a resolved user into the store', async () => {
    vi.spyOn(api, 'getMe').mockResolvedValue(visitorA)

    const result = await resolveSession()

    expect(result).toEqual(visitorA)
    expect(useSessionStore.getState().user).toBeNull()
  })

  it('two consecutive requests with different session states never contaminate each other', async () => {
    const getMeSpy = vi.spyOn(api, 'getMe')

    // Request 1: a visitor with a valid session cookie.
    getMeSpy.mockResolvedValueOnce(visitorA)
    const first = await resolveSession()
    expect(first).toEqual(visitorA)
    // Must still be untouched after a "successful" server-side resolve —
    // this is exactly what the old store-first check would have leaked to
    // the next request below.
    expect(useSessionStore.getState().user).toBeNull()

    // Request 2: a different visitor, same process, no cookie at all.
    getMeSpy.mockRejectedValueOnce(new ApiError(401, 'Unauthorized'))
    const second = await resolveSession()

    expect(second).toBeNull()
    expect(useSessionStore.getState().user).toBeNull()
  })
})
