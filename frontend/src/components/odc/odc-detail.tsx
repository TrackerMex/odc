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
import { OdcStatusBadge } from './odc-status-badge'

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted/60 p-4">
      <dt className="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 break-words font-medium">{value}</dd>
    </div>
  )
}

export function OdcDetail({ odc }: { odc: Odc }) {
  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        {odc.status === 'RECHAZADA' && odc.rejectionReason ? (
          <div className="flex gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
            <AlertTriangleIcon
              className="mt-0.5 size-5 shrink-0"
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
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Descripción" value={odc.description} />
              <DetailItem label="Proveedor" value={odc.supplier} />
              <DetailItem
                label="Cantidad"
                value={`${odc.quantity} ${odc.unit}`}
              />
              <DetailItem
                label="Precio unitario"
                value={formatCurrency(odc.unitPriceCents)}
              />
              <DetailItem
                label="Total"
                value={formatCurrency(odc.totalCents)}
              />
              <DetailItem
                label="Última actualización"
                value={formatDate(odc.updatedAt)}
              />
            </dl>
            {odc.comments ? (
              <div className="mt-4 rounded-2xl border p-4">
                <p className="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
                  Comentarios
                </p>
                <p className="mt-2 text-sm leading-relaxed">{odc.comments}</p>
              </div>
            ) : null}
            {odc.paymentDate || odc.paymentMethod ? (
              <div className="mt-4 rounded-2xl border p-4">
                <p className="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
                  Información de pago
                </p>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DetailItem
                    label="Fecha de pago"
                    value={formatDateOnly(odc.paymentDate)}
                  />
                  <DetailItem
                    label="Método de pago"
                    value={odc.paymentMethod ?? 'Pendiente'}
                  />
                  {odc.paymentReference ? (
                    <DetailItem
                      label="Referencia de pago"
                      value={odc.paymentReference}
                    />
                  ) : null}
                  {odc.paymentNotes ? (
                    <DetailItem
                      label="Notas de pago"
                      value={odc.paymentNotes}
                    />
                  ) : null}
                </dl>
              </div>
            ) : null}
            {odc.invoiceNumber ||
            odc.invoiceDate ||
            odc.warehouseEntryDate ||
            odc.observations ? (
              <div className="mt-4 rounded-2xl border p-4">
                <p className="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
                  Información de factura
                </p>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  {odc.invoiceNumber ? (
                    <DetailItem
                      label="Número de factura"
                      value={odc.invoiceNumber}
                    />
                  ) : null}
                  <DetailItem
                    label="Fecha de factura"
                    value={formatDateOnly(odc.invoiceDate)}
                  />
                  <DetailItem
                    label="Fecha de entrada a almacén"
                    value={formatDateOnly(odc.warehouseEntryDate)}
                  />
                  {odc.observations ? (
                    <DetailItem
                      label="Observaciones"
                      value={odc.observations}
                    />
                  ) : null}
                </dl>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="xl:sticky xl:top-6 xl:self-start">
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>Seguimiento de la orden</CardDescription>
        </CardHeader>
        <CardContent>
          {odc.history.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
              Todavía no hay movimientos registrados.
            </p>
          ) : (
            <ol data-testid="odc-history" className="space-y-0">
              {odc.history.map((entry, index) => (
                <li
                  key={entry.id ?? `${entry.toStatus}-${index}`}
                  className="relative grid grid-cols-[1rem_1fr] gap-3 pb-5 last:pb-0"
                >
                  {index < odc.history.length - 1 ? (
                    <span className="absolute top-3 bottom-0 left-[0.3125rem] w-px bg-border" />
                  ) : null}
                  <span className="relative mt-1 size-2.5 rounded-full bg-foreground ring-4 ring-background" />
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
                      <p className="mt-2 rounded-xl bg-muted px-3 py-2 text-sm">
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
