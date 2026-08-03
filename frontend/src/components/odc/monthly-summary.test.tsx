import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as RouterModule from '@tanstack/react-router'
import { MonthlySummary } from './monthly-summary'

const { getMonthlyPurchaseSummary, exportMonthlySummarySlide } = vi.hoisted(
  () => ({
    getMonthlyPurchaseSummary: vi.fn(),
    exportMonthlySummarySlide: vi.fn(),
  }),
)

vi.mock('@/lib/api', () => ({ getMonthlyPurchaseSummary }))
vi.mock('@/lib/monthly-summary-export', () => ({ exportMonthlySummarySlide }))
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return {
    ...actual,
    Link: ({ children, params, ...props }: any) => (
      <a href={`/odcs/${params.id}`} {...props}>
        {children}
      </a>
    ),
  }
})

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

function summaryWithPurchases(month: string, count: number) {
  return {
    ...summary,
    month,
    purchaseCount: count,
    purchases: Array.from({ length: count }, (_, index) => ({
      ...summary.purchases[0],
      id: `o${index + 1}`,
      odcNumber: `ODC-2026-${String(index + 1).padStart(5, '0')}`,
      description: `Compra ${index + 1}`,
    })),
  }
}

describe('R3,R5,R6,R7,R8,R9: monthly operations summary', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/monthly-summary')
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

  it('R5: links a completed ODC to its detail without changing the export slide', async () => {
    render(<MonthlySummary initialSummary={summary} />)

    const detailTable = await screen.findByTestId('monthly-summary-detail')
    const detailLink = within(detailTable).getByRole('link', {
      name: 'ODC-2026-00001',
    })
    expect(detailLink.getAttribute('href')).toBe('/odcs/o1')

    const exportedSlide = screen
      .getAllByText('ODC-2026-00001')
      .find((element) => element.closest('[aria-hidden="true"]'))
    expect(exportedSlide?.closest('a')).toBeNull()
  })

  it('R5: restores the selected month and page from the URL', async () => {
    const julySummary = summaryWithPurchases('2026-07', 12)
    window.history.replaceState({}, '', '/monthly-summary?month=2026-07&page=2')
    getMonthlyPurchaseSummary.mockResolvedValue(julySummary)

    render(
      <MonthlySummary initialSummary={summaryWithPurchases('2026-06', 1)} />,
    )

    await waitFor(() =>
      expect(screen.getByText('Mostrando 11–12 de 12 compras')).toBeTruthy(),
    )
    expect(window.location.search).toContain('month=2026-07')
    expect(window.location.search).toContain('page=2')
  })

  it('loads the selected month and exports the same report as image or PDF', async () => {
    getMonthlyPurchaseSummary.mockImplementation((month: string) =>
      Promise.resolve(month === '2026-08' ? { ...summary, month } : summary),
    )
    render(<MonthlySummary initialSummary={summary} />)

    await waitFor(() =>
      expect(screen.getByTestId('monthly-summary-results').className).toContain(
        'odc-filter-results',
      ),
    )

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
        '2026-08',
        'png',
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'PDF' }))
    await waitFor(() =>
      expect(exportMonthlySummarySlide).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        '2026-08',
        'pdf',
      ),
    )
  })

  it('R5,R7,R8: paginates the detail, resets for a new month, and exports the complete current summary', async () => {
    const julySummary = summaryWithPurchases('2026-07', 12)
    const augustSummary = summaryWithPurchases('2026-08', 2)
    getMonthlyPurchaseSummary.mockImplementation((month: string) =>
      Promise.resolve(month === '2026-08' ? augustSummary : julySummary),
    )

    render(<MonthlySummary initialSummary={julySummary} />)

    await waitFor(() =>
      expect(screen.getByText('Mostrando 1–10 de 12 compras')).toBeTruthy(),
    )
    expect(
      within(screen.getByTestId('monthly-summary-detail')).queryByText(
        'Compra 11',
      ),
    ).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(screen.getByText('Mostrando 11–12 de 12 compras')).toBeTruthy()
    expect(
      within(screen.getByTestId('monthly-summary-detail')).getByText(
        'Compra 11',
      ),
    ).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Mes de pago'), {
      target: { value: '2026-08' },
    })
    await waitFor(() =>
      expect(
        within(screen.getByTestId('monthly-summary-detail')).getByText(
          'Compra 1',
        ),
      ).toBeTruthy(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Imagen' }))
    await waitFor(() =>
      expect(exportMonthlySummarySlide).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        '2026-08',
        'png',
      ),
    )
    const exportedElement = exportMonthlySummarySlide.mock.calls.at(-1)?.[0]
    expect(exportedElement.textContent).toContain('Compra 1')
    expect(exportedElement.textContent).toContain('Compra 2')
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
