import { BadgeCheckIcon, ReceiptTextIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCurrency } from '@/lib/odc'
import type { OdcPage, OdcStatus } from '@/lib/odc'
import { OdcStatusBadge } from './odc-status-badge'

export type AdminDashboardStatus = 'PENDIENTE_ADMIN' | 'PAGO_REGISTRADO'
export type AdminDashboardSections = Record<AdminDashboardStatus, OdcPage>

const sectionsConfig: Array<{
  status: AdminDashboardStatus
  title: string
  description: string
  icon: typeof BadgeCheckIcon
}> = [
  {
    status: 'PENDIENTE_ADMIN',
    title: 'Pendientes de validar',
    description: 'Órdenes que esperan validación de presupuesto.',
    icon: BadgeCheckIcon,
  },
  {
    status: 'PAGO_REGISTRADO',
    title: 'Compras pagadas',
    description: 'Pagos que esperan su comprobante.',
    icon: ReceiptTextIcon,
  },
]

function AdminQueue({
  title,
  description,
  status,
  icon: Icon,
  page,
}: {
  title: string
  description: string
  status: OdcStatus
  icon: typeof BadgeCheckIcon
  page: OdcPage
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Icon className="size-4" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.12em] uppercase">
                Administración
              </span>
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <span className="tabular-nums text-3xl font-semibold tracking-tight">
            {page.total}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {page.items.length === 0 ? (
          <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed px-5 text-center text-sm text-muted-foreground">
            No hay órdenes en esta etapa.
          </div>
        ) : (
          <ul className="divide-y divide-border/70" aria-label={title}>
            {page.items.map((odc) => (
              <li key={odc.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  to="/odcs/$id"
                  params={{ id: odc.id ?? '' }}
                  className="group flex min-w-0 items-center justify-between gap-4 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium group-hover:underline group-hover:underline-offset-4">
                        {odc.odcNumber}
                      </span>
                      <OdcStatusBadge status={status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {odc.description} · {odc.supplier}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatCurrency(odc.totalCents)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function AdminDashboard({
  userName,
  sections,
}: {
  userName: string
  sections: AdminDashboardSections
}) {
  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Administración
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Buen día, {userName}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Valida presupuestos y adjunta los comprobantes de las compras
            pagadas.
          </p>
        </header>

        <section
          className="grid min-w-0 gap-4 lg:grid-cols-2"
          aria-label="Resumen de Administración"
        >
          {sectionsConfig.map((section) => (
            <AdminQueue
              key={section.status}
              {...section}
              page={sections[section.status]}
            />
          ))}
        </section>
      </div>
    </main>
  )
}
