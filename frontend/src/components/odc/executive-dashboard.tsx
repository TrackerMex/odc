import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CircleAlertIcon,
  Clock3Icon,
  FilePenLineIcon,
  ListChecksIcon,
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

const roleCopy: Record<ExecutiveDashboardRole, { label: string }> = {
  DIRECTOR_OPS: { label: 'Operaciones' },
  ADMINISTRACION: { label: 'Administración' },
  DIRECTOR_GENERAL: { label: 'Dirección General' },
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
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
      >
        <Icon aria-hidden="true" />
        {action.label}
      </Link>
    )
  }

  return (
    <span className="text-sm font-medium text-foreground">
      {actionLabel[task.nextAction]}
    </span>
  )
}

function DashboardHeader({
  userName,
  dashboard,
}: {
  userName: string
  dashboard: ExecutiveDashboardResponse
}) {
  const copy = roleCopy[dashboard.role]
  return (
    <section
      aria-label="Resumen ejecutivo"
      className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {copy.label}
        </p>
        <h1
          id="dashboard-title"
          className="mt-2 text-2xl font-semibold tracking-tight"
        >
          Buen día, {userName}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className="inline-flex h-8 items-center gap-2 rounded-2xl bg-muted px-3 text-sm text-muted-foreground">
          <CalendarDaysIcon className="size-4" aria-hidden="true" />
          {formatMonth(dashboard.month)}
        </span>
        {dashboard.role === 'DIRECTOR_OPS' ? (
          <Link to="/odcs/new" className={buttonVariants({ size: 'sm' })}>
            <PlusIcon aria-hidden="true" />
            Crear ODC
          </Link>
        ) : null}
      </div>
    </section>
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
      <Card>
        <CardHeader className="border-b border-border/60 bg-muted/30">
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
            <span className="tabular-nums text-3xl font-semibold tracking-tight">
              {priority.total}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {priority.items.length === 0 ? (
            <div className="flex min-h-32 items-center rounded-2xl border border-dashed px-5 text-sm text-muted-foreground">
              Cuando haya una orden que requiera tu intervención aparecerá aquí.
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(8rem,0.8fr)_minmax(6rem,0.55fr)_minmax(7rem,0.7fr)_minmax(9rem,0.9fr)] gap-4 border-b border-border/60 pb-3 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase lg:grid">
                <span>Orden / proveedor</span>
                <span>Estado</span>
                <span>Antigüedad</span>
                <span className="text-right">Importe</span>
                <span className="text-right">Siguiente acción</span>
              </div>
              <ul
                className="divide-y divide-border/70"
                aria-label="Tareas prioritarias"
              >
                {priority.items.map((task) => (
                  <li
                    key={task.id}
                    className="grid gap-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1.8fr)_minmax(8rem,0.8fr)_minmax(6rem,0.55fr)_minmax(7rem,0.7fr)_minmax(9rem,0.9fr)] lg:items-center lg:gap-4"
                  >
                    <Link
                      to="/odcs/$id"
                      params={{ id: task.id }}
                      className="group min-w-0 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium group-hover:underline group-hover:underline-offset-4">
                          {task.odcNumber}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {task.description}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        Proveedor: {task.supplier}
                      </p>
                    </Link>
                    <div className="lg:contents">
                      <div className="lg:justify-self-start">
                        <span className="mr-2 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase lg:hidden">
                          Estado
                        </span>
                        <OdcStatusBadge status={task.status} />
                      </div>
                      <p className="text-sm tabular-nums lg:text-muted-foreground">
                        <span className="mr-2 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase lg:hidden">
                          Antigüedad
                        </span>
                        {task.ageDays} {task.ageDays === 1 ? 'día' : 'días'}
                      </p>
                      <p className="text-sm font-medium tabular-nums lg:text-right">
                        <span className="mr-2 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase lg:hidden">
                          Importe
                        </span>
                        {formatCurrency(task.totalCents)}
                      </p>
                      <div className="lg:text-right">
                        <span className="mr-2 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase lg:hidden">
                          Siguiente acción
                        </span>
                        <PriorityAction role={dashboard.role} task={task} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          {priority.total > priority.items.length ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-sm text-muted-foreground">
              <p>
                Se muestran las {priority.items.length} tareas más antiguas de{' '}
                {priority.total}.
              </p>
              <Link
                to="/tasks"
                className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                Ver todas las tareas
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof ListChecksIcon
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted/55 p-4 ring-1 ring-foreground/5 dark:ring-foreground/10">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {label}
        </p>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-3 truncate text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 min-h-5 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function Pulse({ dashboard }: { dashboard: ExecutiveDashboardResponse }) {
  const { pulse, priority } = dashboard
  const oldestOrder = dashboard.oldestActiveOrders[0]
  return (
    <section aria-labelledby="pulse-title" className="min-w-0">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Comparado con {formatMonth(pulse.previous.month)}
          </p>
          <h2 id="pulse-title" className="mt-1 text-xl font-semibold tracking-tight">
            Pulso operativo
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatMonth(dashboard.month)}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={ListChecksIcon}
          label="Tareas prioritarias"
          value={String(priority.total)}
          detail={
            priority.total === 0
              ? 'Sin tareas pendientes'
              : priority.total === 1
              ? 'requiere atención'
              : 'requieren atención'
          }
        />
        <Metric
          icon={WalletCardsIcon}
          label="Compras pagadas"
          value={String(pulse.current.purchaseCount)}
          detail={`${formatPercentChange(pulse.purchaseCountChangePercent)} vs. mes anterior`}
        />
        <Metric
          icon={ReceiptTextIcon}
          label="Importe pagado"
          value={formatCurrency(pulse.current.totalCents)}
          detail={`${formatPercentChange(pulse.totalCentsChangePercent)} vs. mes anterior`}
        />
        <Metric
          icon={Clock3Icon}
          label="Mayor antigüedad"
          value={oldestOrder ? `${oldestOrder.ageDays} días` : 'Sin órdenes'}
          detail={oldestOrder ? oldestOrder.odcNumber : 'No hay órdenes activas'}
        />
      </div>
    </section>
  )
}

function AgeingAlerts({
  dashboard,
}: {
  dashboard: ExecutiveDashboardResponse
}) {
  return (
    <section aria-labelledby="ageing-alerts-title" className="min-w-0">
      <Card className="h-full border-amber-200 dark:border-amber-900/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangleIcon
              className="size-5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <CardTitle id="ageing-alerts-title">
              Alertas: órdenes con mayor antigüedad
            </CardTitle>
          </div>
          <CardDescription>
            Órdenes activas que llevan más tiempo abiertas y conviene
            destrabar primero.
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
  )
}

function TopSuppliers({
  dashboard,
}: {
  dashboard: ExecutiveDashboardResponse
}) {
  return (
    <section aria-labelledby="suppliers-title" className="min-w-0">
      <Card className="h-full">
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
  )
}

export function ExecutiveDashboard({
  userName,
  dashboard,
}: {
  userName: string
  dashboard: ExecutiveDashboardResponse
}) {
  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <DashboardHeader userName={userName} dashboard={dashboard} />
        <div className="space-y-6 transition-opacity duration-200 motion-reduce:transition-none">
          <PriorityQueue dashboard={dashboard} />
          <Pulse dashboard={dashboard} />
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <AgeingAlerts dashboard={dashboard} />
            <TopSuppliers dashboard={dashboard} />
          </div>
        </div>
      </div>
    </main>
  )
}

export function ExecutiveDashboardLoading() {
  return (
    <main
      className="min-w-0 flex-1 p-4 sm:p-6"
      aria-label="Cargando resumen ejecutivo"
      aria-busy="true"
    >
      <div className="mx-auto max-w-[1400px] space-y-6">
        <Skeleton className="h-32 w-full motion-reduce:animate-none" />
        <Skeleton className="h-96 w-full motion-reduce:animate-none" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32 w-full motion-reduce:animate-none" />
          <Skeleton className="h-32 w-full motion-reduce:animate-none" />
          <Skeleton className="h-32 w-full motion-reduce:animate-none" />
          <Skeleton className="h-32 w-full motion-reduce:animate-none" />
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
