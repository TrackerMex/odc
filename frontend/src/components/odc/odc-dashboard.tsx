import {
  CircleXIcon,
  FilePenLineIcon,
  PlusIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
  ChartNoAxesCombinedIcon,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/odc'
import type { OdcPage } from '@/lib/odc'
import { OdcStatusBadge } from './odc-status-badge'

export type DashboardStatus =
  'BORRADOR' | 'RECHAZADA' | 'COMPRA_APROBADA' | 'EVIDENCIA_PAGO_SUBIDA'

export type DashboardSections = Record<DashboardStatus, OdcPage>

const sectionConfig: Array<{
  status: DashboardStatus
  title: string
  description: string
  icon: typeof FilePenLineIcon
}> = [
  {
    status: 'RECHAZADA',
    title: 'Rechazadas',
    description: 'Revisa el motivo, corrige y vuelve a enviar.',
    icon: CircleXIcon,
  },
  {
    status: 'BORRADOR',
    title: 'Borradores',
    description: 'Órdenes que todavía puedes completar y enviar.',
    icon: FilePenLineIcon,
  },
  {
    status: 'COMPRA_APROBADA',
    title: 'Listas para comprar',
    description: 'Compras autorizadas pendientes de pago.',
    icon: ShoppingCartIcon,
  },
  {
    status: 'EVIDENCIA_PAGO_SUBIDA',
    title: 'Pendientes de factura',
    description: 'Pagos comprobados que esperan factura y almacén.',
    icon: ReceiptTextIcon,
  },
]

// Cada cola es un solo estado, así que la barra puede llevar su color sin
// mentir sobre el contenido (pages/dashboard.md §Tarjetas de cola).
const queueAccent: Record<DashboardStatus, string> = {
  RECHAZADA: 'border-l-status-rejected',
  BORRADOR: 'border-l-status-draft',
  COMPRA_APROBADA: 'border-l-status-approved',
  EVIDENCIA_PAGO_SUBIDA: 'border-l-status-evidence',
}

function QueueCard({
  title,
  description,
  status,
  icon: Icon,
  page,
}: {
  title: string
  description: string
  status: DashboardStatus
  icon: typeof FilePenLineIcon
  page: OdcPage
}) {
  return (
    <Card className="min-w-0">
      <CardHeader
        className={cn(
          'border-b border-l-2 border-border/60 pb-3',
          queueAccent[status],
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Icon className="size-4" aria-hidden="true" />
              <span className="text-xs font-semibold tracking-[0.06em] uppercase">
                Flujo de compra
              </span>
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {description}
            </CardDescription>
          </div>
          <span
            className={cn(
              'tabular-nums text-2xl font-semibold tracking-tight',
              status === 'RECHAZADA'
                ? 'text-status-rejected'
                : 'text-muted-foreground',
            )}
          >
            {page.total}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {page.items.length === 0 ? (
          <div className="flex min-h-20 items-center justify-center rounded-2xl border border-dashed px-5 text-center text-sm text-muted-foreground">
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

export function OdcDashboard({
  userName,
  sections,
}: {
  userName: string
  sections: DashboardSections
}) {
  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              Operaciones
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Buen día, {userName}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <Link
              to="/monthly-summary"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <ChartNoAxesCombinedIcon />
              Resumen mensual
            </Link>
            <Link to="/odcs/new" className={cn(buttonVariants({ size: 'sm' }))}>
              <PlusIcon />
              Nueva ODC
            </Link>
          </div>
        </header>

        <section
          className="grid min-w-0 gap-4 lg:grid-cols-2"
          aria-label="Resumen de órdenes de compra"
        >
          {sectionConfig.map((section) => (
            <QueueCard
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
