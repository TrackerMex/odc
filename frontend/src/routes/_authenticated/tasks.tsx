import { createFileRoute } from '@tanstack/react-router'
import { ExecutiveTasks } from '@/components/odc/executive-tasks'
import { OdcPageError, OdcPagePending } from '@/components/odc/odc-page-state'
import { getExecutiveTasks } from '@/lib/api'
import type { ExecutiveDashboardRole } from '@/lib/odc'
import { useAuthenticatedUser } from '@/lib/use-authenticated-user'

export const Route = createFileRoute('/_authenticated/tasks')({
  loader: () => getExecutiveTasks(),
  pendingComponent: OdcPagePending,
  errorComponent: OdcPageError,
  component: TasksPage,
})

function TasksPage() {
  const user = useAuthenticatedUser()
  return (
    <ExecutiveTasks
      initialPage={Route.useLoaderData()}
      role={user.role as ExecutiveDashboardRole}
    />
  )
}
