import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ExecutiveTasks } from '@/components/odc/executive-tasks'
import { OdcPagePending } from '@/components/odc/odc-page-state'
import { ExecutiveDashboardError } from '@/components/odc/executive-dashboard'
import { parseExecutiveQuery } from '@/lib/executive-query'
import { getExecutiveTasks } from '@/lib/api'
import type { ExecutiveDashboardRole } from '@/lib/odc'
import { useAuthenticatedUser } from '@/lib/use-authenticated-user'
import type { SearchSchemaInput } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tasks')({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) =>
    parseExecutiveQuery(search, true),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getExecutiveTasks(deps.page, deps),
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: OdcPagePending,
  errorComponent: TasksLoadError,
  component: TasksPage,
})

function TasksLoadError() {
  const router = useRouter()
  return (
    <ExecutiveDashboardError
      title="No pudimos cargar las tareas"
      onRetry={() => {
        void router.invalidate()
      }}
    />
  )
}

function TasksPage() {
  const user = useAuthenticatedUser()
  const initialPage = Route.useLoaderData()
  const query = Route.useSearch()
  const router = useRouter()
  return (
    <ExecutiveTasks
      initialPage={initialPage}
      role={user.role as ExecutiveDashboardRole}
      query={query}
      onQueryChange={(search) => {
        void router.navigate({ to: '/tasks', search: { ...search }, resetScroll: false })
      }}
    />
  )
}
