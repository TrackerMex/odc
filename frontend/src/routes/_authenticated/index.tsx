import { createFileRoute, useRouter } from '@tanstack/react-router'
import { getExecutiveDashboard } from '@/lib/api'
import { useAuthenticatedUser } from '@/lib/use-authenticated-user'
import {
  ExecutiveDashboard,
  ExecutiveDashboardError,
  ExecutiveDashboardLoading,
} from '@/components/odc/executive-dashboard'
import type { ExecutiveDashboardResponse } from '@/lib/odc'
import {
  currentBusinessMonth,
  parseExecutiveQuery,
} from '@/lib/executive-query'
import type { ExecutiveQuery } from '@/lib/executive-query'
import type { SearchSchemaInput } from '@tanstack/react-router'

function currentMonth(): string {
  return currentBusinessMonth()
}

export async function loadAuthenticatedDashboard(
  user: {
    role: string
  },
  query?: ExecutiveQuery,
): Promise<ExecutiveDashboardResponse | null> {
  if (
    !['DIRECTOR_OPS', 'ADMINISTRACION', 'DIRECTOR_GENERAL'].includes(user.role)
  ) {
    return null
  }
  return query
    ? getExecutiveDashboard(query.month, query)
    : getExecutiveDashboard(currentMonth())
}

export const Route = createFileRoute('/_authenticated/')({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) =>
    parseExecutiveQuery(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    return loadAuthenticatedDashboard(context.user, deps)
  },
  pendingMs: 1_000,
  pendingMinMs: 0,
  pendingComponent: ExecutiveDashboardLoading,
  errorComponent: DashboardLoadError,
  component: Home,
})

function DashboardLoadError() {
  const router = useRouter()
  return (
    <ExecutiveDashboardError
      onRetry={() => {
        void router.invalidate()
      }}
    />
  )
}

function Home() {
  const dashboard = Route.useLoaderData()
  const user = useAuthenticatedUser()
  const query = Route.useSearch()
  const router = useRouter()
  if (!dashboard) return null
  return (
    <ExecutiveDashboard
      userName={user.fullName}
      dashboard={dashboard}
      query={query}
      onQueryChange={(search) => {
        void router.navigate({
          to: '/',
          search: { ...search },
          resetScroll: false,
        })
      }}
    />
  )
}
