import { useEffect } from 'react'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '../components/layout/app-layout'
import { resolveSession, type SessionUser } from '../lib/session'
import { useSessionStore } from '../stores/session.store'

export async function authGuardBeforeLoad(): Promise<{ user: SessionUser }> {
  const user = await resolveSession()
  if (!user) {
    throw redirect({ to: '/login' })
  }
  // Threaded through route context instead of the zustand store: context is
  // per-request/per-render (safe during SSR), unlike the store, which is a
  // single instance shared by every request the Node process handles.
  return { user }
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: authGuardBeforeLoad,
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext()

  // Client-only (never runs during SSR): hydrates the store from the user
  // resolved by authGuardBeforeLoad so post-hydration interactions (logout,
  // R12) and later client-side navigations (R13) keep reading/clearing it
  // as before, without the store ever being written to on the server.
  useEffect(() => {
    useSessionStore.getState().setUser(user)
  }, [user])

  return (
    <AppLayout user={user}>
      <Outlet />
    </AppLayout>
  )
}
