import { AlertTriangleIcon, CalendarDaysIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  formatCurrency,
  formatDate,
  formatDateOnly,
  statusLabel,
} from '@/lib/odc'
import type { Odc } from '@/lib/odc'
import { cn } from '@/lib/utils'
import { OdcStatusBadge, statusStyles } from './odc-status-badge'
import { OdcDocumentPreview } from './odc-document-preview'

function DefinitionRow({
  label,
  value,
  numeric = false,
  total = false,
  full = false,
  section = false,
}: {
  label: string
  value: string
  numeric?: boolean
  total?: boolean
  full?: boolean
  section?: boolean
}) {
  return (
    <div
      data-detail-row
      data-detail-section={section || undefined}
      className={cn(
        'grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-start gap-3 border-b border-border py-3',
        full && 'col-span-full',
        section && 'border-t pt-4',
        total && 'col-span-full mt-1 border-t-2 border-b-0 pt-4',
      )}
    >
      <dt className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          'min-w-0 break-words text-right font-medium',
          numeric && 'tabular-nums',
          total && 'text-xl font-semibold tabular-nums',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

export function OdcDetail({
  odc,
  actions,
}: {
  odc: Odc
  actions?: React.ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div data-detail-main className="min-w-0 space-y-5">
        {odc.status === 'RECHAZADA' && odc.rejectionReason ? (
          <div
            data-rejection-banner
            className="flex gap-3 rounded-card border border-destructive/20 bg-destructive/3 p-4 text-destructive"
          >
            <AlertTriangleIcon
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="font-medium">Esta orden necesita correcciones</p>
              <p className="mt-1 text-sm">{odc.rejectionReason}</p>
            </div>
          </div>
        ) : null}

        <Card>
          <CardHeader className="border-b border-border/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-medium">{odc.odcNumber}</h1>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <CalendarDaysIcon className="size-4" aria-hidden="true" />
                  Creada {formatDate(odc.createdAt)}
                </CardDescription>
              </div>
              <OdcStatusBadge status={odc.status} className="h-7 px-3" />
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              <DefinitionRow label="Descripción" value={odc.description} />
              <DefinitionRow label="Proveedor" value={odc.supplier} />
              <DefinitionRow
                label="Cantidad"
                value={`${odc.quantity} ${odc.unit}`}
                numeric
              />
              <DefinitionRow
                label="Precio unitario"
                value={formatCurrency(odc.unitPriceCents)}
                numeric
              />
              <DefinitionRow
                label="Última actualización"
                value={formatDate(odc.updatedAt)}
              />
              {odc.comments ? (
                <DefinitionRow
                  label="Comentarios"
                  value={odc.comments}
                  full
                  section
                />
              ) : null}
              <DefinitionRow
                label="Total"
                value={formatCurrency(odc.totalCents)}
                numeric
                total
              />
            </dl>
            {odc.hasPaymentEvidence || odc.hasInvoice ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {odc.hasPaymentEvidence ? (
                  <OdcDocumentPreview
                    odcId={odc.id ?? ''}
                    kind="evidence"
                    label="Comprobante de pago"
                  />
                ) : null}
                {odc.hasInvoice ? (
                  <OdcDocumentPreview
                    odcId={odc.id ?? ''}
                    kind="invoice"
                    label="Factura"
                  />
                ) : null}
              </div>
            ) : null}
            {odc.paymentDate || odc.paymentMethod ? (
              <section data-detail-section className="mt-4 border-t pt-4">
                <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  Información de pago
                </p>
                <dl className="mt-2 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  <DefinitionRow
                    label="Fecha de pago"
                    value={formatDateOnly(odc.paymentDate)}
                  />
                  <DefinitionRow
                    label="Método de pago"
                    value={odc.paymentMethod ?? 'Pendiente'}
                  />
                  {odc.paymentReference ? (
                    <DefinitionRow
                      label="Referencia de pago"
                      value={odc.paymentReference}
                    />
                  ) : null}
                  {odc.paymentNotes ? (
                    <DefinitionRow
                      label="Notas de pago"
                      value={odc.paymentNotes}
                    />
                  ) : null}
                </dl>
              </section>
            ) : null}
            {odc.invoiceNumber ||
            odc.invoiceDate ||
            odc.warehouseEntryDate ||
            odc.observations ? (
              <section data-detail-section className="mt-4 border-t pt-4">
                <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  Información de factura
                </p>
                <dl className="mt-2 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  {odc.invoiceNumber ? (
                    <DefinitionRow
                      label="Número de factura"
                      value={odc.invoiceNumber}
                    />
                  ) : null}
                  <DefinitionRow
                    label="Fecha de factura"
                    value={formatDateOnly(odc.invoiceDate)}
                  />
                  <DefinitionRow
                    label="Fecha de entrada a almacén"
                    value={formatDateOnly(odc.warehouseEntryDate)}
                  />
                  {odc.observations ? (
                    <DefinitionRow
                      label="Observaciones"
                      value={odc.observations}
                    />
                  ) : null}
                </dl>
              </section>
            ) : null}
          </CardContent>
        </Card>
        {actions}
      </div>

      <Card className="xl:sticky xl:top-6 xl:self-start">
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>Seguimiento de la orden</CardDescription>
        </CardHeader>
        <CardContent>
          {odc.history.length === 0 ? (
            <p className="rounded-card border border-dashed p-4 text-sm text-muted-foreground">
              Todavía no hay movimientos registrados.
            </p>
          ) : (
            <ol data-testid="odc-history" className="space-y-0">
              {odc.history.map((entry, index) => (
                <li
                  key={entry.id ?? `${entry.toStatus}-${index}`}
                  className="relative grid grid-cols-[1rem_1fr] gap-3 pb-4 last:pb-0"
                >
                  {index < odc.history.length - 1 ? (
                    <span className="absolute top-3 bottom-0 left-[0.3125rem] w-px bg-border" />
                  ) : null}
                  <span
                    data-timeline-point
                    className={cn(
                      'relative mt-1 size-2.5 rounded-full border',
                      statusStyles[entry.toStatus].point,
                      index === odc.history.length - 1
                        ? 'ring-4 ring-background'
                        : 'border-[1.5px] bg-background',
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {entry.fromStatus
                        ? `${statusLabel(entry.fromStatus)} → ${statusLabel(entry.toStatus)}`
                        : statusLabel(entry.toStatus)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </p>
                    {entry.note ? (
                      <p className="mt-2 border-l-2 border-border pl-3 text-sm">
                        {entry.note}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
