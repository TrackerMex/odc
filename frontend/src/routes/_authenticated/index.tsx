import { createFileRoute } from '@tanstack/react-router'
import { listOdcs } from '@/lib/api'
import { OdcDashboard } from '@/components/odc/odc-dashboard'
import type { DashboardSections } from '@/components/odc/odc-dashboard'
import {
  OdcPageError,
  OdcPagePending,
  RolePlaceholder,
} from '@/components/odc/odc-page-state'

export async function loadOpsDashboard(): Promise<DashboardSections> {
  const [drafts, rejected, approved, awaitingInvoice] = await Promise.all([
    listOdcs('BORRADOR'),
    listOdcs('RECHAZADA'),
    listOdcs('COMPRA_APROBADA'),
    listOdcs('EVIDENCIA_PAGO_SUBIDA'),
  ])
  return {
    BORRADOR: drafts,
    RECHAZADA: rejected,
    COMPRA_APROBADA: approved,
    EVIDENCIA_PAGO_SUBIDA: awaitingInvoice,
  }
}

export const Route = createFileRoute('/_authenticated/')({
  loader: async ({ context }) =>
    context.user.role === 'DIRECTOR_OPS' ? loadOpsDashboard() : null,
  pendingComponent: OdcPagePending,
  errorComponent: OdcPageError,
  component: Home,
})

function Home() {
  const sections = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  if (!sections) return <RolePlaceholder />
  return <OdcDashboard userName={user.fullName} sections={sections} />
}
