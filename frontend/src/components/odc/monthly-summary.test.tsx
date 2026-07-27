import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MonthlySummary } from './monthly-summary'

const { getMonthlyPurchaseSummary, exportMonthlySummarySlide } = vi.hoisted(
  () => ({
    getMonthlyPurchaseSummary: vi.fn(),
    exportMonthlySummarySlide: vi.fn(),
  }),
)

vi.mock('@/lib/api', () => ({ getMonthlyPurchaseSummary }))
vi.mock('@/lib/monthly-summary-export', () => ({ exportMonthlySummarySlide }))

const summary = {
  month: '2026-07',
  totalCents: 20_000,
  purchaseCount: 2,
  averageTicketCents: 10_000,
  averageWarehouseDays: 3,
  stages: [
    { status: 'PAGO_REGISTRADO' as const, count: 1, totalCents: 7_500 },
    { status: 'EVIDENCIA_PAGO_SUBIDA' as const, count: 0, totalCents: 0 },
    { status: 'COMPLETADA' as const, count: 1, totalCents: 12_500 },
  ],
  purchases: [
    {
      id: 'o1',
      odcNumber: 'ODC-2026-00001',
      status: 'COMPLETADA' as const,
      requesterName: 'Rodrigo Espinosa',
      description: 'Sensores GPS',
      supplier: 'Suntech',
      quantity: 2,
      unit: 'pieza',
      totalCents: 12_500,
      paymentDate: '2026-07-10',
      warehouseEntryDate: '2026-07-13',
      hasInvoice: true,
      comments: null,
      observations: null,
    },
  ],
}

describe('R3,R5,R6,R7,R8,R9: monthly operations summary', () => {
  beforeEach(() => {
    getMonthlyPurchaseSummary.mockResolvedValue(summary)
    exportMonthlySummarySlide.mockResolvedValue(undefined)
  })

  it('shows executive KPIs and auditable purchase detail with shadcn table semantics', async () => {
    render(<MonthlySummary initialSummary={summary} />)

    await waitFor(() =>
      expect(screen.getByText('Detalle del periodo')).toBeTruthy(),
    )
    expect(
      screen.getByRole('heading', { name: 'Compras que sí se realizaron' }),
    ).toBeTruthy()
    expect(screen.getAllByText('ODC-2026-00001')).toHaveLength(2)
    expect(screen.getAllByText('Suntech')).toHaveLength(2)
    expect(screen.getByText(/Rodrigo Espinosa/)).toBeTruthy()
    expect(document.querySelector('[data-slot="table"]')).toBeTruthy()
    expect(screen.getByText('Ingreso a almacén')).toBeTruthy()
  })

  it('loads the selected month and exports the same report as image or PDF', async () => {
    render(<MonthlySummary initialSummary={summary} />)
    fireEvent.change(screen.getByLabelText('Mes de pago'), {
      target: { value: '2026-08' },
    })
    await waitFor(() =>
      expect(getMonthlyPurchaseSummary).toHaveBeenCalledWith('2026-08'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Imagen' }))
    await waitFor(() =>
      expect(exportMonthlySummarySlide).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        '2026-07',
        'png',
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'PDF' }))
    await waitFor(() =>
      expect(exportMonthlySummarySlide).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        '2026-07',
        'pdf',
      ),
    )
  })

  it('communicates an API failure and preserves an accessible recovery state', async () => {
    getMonthlyPurchaseSummary.mockRejectedValueOnce(new Error('offline'))
    render(<MonthlySummary initialSummary={summary} />)

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'No pudimos obtener el resumen de este mes',
      ),
    )
  })
})
