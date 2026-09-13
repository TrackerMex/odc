import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatCurrency,
  formatMonth,
  formatPercentChange,
  statusLabel,
} from '@/lib/odc'
import type { ExecutiveDashboardResponse } from '@/lib/odc'
import { OdcStatusBadge } from './odc-status-badge'

function comparison(value: number | null, month: string) {
  return value === null
    ? 'Sin base de comparación'
    : `${formatPercentChange(value)} frente a ${formatMonth(month)}`
}

export function ExecutiveAnalytics({
  dashboard,
}: {
  dashboard: ExecutiveDashboardResponse
}) {
  const { pulse, monthlyTrend, statusDistribution } = dashboard
  const maximum = Math.max(1, ...monthlyTrend.map((item) => item.totalCents))
  const points = monthlyTrend.map((item, index) => ({
    x: 62 + index * 57,
    y: 194 - (item.totalCents / maximum) * 155,
    ...item,
  }))
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const largestState = Math.max(
    1,
    ...statusDistribution.map((item) => item.count),
  )
  const metrics = [
    {
      label: 'Compras pagadas',
      value: formatCurrency(pulse.current.totalCents),
      detail: comparison(pulse.totalCentsChangePercent, pulse.previous.month),
      criterion: 'Importe por fecha de pago',
    },
    {
      label: 'Compras del periodo',
      value: String(pulse.current.purchaseCount),
      detail: comparison(
        pulse.purchaseCountChangePercent,
        pulse.previous.month,
      ),
      criterion: 'Órdenes por fecha de pago',
    },
    {
      label: 'ODC creadas',
      value: String(dashboard.createdOrders),
      detail: formatMonth(dashboard.month),
      criterion: 'Por fecha de creación',
    },
    {
      label: 'Tareas pendientes',
      value: String(dashboard.actionableTotal),
      detail: 'Requieren tu intervención',
      criterion: 'Todos los meses · sin filtros',
    },
  ]
  return (
    <>
      <section aria-label="Pulso operativo" className="min-w-0">
        <h2 className="sr-only">Pulso operativo</h2>
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card
              key={metric.label}
              className="min-w-0 gap-0 px-5 py-5 shadow-none"
            >
              <dt className="text-xs font-medium text-muted-foreground">
                {metric.label}
              </dt>
              <dd className="mt-3 break-words text-2xl font-semibold tracking-tight tabular-nums">
                {metric.value}
              </dd>
              <dd className="mt-2 text-xs text-muted-foreground">
                {metric.detail}
              </dd>
              <dd className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                {metric.criterion}
              </dd>
            </Card>
          ))}
        </dl>
      </section>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="min-w-0 gap-0 p-5 shadow-none">
          <h2 id="paid-trend-title" className="text-base font-semibold">
            Compras pagadas por mes
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {monthlyTrend.length
              ? `${formatMonth(monthlyTrend[0].month)} — ${formatMonth(monthlyTrend.at(-1)!.month)}`
              : 'Sin datos'}{' '}
            · MXN
          </p>
          <div
            className="mt-5 overflow-x-auto rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring"
            tabIndex={0}
            role="region"
            aria-label="Gráfica mensual desplazable"
          >
            <svg
              viewBox="0 0 720 240"
              role="img"
              aria-labelledby="paid-trend-title paid-trend-description"
              className="min-w-[560px] text-primary"
            >
              <desc id="paid-trend-description">
                Importes reales por fecha de pago. Escala desde cero; los
                valores completos están disponibles en la tabla de datos.
              </desc>
              {[0, 0.5, 1].map((fraction) => (
                <g key={fraction}>
                  <line
                    x1="62"
                    x2="695"
                    y1={194 - fraction * 155}
                    y2={194 - fraction * 155}
                    stroke="var(--border)"
                    strokeDasharray={fraction ? '3 5' : undefined}
                  />
                  <text
                    x="52"
                    y={198 - fraction * 155}
                    textAnchor="end"
                    fill="var(--muted-foreground)"
                    fontSize="16"
                  >
                    {new Intl.NumberFormat('es-MX', {
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    }).format((maximum * fraction) / 100)}
                  </text>
                </g>
              ))}
              {points.length > 1 && (
                <polyline
                  points={line}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {points.map((point) => (
                <g key={point.month}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="3.5"
                    fill="var(--card)"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <title>{`${formatMonth(point.month)}: ${formatCurrency(point.totalCents)}`}</title>
                  </circle>
                  <text
                    x={point.x}
                    y="222"
                    textAnchor="middle"
                    fill="var(--muted-foreground)"
                    fontSize="16"
                  >
                    {new Intl.DateTimeFormat('es-MX', {
                      month: 'short',
                      timeZone: 'UTC',
                    }).format(new Date(`${point.month}-01T00:00:00Z`))}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <details className="mt-3 border-t pt-3 text-xs">
            <summary className="w-fit cursor-pointer rounded-sm py-2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring">
              Ver datos de la gráfica
            </summary>
            <Table aria-label="Importes pagados por mes">
              <TableHeader className="static">
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Compras</TableHead>
                  <TableHead className="text-right">Importe MXN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyTrend.map((item) => (
                  <TableRow key={item.month}>
                    <TableCell>{formatMonth(item.month)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.purchaseCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.totalCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </details>
        </Card>
        <section aria-labelledby="state-distribution-title" className="min-w-0">
          <Card className="gap-0 p-5 shadow-none">
            <h2
              id="state-distribution-title"
              className="text-base font-semibold"
            >
              Estado actual de las ODC creadas en {formatMonth(dashboard.month)}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {dashboard.createdOrders} órdenes visibles · mes de creación
            </p>
            <ul
              className="mt-5 space-y-3"
              aria-label="Distribución de órdenes por estado"
            >
              {statusDistribution.map((item) => (
                <li
                  key={item.status}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5"
                >
                  <OdcStatusBadge
                    status={item.status}
                    className="h-auto w-fit whitespace-normal text-xs"
                  />
                  <span
                    className="text-xs font-medium tabular-nums"
                    aria-label={`${statusLabel(item.status)}: ${item.count}`}
                  >
                    {item.count}
                  </span>
                  <div
                    className="col-span-2 h-1 rounded-sm bg-muted"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-sm bg-primary/60"
                      style={{ width: `${(item.count / largestState) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            {dashboard.createdOrders === 0 && (
              <p className="mt-4 text-xs text-muted-foreground">
                No se crearon órdenes visibles en este mes.
              </p>
            )}
          </Card>
        </section>
      </div>
    </>
  )
}
