import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  currentBusinessMonth,
  executiveSearchParams,
  isExecutiveMonth,
} from '@/lib/executive-query'
import type { ExecutiveQuery } from '@/lib/executive-query'
import type { ExecutiveDashboardRole, ExecutiveTaskPage } from '@/lib/odc'
import { ExecutiveTaskTable } from './executive-task-table'

export function ExecutiveTasks({
  initialPage,
  role,
  query = {
    month: initialPage.month ?? currentBusinessMonth(),
    page: initialPage.page,
  },
  onQueryChange = (next) =>
    window.location.assign(`/tasks?${executiveSearchParams(next)}`),
}: {
  initialPage: ExecutiveTaskPage
  role: ExecutiveDashboardRole
  query?: ExecutiveQuery
  onQueryChange?: (query: ExecutiveQuery) => void
}) {
  return (
    <main className="odc-executive-workspace min-w-0 flex-1 p-4 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Mis tareas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Órdenes que requieren una acción de tu rol.
            </p>
          </div>
          <Link to="/" className={buttonVariants({ variant: 'outline' })}>
            Volver al dashboard
          </Link>
        </header>
        {query.invalid && (
          <p role="alert" className="text-sm text-destructive">
            La dirección contenía filtros inválidos. Se muestran valores
            válidos; ajusta los filtros para continuar.
          </p>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="tasks-month"
              className="block text-xs font-medium text-muted-foreground"
            >
              Mes de creación
            </label>
            <Input
              id="tasks-month"
              type="month"
              min="1000-01"
              max="9999-12"
              value={query.month === 'all' ? '' : query.month}
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
          </div>
          <Button
            variant={query.month === 'all' ? 'secondary' : 'outline'}
            onClick={() =>
              onQueryChange({
                ...query,
                month: 'all',
                page: 1,
                invalid: undefined,
              })
            }
          >
            Todos los meses
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              onQueryChange({
                ...query,
                month: currentBusinessMonth(),
                page: 1,
                invalid: undefined,
              })
            }
          >
            Mes actual
          </Button>
        </div>
        <ExecutiveTaskTable
          title="Tareas accionables"
          page={initialPage}
          role={role}
          query={query}
          onChange={onQueryChange}
        />
        <p className="text-xs text-muted-foreground">
          La bandeja incluye tareas accionables. Las órdenes completadas se
          consultan en el resumen mensual.
        </p>
      </div>
    </main>
  )
}
