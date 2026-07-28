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
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { getMonthlyPurchaseSummary } from '@/lib/api'
import { exportMonthlySummarySlide } from '@/lib/monthly-summary-export'
import type { SummaryExportFormat } from '@/lib/monthly-summary-export'
import {
  formatCurrency,
  formatDateOnly,
  formatMonth,
  statusLabel,
} from '@/lib/odc'
import type { MonthlyPurchaseSummary } from '@/lib/odc'
import { MonthlySummarySlide } from './monthly-summary-slide'

const PURCHASES_PER_PAGE = 10

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
  const [page, setPage] = useState(1)
  const slideRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getMonthlyPurchaseSummary(month)
      .then((nextSummary) => {
        if (active) {
          setSummary(nextSummary)
          setPage(1)
        }
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

  const isSummaryCurrent = summary.month === month && error === null

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
              Un corte mensual listo para revisar y compartir.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1 text-sm font-medium">
              <label htmlFor="payment-month">Mes de pago</label>
              <DatePicker
                id="payment-month"
                label="Mes de pago"
                value={month}
                onChange={setMonth}
                mode="month"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => exportSlide('png')}
              disabled={loading || exporting !== null || !isSummaryCurrent}
            >
              <FileImageIcon aria-hidden="true" />{' '}
              {exporting === 'png' ? 'Generando…' : 'Imagen'}
            </Button>
            <Button
              onClick={() => exportSlide('pdf')}
              disabled={loading || exporting !== null || !isSummaryCurrent}
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

        <div aria-live="polite" className="sr-only">
          {loading
            ? `Actualizando el resumen de ${formatMonth(month)}.`
            : error
              ? `No se pudo actualizar el resumen de ${formatMonth(month)}.`
              : `Resumen de ${formatMonth(summary.month)} actualizado.`}
        </div>
        <section aria-busy={loading} aria-label="Resumen mensual">
          {loading ? (
            <SummarySkeleton />
          ) : isSummaryCurrent ? (
            <div
              key={summary.month}
              data-testid="monthly-summary-results"
              className="odc-filter-results"
            >
              <SummaryContent
                summary={summary}
                page={page}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </section>
        {!loading && isSummaryCurrent && summary.purchases.length === 0 ? (
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
    <div className="space-y-5 motion-reduce:animate-none" aria-busy="true">
      <Skeleton className="h-52 w-full motion-reduce:animate-none" />
      <Skeleton className="h-72 w-full motion-reduce:animate-none" />
    </div>
  )
}

function SummaryContent({
  summary,
  page,
  onPageChange,
}: {
  summary: MonthlyPurchaseSummary
  page: number
  onPageChange: (page: number) => void
}) {
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
  const pageCount = Math.ceil(summary.purchases.length / PURCHASES_PER_PAGE)
  const currentPage = Math.min(page, pageCount || 1)
  const firstPurchaseIndex = (currentPage - 1) * PURCHASES_PER_PAGE
  const visiblePurchases = summary.purchases.slice(
    firstPurchaseIndex,
    firstPurchaseIndex + PURCHASES_PER_PAGE,
  )
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
          <Table
            id="monthly-purchase-table"
            data-testid="monthly-summary-detail"
          >
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
              {visiblePurchases.map((purchase) => (
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
          {pageCount > 1 ? (
            <PurchasePagination
              currentPage={currentPage}
              pageCount={pageCount}
              totalPurchases={summary.purchases.length}
              onPageChange={onPageChange}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function PurchasePagination({
  currentPage,
  pageCount,
  totalPurchases,
  onPageChange,
}: {
  currentPage: number
  pageCount: number
  totalPurchases: number
  onPageChange: (page: number) => void
}) {
  const firstPurchase = (currentPage - 1) * PURCHASES_PER_PAGE + 1
  const lastPurchase = Math.min(
    currentPage * PURCHASES_PER_PAGE,
    totalPurchases,
  )
  const pages = visiblePages(currentPage, pageCount)

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Mostrando {firstPurchase}–{lastPurchase} de {totalPurchases} compras
      </p>
      <Pagination
        aria-label="Paginación del detalle de compras"
        className="mx-0 w-auto sm:justify-end"
      >
        <PaginationContent>
          {currentPage > 1 ? (
            <PaginationItem>
              <PaginationPrevious
                href="#monthly-purchase-table"
                text="Anterior"
                aria-label="Página anterior"
                onClick={(event) => {
                  event.preventDefault()
                  onPageChange(currentPage - 1)
                }}
              />
            </PaginationItem>
          ) : null}
          {pages.map((pageNumber, index) =>
            pageNumber === null ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#monthly-purchase-table"
                  isActive={pageNumber === currentPage}
                  aria-label={`Página ${pageNumber}`}
                  onClick={(event) => {
                    event.preventDefault()
                    onPageChange(pageNumber)
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          {currentPage < pageCount ? (
            <PaginationItem>
              <PaginationNext
                href="#monthly-purchase-table"
                text="Siguiente"
                aria-label="Página siguiente"
                onClick={(event) => {
                  event.preventDefault()
                  onPageChange(currentPage + 1)
                }}
              />
            </PaginationItem>
          ) : null}
        </PaginationContent>
      </Pagination>
    </div>
  )
}

function visiblePages(currentPage: number, pageCount: number) {
  if (pageCount <= 5)
    return Array.from({ length: pageCount }, (_, index) => index + 1)

  const pages = new Set([
    1,
    pageCount,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ])
  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((first, second) => first - second)

  return sortedPages.flatMap((page, index) =>
    index > 0 && page - sortedPages[index - 1] > 1 ? [null, page] : [page],
  )
}
