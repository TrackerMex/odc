import { createFileRoute } from '@tanstack/react-router'
import { listOdcs } from '@/lib/api'
import { OdcDashboard } from '@/components/odc/odc-dashboard'
import type { DashboardSections } from '@/components/odc/odc-dashboard'
import { AdminDashboard } from '@/components/odc/admin-dashboard'
import type { AdminDashboardSections } from '@/components/odc/admin-dashboard'
import { GeneralDashboard } from '@/components/odc/general-dashboard'
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

export async function loadAdminDashboard(): Promise<AdminDashboardSections> {
  const [pending, paid] = await Promise.all([
    listOdcs('PENDIENTE_ADMIN'),
    listOdcs('PAGO_REGISTRADO'),
  ])
  return {
    PENDIENTE_ADMIN: pending,
    PAGO_REGISTRADO: paid,
  }
}

export function loadGeneralDashboard() {
  return listOdcs('PRESUPUESTO_APROBADO', 1)
}

export const Route = createFileRoute('/_authenticated/')({
  loader: async ({ context }) => {
    if (context.user.role === 'DIRECTOR_OPS') {
      return { kind: 'ops' as const, sections: await loadOpsDashboard() }
    }
    if (context.user.role === 'ADMINISTRACION') {
      return { kind: 'admin' as const, sections: await loadAdminDashboard() }
    }
    if (context.user.role === 'DIRECTOR_GENERAL') {
      return { kind: 'general' as const, page: await loadGeneralDashboard() }
    }
    return null
  },
  pendingComponent: OdcPagePending,
  errorComponent: OdcPageError,
  component: Home,
})

function Home() {
  const dashboard = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  if (!dashboard) return <RolePlaceholder />
  if (dashboard.kind === 'admin') {
    return (
      <AdminDashboard userName={user.fullName} sections={dashboard.sections} />
    )
  }
  if (dashboard.kind === 'general') {
    return <GeneralDashboard userName={user.fullName} page={dashboard.page} />
  }
  return <OdcDashboard userName={user.fullName} sections={dashboard.sections} />
}
