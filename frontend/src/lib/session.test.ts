import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import * as api from './api'
import { useSessionStore } from '../stores/session.store'
import { resolveSession } from './session'

const existingUser = {
  id: 'u1',
  email: 'existing@example.com',
  fullName: 'Existing User',
  role: 'ADMINISTRACION' as const,
}

const fetchedUser = {
  id: 'u2',
  email: 'fetched@example.com',
  fullName: 'Fetched User',
  role: 'DIRECTOR_OPS' as const,
}

describe('R5: resolveSession() consults the session store before GET /api/auth/me', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null })
    vi.restoreAllMocks()
  })

  it('returns the store user without calling getMe when the store is already populated', async () => {
    useSessionStore.setState({ user: existingUser })
    const getMeSpy = vi.spyOn(api, 'getMe')

    const result = await resolveSession()

    expect(getMeSpy).not.toHaveBeenCalled()
    expect(result).toEqual(existingUser)
  })

  it('calls getMe and stores the user when the store is empty and getMe resolves', async () => {
    vi.spyOn(api, 'getMe').mockResolvedValue(fetchedUser)

    const result = await resolveSession()

    expect(result).toEqual(fetchedUser)
    expect(useSessionStore.getState().user).toEqual(fetchedUser)
  })

  it('leaves the store empty and returns null when getMe rejects with 401', async () => {
    vi.spyOn(api, 'getMe').mockRejectedValue(new ApiError(401, 'Unauthorized'))

    const result = await resolveSession()

    expect(result).toBeNull()
    expect(useSessionStore.getState().user).toBeNull()
  })
})
