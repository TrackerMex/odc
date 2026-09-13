import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { ExecutiveAnalytics } from './executive-analytics'
import type * as RouterModule from '@tanstack/react-router'
import { ExecutiveDashboard } from './executive-dashboard'
import { ExecutiveTasks } from './executive-tasks'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return {
    ...actual,
    Link: ({ children, to, params, search, ...props }: any) => (
      <a
        href={`${params?.id ? `/odcs/${params.id}` : to}${search ? `?${new URLSearchParams(search)}` : ''}`}
        {...props}
      >
        {children}
      </a>
    ),
  }
})

const items = Array.from({ length: 10 }, (_, index) => ({
  id: `order-${index}`,
  odcNumber: `ODC-2026-${index}`,
  status: 'PENDIENTE_ADMIN' as const,
  description: `Material ${index}`,
  supplier: 'ACME',
  totalCents: 10000,
  createdAt: '2026-09-15T12:00:00Z',
  ageDays: 3,
  nextAction: 'VALIDAR_PRESUPUESTO' as const,
}))
const dashboard = {
  month: '2026-09',
  role: 'ADMINISTRACION' as const,
  priority: { items, page: 2, pageSize: 10, total: 25 },
  actionableTotal: 86,
  createdOrders: 43,
  monthlyTrend: Array.from({ length: 12 }, (_, i) => ({
    month: `2026-${String(i + 1).padStart(2, '0')}`,
    purchaseCount: i,
    totalCents: i * 10000,
  })),
  statusDistribution: [{ status: 'PENDIENTE_ADMIN' as const, count: 43 }],
  pulse: {
    current: { purchaseCount: 2, totalCents: 50000 },
    previous: { month: '2026-08', purchaseCount: 1, totalCents: 25000 },
    purchaseCountChangePercent: 100,
    totalCentsChangePercent: 100,
  },
  oldestActiveOrders: [],
  topSuppliers: [],
}

describe('executive-workspace-v2 R3,R4,R6,R7,R8,R9,R10: working analytical dashboard', () => {
  it('executive-workspace-v2 R14: renders every chart title on the server before hydration', () => {
    const document = new DOMParser().parseFromString(
      renderToString(<ExecutiveAnalytics dashboard={dashboard} />),
      'text/html',
    )
    const titles = [...document.querySelectorAll('svg circle title')]
    expect(titles).toHaveLength(12)
    expect(titles[0].textContent).toBe('enero de 2026: $0.00')
    expect(titles.every((title) => title.textContent!.length > 0)).toBe(true)
  })
  it('renders all ten rows, filtered pagination and complete independent indicators', () => {
    render(<ExecutiveDashboard userName="Ana" dashboard={dashboard} />)
    const table = screen.getByRole('table', { name: 'Tareas prioritarias' })
    expect(within(table).getAllByRole('row')).toHaveLength(11)
    expect(screen.getByText('Mostrando 11–20 de 25')).toBeTruthy()
    expect(screen.getByText('Página 2 de 3')).toBeTruthy()
    const metrics = screen.getByRole('region', { name: 'Pulso operativo' })
    expect(within(metrics).getByText('86')).toBeTruthy()
    expect(within(metrics).getByText('43')).toBeTruthy()
    expect(
      screen.getByText(
        'Los filtros de esta tabla no cambian las estadísticas.',
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('img', { name: /Compras pagadas por mes/ }),
    ).toBeTruthy()
    expect(
      screen.getByRole('region', { name: /Estado actual de las ODC creadas/ }),
    ).toBeTruthy()
  })

  it('submits literal search once and resets pagination while retaining the selected statistical month', () => {
    const onQueryChange = vi.fn()
    render(
      <ExecutiveDashboard
        {...{
          userName: 'Ana',
          dashboard,
          query: { month: '2026-09', page: 2 },
          onQueryChange,
        }}
      />,
    )
    const search = screen.getByRole('textbox', {
      name: 'Buscar por folio o proveedor',
    })
    fireEvent.change(search, { target: { value: '  ACME  ' } })
    expect(onQueryChange).not.toHaveBeenCalled()
    fireEvent.submit(search.closest('form')!)
    expect(onQueryChange).toHaveBeenCalledWith(
      expect.objectContaining({ month: '2026-09', q: 'ACME', page: 1 }),
    )
  })

  it('navigates a page with every active filter and clears only table filters', () => {
    const onQueryChange = vi.fn()
    render(
      <ExecutiveDashboard
        {...{
          userName: 'Ana',
          dashboard,
          query: {
            month: '2026-09',
            page: 2,
            q: 'ACME',
            status: 'PENDIENTE_ADMIN',
            order: 'oldest',
          },
          onQueryChange,
        }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(onQueryChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        month: '2026-09',
        page: 3,
        q: 'ACME',
        status: 'PENDIENTE_ADMIN',
        order: 'oldest',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(onQueryChange).toHaveBeenLastCalledWith({
      month: '2026-09',
      page: 1,
    })
  })

  it('exposes every trend value as a text table and offers old work even with an empty priority page', () => {
    render(
      <ExecutiveDashboard
        userName="Ana"
        dashboard={{
          ...dashboard,
          priority: { ...dashboard.priority, total: 0, items: [] },
        }}
      />,
    )
    fireEvent.click(screen.getByText('Ver datos de la gráfica'))
    expect(
      within(
        screen.getByRole('table', { name: 'Importes pagados por mes' }),
      ).getAllByRole('row'),
    ).toHaveLength(13)
    expect(
      screen
        .getByRole('link', { name: 'Ver pendientes de todos los meses' })
        .getAttribute('href'),
    ).toContain('month=all')
  })
})

describe('executive-workspace-v2 R2,R4: monthly task inbox', () => {
  it('shows creation month and navigates historical and all-month selections', () => {
    const onQueryChange = vi.fn()
    render(
      <ExecutiveTasks
        {...{
          initialPage: { ...dashboard.priority, month: '2026-09' },
          role: 'ADMINISTRACION' as const,
          query: { month: '2026-09', page: 2 },
          onQueryChange,
        }}
      />,
    )
    fireEvent.change(screen.getByLabelText('Mes de creación'), {
      target: { value: '2025-12' },
    })
    expect(onQueryChange).toHaveBeenLastCalledWith({
      month: '2025-12',
      page: 1,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Todos los meses' }))
    expect(onQueryChange).toHaveBeenLastCalledWith({ month: 'all', page: 1 })
    expect(
      screen.getByRole('table', { name: 'Tareas accionables' }),
    ).toBeTruthy()
  })

  it('allows recovery from an out-of-range page without misleading result bounds', () => {
    const onQueryChange = vi.fn()
    render(
      <ExecutiveTasks
        {...{
          initialPage: {
            items: [],
            page: 9,
            pageSize: 10,
            total: 12,
            month: '2026-09',
          },
          role: 'ADMINISTRACION' as const,
          query: { month: '2026-09', page: 9 },
          onQueryChange,
        }}
      />,
    )
    expect(screen.queryByText(/Mostrando 81/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Volver a página 1' }))
    expect(onQueryChange).toHaveBeenCalledWith({ month: '2026-09', page: 1 })
  })
})
