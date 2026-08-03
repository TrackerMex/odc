import { useState } from 'react'
import {
  ArrowLeftIcon,
  CircleAlertIcon,
  FilePenLineIcon,
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
import { getExecutiveTasks } from '@/lib/api'
import { formatCurrency } from '@/lib/odc'
import type {
  ExecutiveDashboardRole,
  ExecutiveTask,
  ExecutiveTaskPage,
} from '@/lib/odc'
import { OdcStatusBadge } from './odc-status-badge'

const actionLabel = {
  EDITAR_Y_REENVIAR: 'Reabrir y editar',
  VALIDAR_PRESUPUESTO: 'Validar presupuesto',
  APROBAR_COMPRA: 'Aprobar compra',
  REGISTRAR_PAGO: 'Registrar pago',
  CARGAR_EVIDENCIA_PAGO: 'Cargar evidencia de pago',
  COMPLETAR_FACTURA: 'Completar factura',
} as const

const opsActions = {
  EDITAR_Y_REENVIAR: { label: 'Reabrir y editar', icon: FilePenLineIcon },
  REGISTRAR_PAGO: { label: 'Registrar pago', icon: WalletCardsIcon },
  COMPLETAR_FACTURA: { label: 'Completar factura', icon: ReceiptTextIcon },
} as const

function TaskAction({
  role,
  task,
}: {
  role: ExecutiveDashboardRole
  task: ExecutiveTask
}) {
  if (role === 'DIRECTOR_OPS' && task.nextAction in opsActions) {
    const action = opsActions[task.nextAction as keyof typeof opsActions]
    const Icon = action.icon
    return <Link to="/odcs/$id" params={{ id: task.id }} className={buttonVariants({ variant: 'outline', size: 'sm' })}><Icon aria-hidden="true" />{action.label}</Link>
  }
  return <p className="shrink-0 text-right text-sm text-muted-foreground"><span className="block text-xs font-semibold tracking-[0.12em] uppercase">Siguiente acción</span><span className="text-foreground">{actionLabel[task.nextAction]}</span></p>
}

export function ExecutiveTasks({
  initialPage,
  role,
}: {
  initialPage: ExecutiveTaskPage
  role: ExecutiveDashboardRole
}) {
  const [taskPage, setTaskPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function loadPage(page: number) {
    setLoading(true)
    setError(false)
    try {
      setTaskPage(await getExecutiveTasks(page))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const first = taskPage.total === 0 ? 0 : (taskPage.page - 1) * taskPage.pageSize + 1
  const last = Math.min(taskPage.page * taskPage.pageSize, taskPage.total)

  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">Bandeja de trabajo</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Todas las tareas</h1>
            <p className="mt-2 text-muted-foreground">Prioriza las órdenes más antiguas y continúa su siguiente acción.</p>
          </div>
          <Link to="/" className={buttonVariants({ variant: 'outline' })}>
            <ArrowLeftIcon aria-hidden="true" /> Volver a la bandeja
          </Link>
        </header>

        {error ? (
          <Alert variant="destructive" className="mb-4">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>No pudimos cargar las tareas</AlertTitle>
            <AlertDescription>Verifica tu conexión e inténtalo de nuevo.</AlertDescription>
            <AlertAction><Button size="sm" variant="outline" onClick={() => loadPage(taskPage.page)}>Reintentar</Button></AlertAction>
          </Alert>
        ) : null}

        <section
          aria-labelledby="all-tasks-title"
          aria-busy={loading}
          className="transition-opacity duration-150 motion-reduce:transition-none"
        >
          <Card>
            <CardHeader className="border-b border-border/60">
              <CardTitle id="all-tasks-title">Tareas accionables</CardTitle>
              <CardDescription>
                {taskPage.total === 0 ? 'No tienes pendientes en este momento.' : `Mostrando ${first}–${last} de ${taskPage.total} tareas.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taskPage.items.length === 0 ? (
                <div className="flex min-h-32 items-center rounded-2xl border border-dashed px-5 text-sm text-muted-foreground">
                  Cuando haya una orden que requiera tu intervención aparecerá aquí.
                </div>
              ) : (
                <ul
                  key={taskPage.page}
                  className="odc-filter-results divide-y divide-border/70"
                  aria-label="Todas las tareas accionables"
                >
                  {taskPage.items.map((task) => (
                    <li key={task.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Link to="/odcs/$id" params={{ id: task.id }} className="group min-w-0 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
                          <div className="flex flex-wrap items-center gap-2"><span className="font-medium group-hover:underline group-hover:underline-offset-4">{task.odcNumber}</span><OdcStatusBadge status={task.status} /><span className="text-xs text-muted-foreground">{task.ageDays} {task.ageDays === 1 ? 'día' : 'días'}</span></div>
                          <p className="mt-1 text-sm text-muted-foreground sm:truncate">{task.description} · {task.supplier}</p>
                          <p className="mt-1 text-sm font-medium tabular-nums">{formatCurrency(task.totalCents)}</p>
                        </Link>
                        <TaskAction role={role} task={task} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {taskPage.total > taskPage.pageSize ? (
                <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Paginación de tareas">
                  <Button variant="outline" onClick={() => loadPage(taskPage.page - 1)} disabled={loading || taskPage.page === 1}>Anterior</Button>
                  <span className="text-sm tabular-nums text-muted-foreground">Página {taskPage.page}</span>
                  <Button variant="outline" onClick={() => loadPage(taskPage.page + 1)} disabled={loading || last === taskPage.total}>Siguiente</Button>
                </nav>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
