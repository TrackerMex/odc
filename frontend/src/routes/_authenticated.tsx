import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { resolveSession } from '../lib/session'

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
  return <Outlet />
}
