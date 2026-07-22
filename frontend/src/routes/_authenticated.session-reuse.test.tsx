import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMe } from '../lib/api'
import type * as ApiModule from '../lib/api'
import { useSessionStore } from '../stores/session.store'
import { authGuardBeforeLoad } from './_authenticated'

// Deliberately does NOT mock '../lib/session': this exercises the real
// resolveSession() (store-first) together with the real guard, only
// spying on the network call it would otherwise make.
vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return { ...actual, getMe: vi.fn() }
})

const user = {
  id: 'u1',
  email: 'user@example.com',
  fullName: 'User Example',
  role: 'ADMINISTRACION',
}

describe('R13: protected route reuses the post-login session without refetching', () => {
  beforeEach(() => {
    vi.mocked(getMe).mockReset()
    useSessionStore.setState({ user })
  })

  it('does not call GET /api/auth/me and lets the navigation through', async () => {
    await expect(authGuardBeforeLoad()).resolves.toEqual({ user })
    expect(getMe).not.toHaveBeenCalled()
  })
})
