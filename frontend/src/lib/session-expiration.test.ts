import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionStore } from '@/stores/session.store'
import {
  expireClientSession,
  resetClientSessionExpiration,
  subscribeToSessionExpiration,
} from './session-expiration'

describe('session-isolation R9: client session expiration', () => {
  beforeEach(() => {
    resetClientSessionExpiration()
    useSessionStore.setState({
      user: {
        id: 'u1',
        email: 'user@example.com',
        fullName: 'User Example',
        role: 'ADMINISTRACION',
      },
    })
  })

  it('clears only this browser store and notifies the global redirect listener', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToSessionExpiration(listener)

    expireClientSession()

    expect(useSessionStore.getState().user).toBeNull()
    expect(listener).toHaveBeenCalledOnce()

    unsubscribe()
  })

  it('removes listeners on cleanup', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToSessionExpiration(listener)
    unsubscribe()

    expireClientSession()

    expect(listener).not.toHaveBeenCalled()
  })

  it('notifies only once when concurrent protected requests all return 401', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToSessionExpiration(listener)

    expireClientSession()
    expireClientSession()
    expireClientSession()

    expect(listener).toHaveBeenCalledOnce()

    unsubscribe()
  })
})
