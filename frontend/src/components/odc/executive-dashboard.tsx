import {
  ArrowRightIcon,
  CircleAlertIcon,
  FilePenLineIcon,
  PlusIcon,
  ReceiptTextIcon,
  WalletCardsIcon,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  formatCurrency,
  formatMonth,
  formatPercentChange,
  statusLabel,
} from '@/lib/odc'
import type {
  ExecutiveDashboardResponse,
  ExecutiveDashboardRole,
  ExecutiveTask,
  ExecutiveTaskNextAction,
} from '@/lib/odc'
import { cn } from '@/lib/utils'
import { OdcStatusBadge } from './odc-status-badge'

const roleCopy: Record<
  ExecutiveDashboardRole,
  { label: string; description: string }
> = {
  DIRECTOR_OPS: {
    label: 'Operaciones',
    description:
      'Revisa lo que bloquea el flujo y continúa la siguiente acción.',
  },
  ADMINISTRACION: {
    label: 'Administración',
    description: 'Revisa las tareas que requieren tu validación o evidencia.',
  },
  DIRECTOR_GENERAL: {
    label: 'Dirección General',
    description:
      'Consulta las decisiones de compra que requieren tu aprobación.',
  },
}

const actionLabel: Record<ExecutiveTaskNextAction, string> = {
  EDITAR_Y_REENVIAR: 'Reabrir y editar',
  VALIDAR_PRESUPUESTO: 'Validar presupuesto',
  APROBAR_COMPRA: 'Aprobar compra',
  REGISTRAR_PAGO: 'Registrar pago',
  CARGAR_EVIDENCIA_PAGO: 'Cargar evidencia de pago',
  COMPLETAR_FACTURA: 'Completar factura',
}

const opsAction = {
  EDITAR_Y_REENVIAR: { label: 'Reabrir y editar', icon: FilePenLineIcon },
  REGISTRAR_PAGO: { label: 'Registrar pago', icon: WalletCardsIcon },
  COMPLETAR_FACTURA: { label: 'Completar factura', icon: ReceiptTextIcon },
}

function isOpsAction(
  nextAction: ExecutiveTaskNextAction,
): nextAction is keyof typeof opsAction {
  return nextAction in opsAction
}

function PriorityAction({
  role,
  task,
}: {
  role: ExecutiveDashboardRole
  task: ExecutiveTask
}) {
  if (role === 'DIRECTOR_OPS' && isOpsAction(task.nextAction)) {
    const action = opsAction[task.nextAction]
    const Icon = action.icon
    return (
      <Link
        to="/odcs/$id"
        params={{ id: task.id }}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'shrink-0',
        )}
      >
        <Icon aria-hidden="true" />
        {action.label}
      </Link>
    )
  }

  return (
    <p className="shrink-0 text-right text-sm text-muted-foreground">
      <span className="block text-xs font-medium tracking-wide uppercase">
        Siguiente acción
      </span>
      <span className="text-foreground">{actionLabel[task.nextAction]}</span>
    </p>
  )
}

function PriorityQueue({
  dashboard,
}: {
  dashboard: ExecutiveDashboardResponse
}) {
  const { priority } = dashboard
  return (
    <section aria-labelledby="priority-title" className="min-w-0">
      <Card className="h-full">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardDescription>Atención inmediata</CardDescription>
              <CardTitle id="priority-title" className="mt-1 text-xl">
                Prioridad inmediata
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {priority.total === 0
                  ? 'No tienes pendientes en este momento.'
                  : `${priority.total} ${priority.total === 1 ? 'tarea requiere' : 'tareas requieren'} atención.`}
              </p>
            </div>
            {dashboard.role === 'DIRECTOR_OPS' ? (
              <Link to="/odcs/new" className={buttonVariants({ size: 'sm' })}>
                <PlusIcon aria-hidden="true" />
                Crear ODC
              </Link>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {priority.items.length === 0 ? (
            <div className="flex min-h-32 items-center rounded-2xl border border-dashed px-5 text-sm text-muted-foreground">
              Cuando haya una orden que requiera tu intervención aparecerá aquí.
            </div>
          ) : (
            <ul
              className="divide-y divide-border/70"
              aria-label="Tareas prioritarias"
            >
              {priority.items.map((task) => (
                <li key={task.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      to="/odcs/$id"
                      params={{ id: task.id }}
                      className="group min-w-0 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium group-hover:underline group-hover:underline-offset-4">
                          {task.odcNumber}
                        </span>
                        <OdcStatusBadge status={task.status} />
                        <span className="text-xs text-muted-foreground">
                          {task.ageDays} {task.ageDays === 1 ? 'día' : 'días'}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {task.description} · {task.supplier}
                      </p>
                      <p className="mt-1 text-sm font-medium tabular-nums">
                        {formatCurrency(task.totalCents)}
                      </p>
                    </Link>
                    <PriorityAction role={dashboard.role} task={task} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {priority.total > priority.items.length ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Se muestran las {priority.items.length} tareas más antiguas de{' '}
              {priority.total}.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

function Pulse({ dashboard }: { dashboard: ExecutiveDashboardResponse }) {
  const { pulse } = dashboard
  const metrics = [
    {
      label: 'Compras pagadas',
      value: String(pulse.current.purchaseCount),
      change: pulse.purchaseCountChangePercent,
    },
    {
      label: 'Importe pagado',
      value: formatCurrency(pulse.current.totalCents),
      change: pulse.totalCentsChangePercent,
    },
  ]
  return (
    <section aria-labelledby="pulse-title" className="min-w-0">
      <Card className="h-full">
        <CardHeader className="border-b border-border/60">
          <CardDescription>
            Comparado con {formatMonth(pulse.previous.month)}
          </CardDescription>
          <CardTitle id="pulse-title" className="mt-1 text-xl">
            Pulso del periodo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatMonth(dashboard.month)}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                {metric.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {metric.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatPercentChange(metric.change)} vs. mes anterior
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

function OperationalContext({
  dashboard,
}: {
  dashboard: ExecutiveDashboardResponse
}) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <section aria-labelledby="ageing-title">
        <Card>
          <CardHeader>
            <CardTitle id="ageing-title">
              Órdenes con mayor antigüedad
            </CardTitle>
            <CardDescription>
              Órdenes activas que conviene destrabar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.oldestActiveOrders.length === 0 ? (
              <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                No hay órdenes activas con antigüedad para mostrar.
              </p>
            ) : (
              <ul
                className="divide-y divide-border/70"
                aria-label="Órdenes con mayor antigüedad"
              >
                {dashboard.oldestActiveOrders.map((order) => (
                  <li key={order.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      to="/odcs/$id"
                      params={{ id: order.id }}
                      className="group flex min-w-0 items-center justify-between gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium group-hover:underline group-hover:underline-offset-4">
                          {order.odcNumber}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {order.supplier} · {statusLabel(order.status)}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-sm tabular-nums">
                        {order.ageDays} días
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
      <section aria-labelledby="suppliers-title">
        <Card>
          <CardHeader>
            <CardTitle id="suppliers-title">Proveedores del periodo</CardTitle>
            <CardDescription>
              Compras pagadas agrupadas por proveedor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.topSuppliers.length === 0 ? (
              <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                No hay compras pagadas en este periodo.
              </p>
            ) : (
              <ol
                className="divide-y divide-border/70"
                aria-label="Proveedores del periodo"
              >
                {dashboard.topSuppliers.map((supplier) => (
                  <li
                    key={supplier.supplier}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="min-w-0 truncate font-medium">
                      {supplier.supplier}
                    </span>
                    <span className="shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                      {supplier.purchaseCount} compras ·{' '}
                      {formatCurrency(supplier.totalCents)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export function ExecutiveDashboard({
  userName,
  dashboard,
}: {
  userName: string
  dashboard: ExecutiveDashboardResponse
}) {
  const copy = roleCopy[dashboard.role]
  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {copy.label}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Buen día, {userName}
          </h1>
          <p className="mt-2 text-muted-foreground">{copy.description}</p>
        </header>
        <div className="space-y-4 transition-opacity duration-200 motion-reduce:transition-none">
          <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.9fr)]">
            <PriorityQueue dashboard={dashboard} />
            <Pulse dashboard={dashboard} />
          </div>
          <OperationalContext dashboard={dashboard} />
        </div>
      </div>
    </main>
  )
}

export function ExecutiveDashboardLoading() {
  return (
    <main
      className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"
      aria-label="Cargando resumen ejecutivo"
      aria-busy="true"
    >
      <div className="mx-auto max-w-7xl space-y-4">
        <Skeleton className="h-24 w-full max-w-xl motion-reduce:animate-none" />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.9fr)]">
          <Skeleton className="h-96 w-full motion-reduce:animate-none" />
          <Skeleton className="h-96 w-full motion-reduce:animate-none" />
        </div>
      </div>
    </main>
  )
}

export function ExecutiveDashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-lg">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>No pudimos cargar el resumen ejecutivo</AlertTitle>
        <AlertDescription>
          Verifica tu conexión e inténtalo de nuevo.
        </AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline" onClick={onRetry}>
            <ArrowRightIcon aria-hidden="true" />
            Reintentar
          </Button>
        </AlertAction>
      </Alert>
    </main>
  )
}
