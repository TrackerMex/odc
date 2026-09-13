import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
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

const trendChartConfig = {
  totalCents: {
    label: 'Importe pagado',
    color: 'var(--primary)',
  },
  purchaseCount: {
    label: 'Compras',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

type TrendMetric = keyof typeof trendChartConfig

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
  const [activeTrend, setActiveTrend] = useState<TrendMetric>('totalCents')
  const trendTotals = useMemo(
    () => ({
      totalCents: monthlyTrend.reduce(
        (total, item) => total + item.totalCents,
        0,
      ),
      purchaseCount: monthlyTrend.reduce(
        (total, item) => total + item.purchaseCount,
        0,
      ),
    }),
    [monthlyTrend],
  )
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
        <Card className="min-w-0 gap-0 py-0 shadow-none">
          <CardHeader className="flex flex-col items-stretch border-b p-0 sm:flex-row">
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-5 py-4 sm:py-5">
              <CardTitle id="paid-trend-title">
                Compras pagadas por mes
              </CardTitle>
              <CardDescription className="text-xs">
                {monthlyTrend.length
                  ? `${formatMonth(monthlyTrend[0].month)} — ${formatMonth(monthlyTrend.at(-1)!.month)}`
                  : 'Sin datos'}
              </CardDescription>
            </div>
            <div
              className="grid min-w-0 grid-cols-2"
              role="group"
              aria-label="Métrica de la gráfica"
            >
              {(Object.keys(trendChartConfig) as TrendMetric[]).map(
                (metric) => (
                  <button
                    key={metric}
                    type="button"
                    data-active={activeTrend === metric}
                    aria-pressed={activeTrend === metric}
                    className="flex min-h-11 min-w-0 flex-col justify-center gap-1 border-t px-4 py-3 text-left outline-none transition-colors data-[active=true]:bg-muted/50 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none sm:border-t-0 sm:border-l sm:px-5 sm:py-5"
                    onClick={() => setActiveTrend(metric)}
                  >
                    <span className="text-xs text-muted-foreground">
                      {trendChartConfig[metric].label}
                    </span>
                    <span className="max-w-full text-base leading-tight font-semibold tabular-nums [overflow-wrap:anywhere] sm:text-lg xl:text-xl 2xl:text-2xl">
                      {metric === 'totalCents'
                        ? formatCurrency(trendTotals[metric])
                        : trendTotals[metric].toLocaleString('es-MX')}
                    </span>
                  </button>
                ),
              )}
            </div>
          </CardHeader>
          <div
            className="overflow-x-auto rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring"
            tabIndex={0}
            role="region"
            aria-label="Gráfica mensual desplazable"
          >
            <ChartContainer
              config={trendChartConfig}
              className="h-[260px] min-w-[560px] w-full px-2 py-5 sm:px-5"
              role="img"
              aria-labelledby="paid-trend-title paid-trend-description"
            >
              <LineChart
                accessibilityLayer
                data={monthlyTrend}
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={28}
                  tickFormatter={(value: string) =>
                    new Intl.DateTimeFormat('es-MX', {
                      month: 'short',
                      timeZone: 'UTC',
                    }).format(new Date(`${value}-01T00:00:00Z`))
                  }
                />
                <YAxis domain={[0, 'auto']} hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="w-44"
                      labelFormatter={(value) => formatMonth(String(value))}
                      formatter={(value) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {trendChartConfig[activeTrend].label}
                          </span>
                          <span className="font-mono font-medium tabular-nums">
                            {activeTrend === 'totalCents'
                              ? formatCurrency(Number(value))
                              : Number(value).toLocaleString('es-MX')}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Line
                  dataKey={activeTrend}
                  type="monotone"
                  stroke={`var(--color-${activeTrend})`}
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
          <p id="paid-trend-description" className="sr-only">
            Datos reales por fecha de pago, con escala desde cero. Los valores
            completos están disponibles en la tabla de datos.
          </p>
          <CardContent className="border-t px-5 py-3">
            <details className="text-xs">
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
          </CardContent>
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
