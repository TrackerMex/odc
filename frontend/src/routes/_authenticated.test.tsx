import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isRedirect } from '@tanstack/react-router'

vi.mock('../lib/session', () => ({ resolveSession: vi.fn() }))

import { resolveSession } from '../lib/session'
import { authGuardBeforeLoad } from './_authenticated'

const mockUser = {
  id: 'u1',
  email: 'user@example.com',
  fullName: 'User Example',
  role: 'ADMINISTRACION',
}

describe('R6: protected route guard redirects to /login without a session', () => {
  beforeEach(() => {
    vi.mocked(resolveSession).mockReset()
  })

  it('redirects to /login when resolveSession resolves null', async () => {
    vi.mocked(resolveSession).mockResolvedValue(null)

    const thrown = await authGuardBeforeLoad().then(
      () => null,
      (error: unknown) => error,
    )

    expect(isRedirect(thrown)).toBe(true)
    expect((thrown as { options: { to: string } }).options.to).toBe('/login')
  })

  it('does not redirect when resolveSession resolves a user', async () => {
    vi.mocked(resolveSession).mockResolvedValue(mockUser)

    await expect(authGuardBeforeLoad()).resolves.toBeUndefined()
  })
})
