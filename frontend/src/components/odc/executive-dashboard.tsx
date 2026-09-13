import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChartNoAxesCombinedIcon,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

const detailLinkClass =
  'rounded-(--radius) outline-none hover:underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring'

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
          detailLinkClass,
          'inline-flex items-center gap-2 text-xs font-medium text-primary',
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {action.label}
      </Link>
    )
  }
  return (
    <span className="text-xs font-medium text-foreground">
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
  return (
    <section
      aria-label="Resumen ejecutivo"
      className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="min-w-0">
        <h1
          id="dashboard-title"
          className="break-words text-2xl font-semibold tracking-tight"
        >
          Buen día, {userName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {roleCopy[dashboard.role].label}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDaysIcon className="size-4" aria-hidden="true" />
          {formatMonth(dashboard.month)}
        </span>
        {dashboard.role === 'DIRECTOR_OPS' ? (
          <Link
            to="/odcs/new"
            className={cn(buttonVariants({ size: 'sm' }), 'max-md:min-h-11')}
          >
            <PlusIcon aria-hidden="true" />
            Crear ODC
          </Link>
        ) : null}
      </div>
    </section>
  )
}

function AmountBar({
  label,
  cents,
  maximum,
  muted = false,
}: {
  label: string
  cents: number
  maximum: number
  muted?: boolean
}) {
  const scale = Math.max(1, maximum)
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={scale}
      aria-valuenow={cents}
      aria-valuetext={formatCurrency(cents)}
      className="h-1.5 overflow-hidden rounded-sm bg-muted"
    >
      <div
        aria-hidden="true"
        className={cn('h-full rounded-sm bg-primary', muted && 'opacity-40')}
        style={{ width: `${(cents / scale) * 100}%` }}
      />
    </div>
  )
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="min-w-0 p-4 odd:border-r nth-[-n+2]:border-b xl:p-6">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-3 break-words text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </dd>
      <dd className="mt-1 break-words text-xs text-muted-foreground">
        {detail}
      </dd>
    </div>
  )
}

function Pulse({ dashboard }: { dashboard: ExecutiveDashboardResponse }) {
  const { pulse, priority } = dashboard
  const oldestOrder = dashboard.oldestActiveOrders.at(0)
  const maximum = Math.max(pulse.current.totalCents, pulse.previous.totalCents)
  const comparison =
    pulse.totalCentsChangePercent === null
      ? 'Sin base de comparación'
      : formatPercentChange(pulse.totalCentsChangePercent)
  return (
    <section aria-labelledby="pulse-title" className="min-w-0">
      <h2 id="pulse-title" className="sr-only">
        Pulso operativo
      </h2>
      <Card className="grid gap-0 py-0 shadow-none lg:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0 border-b p-5 lg:border-r lg:border-b-0 xl:p-6">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <ChartNoAxesCombinedIcon
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Compras pagadas
          </h3>
          <p className="mt-3 break-words text-3xl font-semibold tracking-tight tabular-nums xl:text-4xl">
            {formatCurrency(pulse.current.totalCents)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{comparison}</span>
            {pulse.totalCentsChangePercent !== null
              ? ' de gasto frente al mes anterior'
              : ''}
          </p>
          <div className="mt-6 space-y-4">
            {[{ ...pulse.current, month: dashboard.month }, pulse.previous].map(
              (period, index) => (
                <div key={period.month} className="space-y-2">
                  <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatMonth(period.month)}</span>
                    <span className="tabular-nums">
                      {formatCurrency(period.totalCents)}
                    </span>
                  </div>
                  <AmountBar
                    label={formatMonth(period.month)}
                    cents={period.totalCents}
                    maximum={maximum}
                    muted={index === 1}
                  />
                </div>
              ),
            )}
          </div>
        </div>
        <dl className="grid min-w-0 grid-cols-2">
          <Metric
            label="Compras del periodo"
            value={String(pulse.current.purchaseCount)}
            detail={`${pulse.previous.purchaseCount} en ${formatMonth(pulse.previous.month)}`}
          />
          <Metric
            label="Tareas pendientes"
            value={String(priority.total)}
            detail={
              priority.total === 0
                ? 'Sin tareas pendientes'
                : 'Requieren tu intervención'
            }
          />
          <Metric
            label="Variación de compras"
            value={
              pulse.purchaseCountChangePercent === null
                ? '—'
                : formatPercentChange(pulse.purchaseCountChangePercent)
            }
            detail={
              pulse.purchaseCountChangePercent === null
                ? 'Sin base de comparación'
                : 'Frente al mes anterior'
            }
          />
          <Metric
            label="Mayor antigüedad"
            value={oldestOrder ? `${oldestOrder.ageDays} días` : 'Sin órdenes'}
            detail={
              oldestOrder ? oldestOrder.odcNumber : 'No hay órdenes activas'
            }
          />
        </dl>
      </Card>
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
      <Card className="gap-0 py-0 shadow-none">
        <CardHeader className="border-b p-5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>
              <h2 id="priority-title" className="text-base font-semibold">
                Prioridad inmediata
              </h2>
            </CardTitle>
            <span className="rounded-badge border px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums">
              {priority.total}
            </span>
          </div>
          <CardDescription className="text-xs">
            {priority.total === 0
              ? 'No tienes pendientes en este momento.'
              : `${priority.total} ${priority.total === 1 ? 'tarea requiere' : 'tareas requieren'} atención.`}
          </CardDescription>
        </CardHeader>
        {priority.items.length === 0 ? (
          <CardContent className="p-5 text-sm text-muted-foreground">
            Cuando haya una orden que requiera tu intervención aparecerá aquí.
          </CardContent>
        ) : (
          <div
            role="region"
            aria-label="Tabla de tareas prioritarias"
            tabIndex={0}
            className="overflow-x-auto outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring [&>[data-slot=table-container]]:overflow-visible"
          >
            <Table
              aria-label="Tareas prioritarias"
              className="min-w-[680px] table-fixed text-xs"
            >
              <TableHeader className="static bg-muted/45">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[35%] px-5 text-xs text-muted-foreground">
                    Orden / proveedor
                  </TableHead>
                  <TableHead className="w-[22%] text-xs text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="w-[18%] text-right text-xs text-muted-foreground">
                    Importe
                  </TableHead>
                  <TableHead className="w-[25%] pr-5 text-xs text-muted-foreground">
                    Siguiente acción
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priority.items.slice(0, 5).map((task) => (
                  <TableRow
                    key={task.id}
                    className="motion-reduce:transition-none"
                  >
                    <TableCell className="px-5 py-4 whitespace-normal">
                      <Link
                        to="/odcs/$id"
                        params={{ id: task.id }}
                        className={cn(
                          detailLinkClass,
                          'block break-words font-medium',
                        )}
                      >
                        <span>{task.odcNumber}</span>
                        <span className="mt-1 block font-normal text-muted-foreground">
                          {task.supplier}
                        </span>
                        <span className="mt-1 block font-normal text-muted-foreground">
                          {task.description}
                        </span>
                      </Link>
                      <p className="mt-1 text-muted-foreground tabular-nums">
                        <span className="sr-only">Antigüedad: </span>
                        {task.ageDays} {task.ageDays === 1 ? 'día' : 'días'}
                      </p>
                    </TableCell>
                    <TableCell className="py-4 whitespace-normal">
                      <OdcStatusBadge
                        status={task.status}
                        className="h-auto max-w-full whitespace-normal"
                      />
                    </TableCell>
                    <TableCell className="py-4 text-right font-medium tabular-nums">
                      {formatCurrency(task.totalCents)}
                    </TableCell>
                    <TableCell className="py-4 pr-5 whitespace-normal">
                      <PriorityAction role={dashboard.role} task={task} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {priority.total > priority.items.length ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground">
            <p>
              Se muestran las {priority.items.length} tareas más antiguas de{' '}
              {priority.total}.
            </p>
            <Link
              to="/tasks"
              className={cn(
                detailLinkClass,
                'inline-flex items-center font-medium text-primary',
              )}
            >
              Ver todas las tareas
            </Link>
          </div>
        ) : null}
      </Card>
    </section>
  )
}

function TopSuppliers({
  dashboard,
}: {
  dashboard: ExecutiveDashboardResponse
}) {
  const suppliers = dashboard.topSuppliers.slice(0, 5)
  const maximum = Math.max(
    0,
    ...suppliers.map((supplier) => supplier.totalCents),
  )
  return (
    <section aria-labelledby="suppliers-title" className="min-w-0 p-5">
      <h2
        id="suppliers-title"
        className="text-base font-semibold tracking-tight"
      >
        Proveedores del periodo
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Compras pagadas agrupadas por proveedor.
      </p>
      {suppliers.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          No hay compras pagadas en este periodo.
        </p>
      ) : (
        <ol aria-label="Proveedores del periodo" className="mt-6 space-y-6">
          {suppliers.map((supplier) => (
            <li key={supplier.supplier} className="min-w-0">
              <p className="break-words text-xs font-medium">
                {supplier.supplier}
              </p>
              <div className="mt-2 mb-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground tabular-nums">
                <span>
                  {supplier.purchaseCount}{' '}
                  {supplier.purchaseCount === 1 ? 'compra' : 'compras'}
                </span>
                <span>{formatCurrency(supplier.totalCents)}</span>
              </div>
              <AmountBar
                label={supplier.supplier}
                cents={supplier.totalCents}
                maximum={maximum}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function AgeingAlerts({
  dashboard,
}: {
  dashboard: ExecutiveDashboardResponse
}) {
  return (
    <section
      aria-labelledby="ageing-alerts-title"
      className="min-w-0 border-t p-5"
    >
      <h2
        id="ageing-alerts-title"
        className="text-base font-semibold tracking-tight"
      >
        Órdenes más antiguas
      </h2>
      {dashboard.oldestActiveOrders.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No hay órdenes activas con antigüedad para mostrar.
        </p>
      ) : (
        <ul className="mt-3 divide-y" aria-label="Órdenes con mayor antigüedad">
          {dashboard.oldestActiveOrders.slice(0, 5).map((order) => (
            <li key={order.id} className="py-3 last:pb-0">
              <Link
                to="/odcs/$id"
                params={{ id: order.id }}
                className={cn(
                  detailLinkClass,
                  'flex min-w-0 items-start justify-between gap-3 text-xs',
                )}
              >
                <span className="min-w-0 break-words">
                  <span className="block font-medium">{order.odcNumber}</span>
                  <span className="mt-1 block text-muted-foreground">
                    {order.supplier}
                  </span>
                  <span className="mt-1 block text-muted-foreground">
                    {statusLabel(order.status)}
                  </span>
                </span>
                <span className="shrink-0 text-status-pending tabular-nums">
                  {order.ageDays} {order.ageDays === 1 ? 'día' : 'días'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
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
    <main className="odc-executive-dashboard min-w-0 flex-1 p-4 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <DashboardHeader userName={userName} dashboard={dashboard} />
        <Pulse dashboard={dashboard} />
        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)]">
          <PriorityQueue dashboard={dashboard} />
          <Card className="min-w-0 gap-0 py-0 shadow-none">
            <TopSuppliers dashboard={dashboard} />
            <AgeingAlerts dashboard={dashboard} />
          </Card>
        </div>
      </div>
    </main>
  )
}

export function ExecutiveDashboardLoading() {
  return (
    <main
      className="min-w-0 flex-1 p-4 sm:p-6 xl:p-8"
      aria-label="Cargando resumen ejecutivo"
      aria-busy="true"
    >
      <p role="status" className="sr-only">
        Cargando resumen ejecutivo
      </p>
      <div className="mx-auto max-w-[1400px] space-y-6" aria-hidden="true">
        <Skeleton className="h-16 w-full motion-reduce:animate-none" />
        <Skeleton className="h-72 w-full motion-reduce:animate-none" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)]">
          <Skeleton className="h-96 motion-reduce:animate-none" />
          <Skeleton className="h-96 motion-reduce:animate-none" />
        </div>
      </div>
    </main>
  )
}

export function ExecutiveDashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-lg rounded-card">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>No pudimos cargar el resumen ejecutivo</AlertTitle>
        <AlertDescription>
          Verifica tu conexión e inténtalo de nuevo.
        </AlertDescription>
        <AlertAction>
          <Button
            size="sm"
            variant="outline"
            className="max-md:min-h-11"
            onClick={onRetry}
          >
            <ArrowRightIcon aria-hidden="true" />
            Reintentar
          </Button>
        </AlertAction>
      </Alert>
    </main>
  )
}
