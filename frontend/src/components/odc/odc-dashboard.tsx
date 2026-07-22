import {
  CircleXIcon,
  FilePenLineIcon,
  PlusIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
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
import type { OdcPage, OdcStatus } from '@/lib/odc'
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
    status: 'BORRADOR',
    title: 'Borradores',
    description: 'Órdenes que todavía puedes completar y enviar.',
    icon: FilePenLineIcon,
  },
  {
    status: 'RECHAZADA',
    title: 'Rechazadas',
    description: 'Revisa el motivo, corrige y vuelve a enviar.',
    icon: CircleXIcon,
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

function QueueCard({
  title,
  description,
  status,
  icon: Icon,
  page,
}: {
  title: string
  description: string
  status: OdcStatus
  icon: typeof FilePenLineIcon
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
                Flujo de compra
              </span>
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {description}
            </CardDescription>
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

export function OdcDashboard({
  userName,
  sections,
}: {
  userName: string
  sections: DashboardSections
}) {
  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Operaciones
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Buen día, {userName}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Consulta tus órdenes activas y continúa cada compra desde donde
              quedó.
            </p>
          </div>
          <Link
            to="/odcs/new"
            className={cn(buttonVariants({ size: 'lg' }), 'self-start')}
          >
            <PlusIcon />
            Nueva ODC
          </Link>
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
