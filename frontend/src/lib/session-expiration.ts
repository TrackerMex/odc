import { useSessionStore } from '@/stores/session.store'

type SessionExpirationListener = () => void

const listeners = new Set<SessionExpirationListener>()
let expirationNotified = false

export function subscribeToSessionExpiration(
  listener: SessionExpirationListener,
): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function expireClientSession(): void {
  useSessionStore.getState().clear()
  if (expirationNotified) return

  expirationNotified = true
  listeners.forEach((listener) => listener())
}

export function resetClientSessionExpiration(): void {
  expirationNotified = false
}
