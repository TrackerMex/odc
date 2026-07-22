import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isRedirect } from '@tanstack/react-router'

vi.mock('@/lib/session', () => ({ resolveSession: vi.fn() }))

import { resolveSession } from '@/lib/session'
import { loginBeforeLoad } from './login'

const mockUser = {
  id: 'u1',
  email: 'user@example.com',
  fullName: 'User Example',
  role: 'ADMINISTRACION',
}

describe('R10: /login guard redirects to / when a session already exists', () => {
  beforeEach(() => {
    vi.mocked(resolveSession).mockReset()
  })

  it('redirects to / when resolveSession resolves a user', async () => {
    vi.mocked(resolveSession).mockResolvedValue(mockUser)

    const thrown = await loginBeforeLoad().then(
      () => null,
      (error: unknown) => error,
    )

    expect(isRedirect(thrown)).toBe(true)
    expect((thrown as { options: { to: string } }).options.to).toBe('/')
  })

  it('does not redirect when resolveSession resolves null (shows the form)', async () => {
    vi.mocked(resolveSession).mockResolvedValue(null)

    await expect(loginBeforeLoad()).resolves.toBeUndefined()
  })
})
