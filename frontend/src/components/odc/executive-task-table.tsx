import { useEffect, useId, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, statusLabel } from '@/lib/odc'
import type {
  ExecutiveDashboardRole,
  ExecutiveTaskPage,
  ExecutiveTaskNextAction,
  OdcStatus,
} from '@/lib/odc'
import type { ExecutiveQuery } from '@/lib/executive-query'
import { OdcStatusBadge } from './odc-status-badge'

const actionLabels: Record<ExecutiveTaskNextAction, string> = {
  EDITAR_Y_REENVIAR: 'Reabrir y editar',
  VALIDAR_PRESUPUESTO: 'Validar presupuesto',
  APROBAR_COMPRA: 'Aprobar compra',
  REGISTRAR_PAGO: 'Registrar pago',
  CARGAR_EVIDENCIA_PAGO: 'Cargar evidencia de pago',
  COMPLETAR_FACTURA: 'Completar factura',
}
const roleStatuses: Record<ExecutiveDashboardRole, OdcStatus[]> = {
  DIRECTOR_OPS: [
    'BORRADOR',
    'RECHAZADA',
    'COMPRA_APROBADA',
    'EVIDENCIA_PAGO_SUBIDA',
  ],
  ADMINISTRACION: ['PENDIENTE_ADMIN', 'PAGO_REGISTRADO'],
  DIRECTOR_GENERAL: ['PRESUPUESTO_APROBADO'],
}
const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeZone: 'America/Mexico_City',
})
const focusLink =
  'rounded-sm outline-none hover:underline underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring'

function TaskFilters({
  query,
  role,
  onChange,
}: {
  query: ExecutiveQuery
  role: ExecutiveDashboardRole
  onChange: (query: ExecutiveQuery) => void
}) {
  const [search, setSearch] = useState(query.q ?? '')
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const id = useId()

  useEffect(() => () => clearTimeout(searchTimer.current), [])

  const applySearch = (value: string) => {
    clearTimeout(searchTimer.current)
    const q = value.trim() || undefined
    if (q === query.q) return
    onChange({ ...query, q, page: 1, invalid: undefined })
  }

  return (
    <form
      className="grid gap-3 border-b p-4 md:grid-cols-[minmax(180px,1fr)_minmax(170px,auto)_minmax(145px,auto)_auto]"
      onSubmit={(event) => {
        event.preventDefault()
        applySearch(search)
      }}
    >
      <div className="min-w-0 space-y-1.5">
        <label
          htmlFor={`${id}-search`}
          className="text-xs text-muted-foreground"
        >
          Buscar por folio o proveedor
        </label>
        <div className="flex gap-1.5">
          <Input
            id={`${id}-search`}
            value={search}
            maxLength={120}
            placeholder="Folio o proveedor…"
            onChange={(event) => {
              const value = event.target.value
              setSearch(value)
              clearTimeout(searchTimer.current)
              searchTimer.current = setTimeout(() => applySearch(value), 300)
            }}
            className="min-w-0"
          />
          <Button
            type="submit"
            variant="outline"
            size="icon"
            aria-label="Buscar"
          >
            <SearchIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <label
          id={`${id}-status-label`}
          className="text-xs text-muted-foreground"
        >
          Estado
        </label>
        <Select
          value={query.status ?? 'all'}
          onValueChange={(value) =>
            onChange({
              ...query,
              status: value === 'all' ? undefined : (value as OdcStatus),
              page: 1,
              invalid: undefined,
            })
          }
        >
          <SelectTrigger
            aria-labelledby={`${id}-status-label`}
            className="w-full"
          >
            <SelectValue>
              {query.status ? statusLabel(query.status) : 'Todos los estados'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {roleStatuses[role].map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label
          id={`${id}-order-label`}
          className="text-xs text-muted-foreground"
        >
          Orden de creación
        </label>
        <Select
          value={
            query.order ?? (role === 'ADMINISTRACION' ? 'newest' : 'oldest')
          }
          onValueChange={(value) =>
            onChange({
              ...query,
              order: value as 'newest' | 'oldest',
              page: 1,
              invalid: undefined,
            })
          }
        >
          <SelectTrigger
            aria-labelledby={`${id}-order-label`}
            className="w-full"
          >
            <SelectValue>
              {(query.order ??
                (role === 'ADMINISTRACION' ? 'newest' : 'oldest')) === 'newest'
                ? 'Más recientes'
                : 'Más antiguas'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Más recientes</SelectItem>
            <SelectItem value="oldest">Más antiguas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="self-end"
        onClick={() => {
          clearTimeout(searchTimer.current)
          setSearch('')
          onChange({ month: query.month, page: 1 })
        }}
      >
        Limpiar filtros
      </Button>
    </form>
  )
}

export function ExecutiveTaskTable({
  title,
  page,
  role,
  query,
  onChange,
  dashboard = false,
}: {
  title: string
  page: ExecutiveTaskPage
  role: ExecutiveDashboardRole
  query: ExecutiveQuery
  onChange: (query: ExecutiveQuery) => void
  dashboard?: boolean
}) {
  const titleId = useId()
  const pageCount = Math.max(1, Math.ceil(page.total / page.pageSize))
  const first = page.items.length ? (page.page - 1) * page.pageSize + 1 : 0
  const last = page.items.length ? first + page.items.length - 1 : 0
  return (
    <section aria-labelledby={titleId} className="min-w-0">
      <Card className="min-w-0 gap-0 py-0 shadow-none">
        <CardHeader className="gap-1 border-b p-5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>
              <h2 id={titleId} className="text-base font-semibold">
                {title}
              </h2>
            </CardTitle>
            <span className="rounded-badge border px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums">
              {page.total}
            </span>
          </div>
          <CardDescription className="text-xs">
            {dashboard
              ? 'Pendientes de todos los meses'
              : 'Órdenes que requieren tu intervención, por mes de creación.'}
          </CardDescription>
          {dashboard && (
            <p className="text-xs text-muted-foreground">
              Los filtros de esta tabla no cambian las estadísticas.
            </p>
          )}
        </CardHeader>
        <TaskFilters
          key={`${query.q ?? ''}:${query.month}`}
          query={query}
          role={role}
          onChange={onChange}
        />
        {page.items.length ? (
          <div
            role="region"
            aria-label={
              dashboard
                ? 'Tabla de tareas prioritarias'
                : 'Tabla de tareas accionables'
            }
            tabIndex={0}
            className="overflow-x-auto outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring [&>[data-slot=table-container]]:overflow-visible"
          >
            <Table
              aria-label={
                dashboard ? 'Tareas prioritarias' : 'Tareas accionables'
              }
              className="min-w-[820px] table-fixed text-xs"
            >
              <TableHeader className="static bg-muted/45">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[32%] px-5 text-xs text-muted-foreground">
                    Orden / proveedor
                  </TableHead>
                  <TableHead className="w-[20%] text-xs text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="w-[16%] text-xs text-muted-foreground">
                    Creación
                  </TableHead>
                  <TableHead className="w-[15%] text-right text-xs text-muted-foreground">
                    Importe
                  </TableHead>
                  <TableHead className="w-[17%] pr-5 text-xs text-muted-foreground">
                    Siguiente acción
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.items.map((task) => (
                  <TableRow
                    key={task.id}
                    className="motion-reduce:transition-none"
                  >
                    <TableCell className="px-5 py-3 whitespace-normal">
                      <Link
                        to="/odcs/$id"
                        params={{ id: task.id }}
                        className={`${focusLink} block break-words font-medium`}
                      >
                        <span>{task.odcNumber}</span>
                        <span className="mt-1 block font-normal text-muted-foreground">
                          {task.supplier}
                        </span>
                        <span className="mt-1 block font-normal text-muted-foreground">
                          {task.description}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="py-3 whitespace-normal">
                      <OdcStatusBadge
                        status={task.status}
                        className="h-auto max-w-full whitespace-normal"
                      />
                    </TableCell>
                    <TableCell className="py-3 whitespace-normal tabular-nums">
                      <time dateTime={task.createdAt}>
                        {dateFormatter.format(new Date(task.createdAt))}
                      </time>
                      <p className="mt-1 text-muted-foreground">
                        <span className="sr-only">Antigüedad: </span>
                        {task.ageDays} {task.ageDays === 1 ? 'día' : 'días'}
                      </p>
                    </TableCell>
                    <TableCell className="py-3 text-right font-medium tabular-nums">
                      {formatCurrency(task.totalCents)}
                    </TableCell>
                    <TableCell className="py-3 pr-5 whitespace-normal">
                      {role === 'DIRECTOR_OPS' ? (
                        <Link
                          to="/odcs/$id"
                          params={{ id: task.id }}
                          className={`${focusLink} inline-flex items-center text-primary`}
                        >
                          {actionLabels[task.nextAction]}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          {actionLabels[task.nextAction]}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
            <p>
              {page.page > pageCount
                ? 'Esta página ya no tiene resultados.'
                : query.q || query.status
                  ? 'No encontramos tareas con estos filtros.'
                  : 'No tienes pendientes en este periodo.'}
            </p>
            <p>
              {page.page > 1
                ? 'Vuelve al inicio para consultar los resultados actuales.'
                : 'Puedes cambiar el periodo o limpiar los filtros.'}
            </p>
            {page.page > 1 && (
              <Button
                variant="outline"
                onClick={() => onChange({ ...query, page: 1 })}
              >
                Volver a página 1
              </Button>
            )}
          </CardContent>
        )}
        <nav
          aria-label="Paginación de tareas"
          className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-xs text-muted-foreground"
        >
          <p role="status" className="tabular-nums">
            Mostrando {first}–{last} de {page.total}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page.page <= 1}
              onClick={() => onChange({ ...query, page: page.page - 1 })}
            >
              Anterior
            </Button>
            <span className="tabular-nums">
              Página {page.page} de {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page.page >= pageCount}
              onClick={() => onChange({ ...query, page: page.page + 1 })}
            >
              Siguiente
            </Button>
          </div>
        </nav>
      </Card>
    </section>
  )
}
