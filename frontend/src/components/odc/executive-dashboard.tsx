import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CircleAlertIcon,
  PlusIcon,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatMonth, statusLabel } from '@/lib/odc'
import type {
  ExecutiveDashboardResponse,
  ExecutiveDashboardRole,
} from '@/lib/odc'
import { cn } from '@/lib/utils'
import { ExecutiveAnalytics } from './executive-analytics'
import { ExecutiveTaskTable } from './executive-task-table'
import { executiveSearchParams, isExecutiveMonth } from '@/lib/executive-query'
import type { ExecutiveQuery } from '@/lib/executive-query'

const roleCopy: Record<ExecutiveDashboardRole, { label: string }> = {
  DIRECTOR_OPS: { label: 'Operaciones' },
  ADMINISTRACION: { label: 'Administración' },
  DIRECTOR_GENERAL: { label: 'Dirección General' },
}

const detailLinkClass =
  'rounded-sm outline-none hover:underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring'

function DashboardHeader({
  userName,
  dashboard,
  query,
  onQueryChange,
}: {
  userName: string
  dashboard: ExecutiveDashboardResponse
  query: ExecutiveQuery
  onQueryChange: (query: ExecutiveQuery) => void
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
      <div className="flex flex-wrap items-end gap-3 lg:justify-end">
        <div className="space-y-1.5">
          <label
            htmlFor="dashboard-month"
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <CalendarDaysIcon className="size-4" aria-hidden="true" />
            Periodo estadístico
          </label>
          <Input
            id="dashboard-month"
            type="month"
            min="1000-01"
            max="9999-12"
            value={query.month}
            onChange={(event) => {
              if (isExecutiveMonth(event.target.value))
                onQueryChange({
                  ...query,
                  month: event.target.value,
                  page: 1,
                  invalid: undefined,
                })
            }}
            className="w-auto"
          />
          <span className="sr-only">{formatMonth(dashboard.month)}</span>
        </div>
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
      className="min-w-0 border-t p-5 lg:border-t-0 lg:border-l"
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
  query = { month: dashboard.month, page: dashboard.priority.page },
  onQueryChange = (next) =>
    window.location.assign(`/?${executiveSearchParams(next)}`),
}: {
  userName: string
  dashboard: ExecutiveDashboardResponse
  query?: ExecutiveQuery
  onQueryChange?: (query: ExecutiveQuery) => void
}) {
  return (
    <main className="odc-executive-dashboard odc-executive-workspace min-w-0 flex-1 p-4 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <DashboardHeader
          userName={userName}
          dashboard={dashboard}
          query={query}
          onQueryChange={onQueryChange}
        />
        {query.invalid && (
          <p role="alert" className="text-sm text-destructive">
            La dirección contenía filtros inválidos. Se muestran valores
            válidos; ajusta los filtros para continuar.
          </p>
        )}
        <ExecutiveAnalytics dashboard={dashboard} />
        <ExecutiveTaskTable
          title="Prioridad inmediata"
          page={dashboard.priority}
          role={dashboard.role}
          query={query}
          onChange={onQueryChange}
          dashboard
        />
        <Link
          to="/tasks"
          search={{ month: 'all', page: 1 }}
          className={cn(
            detailLinkClass,
            'inline-flex items-center text-sm font-medium text-primary',
          )}
        >
          Ver pendientes de todos los meses
          <ArrowRightIcon className="ml-2 size-4" aria-hidden="true" />
        </Link>
        <div>
          <Card className="grid min-w-0 gap-0 py-0 shadow-none lg:grid-cols-2">
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

export function ExecutiveDashboardError({
  onRetry,
  title = 'No pudimos cargar el resumen ejecutivo',
}: {
  onRetry: () => void
  title?: string
}) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <Alert variant="destructive" className="max-w-lg rounded-card">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>{title}</AlertTitle>
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
