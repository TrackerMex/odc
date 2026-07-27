import { formatCurrency, formatMonth, formatDateOnly } from '@/lib/odc'
import type { MonthlyPurchaseSummary } from '@/lib/odc'

export function MonthlySummarySlide({
  summary,
}: {
  summary: MonthlyPurchaseSummary
}) {
  return (
    <section className="w-[1120px] bg-white p-10 font-sans text-slate-950">
      <header className="flex items-end justify-between border-b-2 border-slate-900 pb-6">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] uppercase text-slate-500">
            Operaciones · Control mensual
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Compras de {formatMonth(summary.month)}
          </h1>
        </div>
        <p className="text-right text-sm text-slate-600">
          Preparado para Dirección General y Administración
        </p>
      </header>

      <div className="mt-7 grid grid-cols-[1.5fr_1fr_1fr] gap-5">
        <div className="border-b-4 border-slate-900 pb-4">
          <p className="text-sm text-slate-600">Total de compras</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight">
            {formatCurrency(summary.totalCents)}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Compras registradas</p>
          <p className="mt-1 text-3xl font-semibold">{summary.purchaseCount}</p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Ticket promedio</p>
          <p className="mt-1 text-3xl font-semibold">
            {formatCurrency(summary.averageTicketCents)}
          </p>
        </div>
      </div>

      <table className="mt-8 w-full border-collapse text-left text-sm">
        <thead className="border-y border-slate-300 text-xs tracking-[0.08em] uppercase text-slate-600">
          <tr>
            <th className="py-3">ODC</th>
            <th className="py-3">Pago</th>
            <th className="py-3">Descripción / proveedor</th>
            <th className="py-3">Almacén</th>
            <th className="py-3">Factura</th>
            <th className="py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {summary.purchases.map((purchase) => (
            <tr key={purchase.id} className="border-b border-slate-200">
              <td className="py-3 font-medium">{purchase.odcNumber}</td>
              <td className="py-3">{formatDateOnly(purchase.paymentDate)}</td>
              <td className="py-3">
                <p>{purchase.description}</p>
                <p className="text-xs text-slate-500">{purchase.supplier}</p>
              </td>
              <td className="py-3">
                {formatDateOnly(purchase.warehouseEntryDate)}
              </td>
              <td className="py-3">
                {purchase.hasInvoice ? 'Sí' : 'Pendiente'}
              </td>
              <td className="py-3 text-right font-medium">
                {formatCurrency(purchase.totalCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
