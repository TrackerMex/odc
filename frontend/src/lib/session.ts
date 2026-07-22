import { ApiError, getMe, isServer } from './api'
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
 * Resolves the current session.
 *
 * `useSessionStore` is a single zustand instance created once at module
 * scope — shared by every request the Node process ever handles during SSR,
 * not scoped per request/user. Reading it there would leak whichever user
 * populated it first into every later visitor's server-rendered HTML;
 * writing to it would do the same going forward. So on the server this
 * always resolves fresh from getMe() and never reads/writes the store.
 *
 * On the client the store is scoped to a single browser session, so it's
 * safe (and desirable) to keep it as the source of truth first: avoids a
 * redundant GET /api/auth/me right after login (R8) and lets subsequent
 * client-side navigations reuse it without refetching (R13).
 */
export async function resolveSession(): Promise<SessionUser | null> {
  if (isServer()) {
    return fetchSession()
  }

  const { user, setUser } = useSessionStore.getState()
  if (user) return user

  const fetched = await fetchSession()
  if (fetched) setUser(fetched)
  return fetched
}

// A 401 from getMe means there is no session — resolves to null instead of
// throwing (R5).
async function fetchSession(): Promise<SessionUser | null> {
  try {
    return await getMe()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}
