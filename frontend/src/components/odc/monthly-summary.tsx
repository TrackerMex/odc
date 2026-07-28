import { useEffect, useRef, useState } from 'react'
import { FileImageIcon, FileTextIcon } from 'lucide-react'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getMonthlyPurchaseSummary } from '@/lib/api'
import {
  exportMonthlySummarySlide,
  type SummaryExportFormat,
} from '@/lib/monthly-summary-export'
import {
  formatCurrency,
  formatDateOnly,
  formatMonth,
  statusLabel,
} from '@/lib/odc'
import type { MonthlyPurchaseSummary } from '@/lib/odc'
import { MonthlySummarySlide } from './monthly-summary-slide'

function StageLabel({
  status,
}: {
  status: 'PAGO_REGISTRADO' | 'EVIDENCIA_PAGO_SUBIDA' | 'COMPLETADA'
}) {
  return <Badge variant="secondary">{statusLabel(status)}</Badge>
}

export function MonthlySummary({
  initialSummary,
}: {
  initialSummary: MonthlyPurchaseSummary
}) {
  const [month, setMonth] = useState(initialSummary.month)
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const [exporting, setExporting] = useState<SummaryExportFormat | null>(null)
  const slideRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getMonthlyPurchaseSummary(month)
      .then((nextSummary) => {
        if (active) setSummary(nextSummary)
      })
      .catch(() => {
        if (active)
          setError(
            'No pudimos obtener el resumen de este mes. Inténtalo de nuevo.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [month, requestVersion])

  async function exportSlide(format: SummaryExportFormat) {
    if (!slideRef.current) return
    setExporting(format)
    setError(null)
    try {
      await exportMonthlySummarySlide(slideRef.current, summary.month, format)
    } catch {
      setError(
        'No pudimos generar el archivo. Verifica tu conexión e inténtalo de nuevo.',
      )
    } finally {
      setExporting(null)
    }
  }

  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">
              Operaciones / Seguimiento mensual
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Compras que sí se realizaron
            </h1>
            <p className="mt-2 text-muted-foreground">
              Un corte mensual listo para revisar y compartir, sin trasladar el
              control a Excel.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-sm font-medium">
              Mes de pago
              <Input
                aria-label="Mes de pago"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </label>
            <Button
              variant="outline"
              onClick={() => exportSlide('png')}
              disabled={loading || exporting !== null}
            >
              <FileImageIcon aria-hidden="true" />{' '}
              {exporting === 'png' ? 'Generando…' : 'Imagen'}
            </Button>
            <Button
              onClick={() => exportSlide('pdf')}
              disabled={loading || exporting !== null}
            >
              <FileTextIcon aria-hidden="true" />{' '}
              {exporting === 'pdf' ? 'Generando…' : 'PDF'}
            </Button>
          </div>
        </header>

        {error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>No se pudo completar la acción</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <AlertAction>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRequestVersion((version) => version + 1)}
              >
                Reintentar
              </Button>
            </AlertAction>
          </Alert>
        ) : null}

        {loading ? <SummarySkeleton /> : <SummaryContent summary={summary} />}
        {!loading && summary.purchases.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay compras con pago registrado en {formatMonth(summary.month)}.
          </div>
        ) : null}
      </div>
      <div className="fixed top-0 left-[-1200px]" aria-hidden="true">
        <div ref={slideRef}>
          <MonthlySummarySlide summary={summary} />
        </div>
      </div>
    </main>
  )
}

function SummarySkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <Skeleton className="h-52 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  )
}

function SummaryContent({ summary }: { summary: MonthlyPurchaseSummary }) {
  const metricCopy = [
    ['Total del mes', formatCurrency(summary.totalCents)],
    ['Compras registradas', String(summary.purchaseCount)],
    ['Ticket promedio', formatCurrency(summary.averageTicketCents)],
    [
      'Ingreso a almacén',
      summary.averageWarehouseDays === null
        ? 'Sin datos'
        : `${summary.averageWarehouseDays} días`,
    ],
  ]
  return (
    <div className="space-y-6">
      <section
        className="grid gap-4 lg:grid-cols-[1.6fr_1fr]"
        aria-label="Indicadores mensuales"
      >
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardDescription>Total de compras pagadas</CardDescription>
            <CardTitle className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {formatCurrency(summary.totalCents)}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 pt-5">
            {metricCopy.slice(1).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En qué etapa están</CardTitle>
            <CardDescription>
              Compras contabilizadas en el corte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.stages.map((stage) => (
              <div
                key={stage.status}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <StageLabel status={stage.status} />
                <span className="text-right tabular-nums">
                  {stage.count} · {formatCurrency(stage.totalCents)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle>Detalle del periodo</CardTitle>
          <CardDescription>
            {formatMonth(summary.month)} · {summary.purchaseCount} compras
            contabilizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  ODC / pago
                </TableHead>
                <TableHead className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  Solicitud
                </TableHead>
                <TableHead className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  Proveedor
                </TableHead>
                <TableHead className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  Almacén
                </TableHead>
                <TableHead className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  Factura
                </TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    <p className="font-medium">{purchase.odcNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateOnly(purchase.paymentDate)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p>{purchase.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {purchase.requesterName ?? 'Sin solicitante'} ·{' '}
                      {purchase.quantity} {purchase.unit}
                    </p>
                    {(purchase.observations ?? purchase.comments) ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {purchase.observations ?? purchase.comments}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{purchase.supplier}</TableCell>
                  <TableCell>
                    {formatDateOnly(purchase.warehouseEntryDate)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={purchase.hasInvoice ? 'secondary' : 'outline'}
                    >
                      {purchase.hasInvoice ? 'Facturada' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(purchase.totalCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
