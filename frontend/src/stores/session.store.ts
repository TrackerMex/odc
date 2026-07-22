import { create } from 'zustand'
import type { SessionUser } from '../lib/session'

interface SessionState {
  user: SessionUser | null
  setUser: (user: SessionUser) => void
  clear: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}))
