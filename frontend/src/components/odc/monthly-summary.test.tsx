import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as RouterModule from '@tanstack/react-router'
import { formatCurrency } from '@/lib/odc'
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

describe('ui-surfaces-monthly-summary', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/monthly-summary')
    getMonthlyPurchaseSummary.mockResolvedValue(summary)
    exportMonthlySummarySlide.mockResolvedValue(undefined)
  })

  describe('R1: compact layout and header', () => {
    it('uses the approved width, padding and title hierarchy', async () => {
      render(<MonthlySummary initialSummary={summary} />)

      await screen.findByTestId('monthly-summary-results')
      const heading = screen.getByRole('heading', {
        name: 'Compras que sí se realizaron',
      })
      const main = heading.closest('main')
      const header = heading.closest('header')

      expect(main?.className).toContain('p-4 sm:p-6')
      expect(main?.className).not.toContain('lg:p-8')
      expect(main?.firstElementChild?.className).toContain('max-w-[1400px]')
      expect(heading.className).toContain('text-2xl')
      expect(heading.className).not.toMatch(/text-3xl|sm:text-4xl/)
      expect(
        screen.queryByText('Un corte mensual listo para revisar y compartir.'),
      ).toBeNull()
      expect(
        within(header!).getByText('Operaciones / Seguimiento mensual'),
      ).toBeTruthy()
      expect(within(header!).getByLabelText('Mes de pago')).toBeTruthy()
      expect(
        within(header!).getByRole('button', { name: 'Imagen' }),
      ).toBeTruthy()
      expect(within(header!).getByRole('button', { name: 'PDF' })).toBeTruthy()
    })
  })

  describe('R2: the monthly total is the only display-sized metric', () => {
    it('uses the approved emphasis and preserves the supporting metrics', async () => {
      const summaryWithoutWarehouseData = {
        ...summary,
        averageWarehouseDays: null,
      }
      getMonthlyPurchaseSummary.mockResolvedValue(summaryWithoutWarehouseData)
      render(<MonthlySummary initialSummary={summaryWithoutWarehouseData} />)

      const results = await screen.findByTestId('monthly-summary-results')
      const total = within(results).getByText(
        formatCurrency(summary.totalCents),
      )

      expect(total.className).toContain('mt-3')
      expect(total.className).toContain('text-3xl')
      expect(total.className).toContain('font-semibold')
      expect(total.className).toContain('tabular-nums')
      expect(results.querySelectorAll('[class~="text-3xl"]')).toHaveLength(1)
      expect(within(results).getByText('Compras registradas')).toBeTruthy()
      expect(within(results).getByText('Ticket promedio')).toBeTruthy()
      expect(within(results).getByText('Ingreso a almacén')).toBeTruthy()
      expect(within(results).getByText('Sin datos')).toBeTruthy()
    })
  })

  describe('R3: stage distribution uses accessible horizontal bars', () => {
    it('sorts by count, uses status tokens and keeps every value visible', async () => {
      render(<MonthlySummary initialSummary={summary} />)

      await screen.findByTestId('monthly-summary-results')
      const card = screen
        .getByText('En qué etapa están')
        .closest('[data-slot="card"]')!
      const badges = [...card.querySelectorAll('[data-status]')]

      expect(badges.map((badge) => badge.getAttribute('data-status'))).toEqual([
        'PAGO_REGISTRADO',
        'COMPLETADA',
        'EVIDENCIA_PAGO_SUBIDA',
      ])

      const expected = [
        ['bg-status-paid', '100%'],
        ['bg-status-done', '100%'],
        ['bg-status-evidence', '0%'],
      ] as const
      badges.forEach((badge, index) => {
        const row = badge.closest('li')!
        const fill = row.querySelector(
          '[aria-hidden="true"] > div',
        ) as HTMLElement
        expect(row.textContent).toContain(index === 2 ? '0' : '1')
        expect(row.textContent).toContain(
          formatCurrency(index === 0 ? 7_500 : index === 1 ? 12_500 : 0),
        )
        expect(fill.className).toContain(expected[index][0])
        expect(fill.style.width).toBe(expected[index][1])
      })
    })

    it('renders zero-width bars without NaN when every stage is empty', async () => {
      const emptyStages = summary.stages.map((stage) => ({
        ...stage,
        count: 0,
        totalCents: 0,
      }))
      const summaryWithEmptyStages = { ...summary, stages: emptyStages }
      getMonthlyPurchaseSummary.mockResolvedValue(summaryWithEmptyStages)
      render(<MonthlySummary initialSummary={summaryWithEmptyStages} />)

      await screen.findByTestId('monthly-summary-results')
      const card = screen
        .getByText('En qué etapa están')
        .closest('[data-slot="card"]')!
      const fills = card.querySelectorAll('[aria-hidden="true"] > div')

      expect(fills).toHaveLength(3)
      for (const fill of fills) {
        expect((fill as HTMLElement).style.width).toBe('0%')
        expect((fill as HTMLElement).style.width).not.toContain('NaN')
      }
    })
  })

  describe('R4: detail headers use the system label tracking', () => {
    it('keeps the semantic table and removes poster tracking', async () => {
      render(<MonthlySummary initialSummary={summary} />)

      const table = await screen.findByTestId('monthly-summary-detail')
      const headers = within(table).getAllByRole('columnheader')

      expect(headers).toHaveLength(6)
      for (const header of headers) {
        expect(header.className).toContain('tracking-[0.06em]')
        expect(header.className).not.toContain('tracking-[0.12em]')
      }
      expect(table.querySelector('thead > tr')).toBeTruthy()
      expect(table.querySelector('tbody > tr')).toBeTruthy()
      expect(
        within(table).getByRole('link', { name: 'ODC-2026-00001' }).className,
      ).toContain('focus-visible:ring-3')
    })
  })

  describe('R5: empty state uses semantic shape and copy', () => {
    it('keeps the dashed actionable state with the card radius', async () => {
      const emptySummary = { ...summary, purchaseCount: 0, purchases: [] }
      getMonthlyPurchaseSummary.mockResolvedValue(emptySummary)
      render(<MonthlySummary initialSummary={emptySummary} />)

      const emptyState = await screen.findByText(
        'No hay compras con pago registrado en julio de 2026.',
      )

      expect(emptyState.className).toContain('rounded-card')
      expect(emptyState.className).toContain('border-dashed')
      expect(emptyState.className).not.toMatch(/rounded-xl|rounded-2xl/)
    })
  })

  describe('R7: existing loading and result contracts remain accessible', () => {
    it('preserves busy, reduced-motion, live-region and result hooks', async () => {
      let resolveSummary!: (value: typeof summary) => void
      getMonthlyPurchaseSummary.mockReturnValue(
        new Promise((resolve) => {
          resolveSummary = resolve
        }),
      )
      render(<MonthlySummary initialSummary={summary} />)

      const section = screen.getByRole('region', { name: 'Resumen mensual' })
      await waitFor(() =>
        expect(section.getAttribute('aria-busy')).toBe('true'),
      )
      expect(
        section.querySelector('[class*="motion-reduce:animate-none"]'),
      ).toBeTruthy()
      expect(
        screen.getByText('Actualizando el resumen de julio de 2026.'),
      ).toBeTruthy()

      resolveSummary(summary)
      const results = await screen.findByTestId('monthly-summary-results')
      expect(results.className).toContain('odc-filter-results')
      expect(section.getAttribute('aria-busy')).toBe('false')
      expect(screen.getByTestId('monthly-summary-detail')).toBeTruthy()
    })
  })
})
