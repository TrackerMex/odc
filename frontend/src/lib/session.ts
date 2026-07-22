import { ApiError, getMe } from './api'
import { useSessionStore } from '../stores/session.store'

export interface SessionUser {
  id: string
  email: string
  fullName: string
  // Only ever displayed as text in this feature (see design.md) — the
  // frontend doesn't branch on specific role values, so a plain string is
  // enough and avoids coupling to backend/src across the package boundary.
  role: string
}

/**
 * Resolves the current session: the zustand store is the source of truth
 * first (avoids a redundant GET /api/auth/me right after login, R8/R13);
 * only hits the network when the store is empty. A 401 from getMe means
 * there is no session — resolves to null instead of throwing (R5).
 */
export async function resolveSession(): Promise<SessionUser | null> {
  const { user, setUser } = useSessionStore.getState()
  if (user) return user

  try {
    const fetched = await getMe()
    setUser(fetched)
    return fetched
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}
