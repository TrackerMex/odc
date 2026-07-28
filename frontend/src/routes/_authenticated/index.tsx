import { createFileRoute } from '@tanstack/react-router'
import { getExecutiveDashboard } from '@/lib/api'
import { useAuthenticatedUser } from '@/lib/use-authenticated-user'
import {
  ExecutiveDashboard,
  ExecutiveDashboardError,
  ExecutiveDashboardLoading,
} from '@/components/odc/executive-dashboard'
import type { ExecutiveDashboardResponse } from '@/lib/odc'

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export async function loadAuthenticatedDashboard(user: {
  role: string
}): Promise<ExecutiveDashboardResponse | null> {
  if (
    !['DIRECTOR_OPS', 'ADMINISTRACION', 'DIRECTOR_GENERAL'].includes(user.role)
  ) {
    return null
  }
  return getExecutiveDashboard(currentMonth())
}

export const Route = createFileRoute('/_authenticated/')({
  loader: async ({ context }) => {
    return loadAuthenticatedDashboard(context.user)
  },
  pendingComponent: ExecutiveDashboardLoading,
  errorComponent: () => (
    <ExecutiveDashboardError onRetry={() => window.location.reload()} />
  ),
  component: Home,
})

function Home() {
  const dashboard = Route.useLoaderData()
  const user = useAuthenticatedUser()
  if (!dashboard) return null
  return <ExecutiveDashboard userName={user.fullName} dashboard={dashboard} />
}
