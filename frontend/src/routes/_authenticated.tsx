import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppLayout } from '../components/layout/app-layout'
import { resolveSession } from '../lib/session'
import { useSessionStore } from '../stores/session.store'

export async function authGuardBeforeLoad() {
  const user = await resolveSession()
  if (!user) {
    throw redirect({ to: '/login' })
  }
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: authGuardBeforeLoad,
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const user = useSessionStore((state) => state.user)

  // Guaranteed by authGuardBeforeLoad above; guarded again here purely for
  // type-safety (SessionUser | null), it's not a reachable UI state.
  if (!user) return <Outlet />

  return (
    <AppLayout user={user}>
      <Outlet />
    </AppLayout>
  )
}
