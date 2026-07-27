import { createFileRoute, redirect } from '@tanstack/react-router'
import { MonthlySummary } from '@/components/odc/monthly-summary'
import { OdcPageError, OdcPagePending } from '@/components/odc/odc-page-state'
import { getMonthlyPurchaseSummary } from '@/lib/api'

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const Route = createFileRoute('/_authenticated/monthly-summary')({
  beforeLoad: ({ context }) => {
    if (context.user.role !== 'DIRECTOR_OPS') throw redirect({ to: '/' })
  },
  loader: () => getMonthlyPurchaseSummary(currentMonth()),
  pendingComponent: OdcPagePending,
  errorComponent: OdcPageError,
  component: MonthlySummaryPage,
})

function MonthlySummaryPage() {
  return <MonthlySummary initialSummary={Route.useLoaderData()} />
}
