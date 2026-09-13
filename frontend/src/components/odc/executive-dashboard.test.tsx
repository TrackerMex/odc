import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type * as RouterModule from '@tanstack/react-router'
import type { ExecutiveDashboardResponse } from '@/lib/odc'
import {
  ExecutiveDashboard,
  ExecutiveDashboardError,
  ExecutiveDashboardLoading,
} from './executive-dashboard'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return {
    ...actual,
    Link: ({ children, to, params, ...props }: any) => (
      <a href={params?.id ? `/odcs/${params.id}` : to} {...props}>
        {children}
      </a>
    ),
  }
})

const dashboard: ExecutiveDashboardResponse = {
  month: '2026-07',
  role: 'DIRECTOR_OPS',
  priority: {
    total: 6,
    items: [
      {
        id: 'draft-1',
        odcNumber: 'ODC-2026-00001',
        status: 'BORRADOR',
        description: 'Sensores para almacén',
        supplier: 'Suntech',
        totalCents: 250_000,
        createdAt: '2026-07-01T00:00:00.000Z',
        ageDays: 26,
        nextAction: 'EDITAR_Y_REENVIAR',
      },
      {
        id: 'purchase-1',
        odcNumber: 'ODC-2026-00002',
        status: 'COMPRA_APROBADA',
        description: 'Mantenimiento preventivo',
        supplier: 'Servicios Norte',
        totalCents: 112_500,
        createdAt: '2026-07-12T00:00:00.000Z',
        ageDays: 15,
        nextAction: 'REGISTRAR_PAGO',
      },
      {
        id: 'invoice-1',
        odcNumber: 'ODC-2026-00003',
        status: 'EVIDENCIA_PAGO_SUBIDA',
        description: 'Refacciones',
        supplier: 'Refacciones del Centro',
        totalCents: 85_000,
        createdAt: '2026-07-15T00:00:00.000Z',
        ageDays: 12,
        nextAction: 'COMPLETAR_FACTURA',
      },
    ],
  },
  pulse: {
    current: { purchaseCount: 8, totalCents: 750_000 },
    previous: { month: '2026-06', purchaseCount: 4, totalCents: 500_000 },
    purchaseCountChangePercent: 100,
    totalCentsChangePercent: 50,
  },
  oldestActiveOrders: [
    {
      id: 'active-1',
      odcNumber: 'ODC-2026-00004',
      status: 'PENDIENTE_ADMIN',
      description: 'Licencias',
      supplier: 'Software MX',
      totalCents: 30_000,
      createdAt: '2026-07-05T00:00:00.000Z',
      ageDays: 22,
    },
  ],
  topSuppliers: [
    { supplier: 'Suntech', purchaseCount: 3, totalCents: 320_000 },
  ],
}

describe('ui-surfaces-dashboards R3,R4: consola de trabajo densa, no landing', () => {
  it('usa el ancho y el padding de página en la superficie y en su estado de carga', () => {
    const { container } = render(
      <ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />,
    )
    const loading = render(<ExecutiveDashboardLoading />).container

    for (const root of [container, loading]) {
      const main = root.querySelector('main')!
      expect(main.className).toContain('min-w-0')
      expect(main.className).toContain('flex-1')
      expect(main.className).toContain('p-4')
      expect(main.className).toContain('sm:p-6')
      expect(main.className).not.toContain('lg:p-8')
      expect(root.querySelector('.max-w-\\[1400px\\]')).toBeTruthy()
      expect(root.querySelector('.max-w-7xl')).toBeNull()
    }
  })

  it('reduce el header a un escalón tipográfico y suelta el párrafo de rol', () => {
    render(<ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.className).toContain('text-2xl')
    expect(heading.className).not.toContain('text-3xl')
    expect(heading.className).not.toContain('sm:text-4xl')
    expect(screen.queryByText(/revisa lo que bloquea el flujo/i)).toBeNull()
    // El eyebrow de rol sobrevive: lo exige la aserción en riesgo de R12.
    expect(
      screen.getByRole('region', { name: /resumen ejecutivo/i }).textContent,
    ).toMatch(/operaciones/i)
  })
})

describe('ui-surfaces-dashboards R7,R8: la tarjeta heterogénea no miente con un color', () => {
  it('Prioridad inmediata se queda sin barra de acento', () => {
    render(<ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />)

    const header = screen
      .getByText('Prioridad inmediata')
      .closest('[data-slot="card-header"]')!
    expect(header.className).not.toMatch(/border-l-/)
  })

  it('su contador baja de escalón y se queda en el gris de metadatos', () => {
    render(<ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />)

    const counter = screen
      .getByText('Prioridad inmediata')
      .closest('[data-slot="card-header"]')!
      .querySelector('.tabular-nums')!
    expect(counter.className).toContain('text-xs')
    expect(counter.className).not.toContain('text-3xl')
    expect(counter.className).toContain('text-muted-foreground')
  })
})

describe('frontend-dashboard-template R4: filas semánticas con foco y contexto', () => {
  it('conserva foco y contenido dentro de una fila de tabla', () => {
    render(<ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />)

    const link = screen.getByRole('link', { name: /ODC-2026-00001/i })
    const row = link.closest('tr')!
    expect(row).toBeTruthy()
    expect(within(row).getByText(/Suntech/)).toBeTruthy()
    expect(link.className).toContain('focus-visible:ring-3')
    for (const node of [row, link]) {
      expect(node.className).not.toMatch(
        /hover:shadow|translate-y|scale-|cursor-pointer/,
      )
    }
  })
})

describe('R3: executive priority makes the oldest actionable work visible first', () => {
  it('renders task context, total overflow and detail links before secondary metrics', () => {
    render(<ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />)

    expect(
      screen.getByRole('region', { name: /prioridad inmediata/i }),
    ).toBeTruthy()
    expect(screen.getByText(/6 tareas requieren atención/i)).toBeTruthy()
    expect(screen.getByText(/Sensores para almacén/i)).toBeTruthy()
    expect(screen.getByText('26 días')).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: /ODC-2026-00001/i })
        .getAttribute('href'),
    ).toBe('/odcs/draft-1')
    expect(
      screen
        .getByRole('link', { name: /ver todas las tareas/i })
        .getAttribute('href'),
    ).toBe('/tasks')
    expect(screen.getByText(/Pulso operativo/i)).toBeTruthy()
  })

  it('uses the next action returned by the snapshot instead of inferring it from the status', () => {
    render(
      <ExecutiveDashboard
        userName="Ana Pérez"
        dashboard={{
          ...dashboard,
          priority: {
            total: 1,
            items: [
              {
                ...dashboard.priority.items[0],
                nextAction: 'COMPLETAR_FACTURA',
              },
            ],
          },
        }}
      />,
    )

    expect(
      screen.getByRole('link', { name: /completar factura/i }),
    ).toBeTruthy()
    expect(screen.queryByRole('link', { name: /reabrir y editar/i })).toBeNull()
  })
})

describe('R1: executive dashboard frames the current work context', () => {
  it('shows the role, current snapshot month and operations-only creation access in its header', () => {
    render(<ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />)

    const header = screen.getByRole('region', {
      name: /resumen ejecutivo/i,
    })
    expect(header.textContent).toMatch(/operaciones/i)
    expect(header.textContent).toMatch(/julio de 2026/i)
    expect(
      screen.getByRole('link', { name: /crear odc/i }).getAttribute('href'),
    ).toBe('/odcs/new')
  })
})

describe('R2: executive dashboard makes each priority task scannable', () => {
  it('labels the priority dimensions while retaining the task context and action', () => {
    render(<ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />)

    const queue = screen.getByRole('region', {
      name: /prioridad inmediata/i,
    })
    expect(queue.textContent).toMatch(/proveedor/i)
    expect(queue.textContent).toMatch(/antigüedad/i)
    expect(queue.textContent).toMatch(/importe/i)
    expect(queue.textContent).toMatch(/siguiente acción/i)
    expect(queue.textContent).toMatch(/Suntech/i)
    expect(queue.textContent).toContain('26 días')
  })
})

describe('R3: executive dashboard surfaces four real operating metrics', () => {
  it('renders priority, purchases, paid amount and oldest active work without a chart', () => {
    render(<ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />)

    const pulse = screen.getByRole('region', { name: /pulso operativo/i })
    expect(pulse.textContent).toContain('Tareas pendientes')
    expect(pulse.textContent).toContain('Compras pagadas')
    expect(pulse.textContent).toContain('Compras del periodo')
    expect(pulse.textContent).toContain('Mayor antigüedad')
    expect(pulse.textContent).toContain('22 días')
  })
})

describe('R4: operations sees only authorized workflow access from the priority queue', () => {
  it('shows creation, payment, invoice and editing access without unauthorized execution', () => {
    render(<ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />)

    expect(
      screen.getByRole('link', { name: /crear odc/i }).getAttribute('href'),
    ).toBe('/odcs/new')
    expect(
      screen
        .getByRole('link', { name: /reabrir y editar/i })
        .getAttribute('href'),
    ).toBe('/odcs/draft-1')
    expect(
      screen
        .getByRole('link', { name: /registrar pago/i })
        .getAttribute('href'),
    ).toBe('/odcs/purchase-1')
    expect(
      screen
        .getByRole('link', { name: /completar factura/i })
        .getAttribute('href'),
    ).toBe('/odcs/invoice-1')
  })

  it('keeps other roles in consultation mode without execution actions', () => {
    render(
      <ExecutiveDashboard
        userName="Luz Admin"
        dashboard={{ ...dashboard, role: 'ADMINISTRACION' }}
      />,
    )

    expect(screen.queryByRole('link', { name: /crear odc/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /registrar pago/i })).toBeNull()
    expect(
      screen.queryByRole('link', { name: /completar factura/i }),
    ).toBeNull()
  })
})

describe('R8: executive dashboard communicates loading and empty task states', () => {
  it('exposes an accessible loading state without simulated metrics', () => {
    render(<ExecutiveDashboardLoading />)

    expect(
      screen
        .getByLabelText(/cargando resumen ejecutivo/i)
        .getAttribute('aria-busy'),
    ).toBe('true')
    expect(screen.queryByText(/\$7,500/i)).toBeNull()
  })

  it('keeps global indicators visible when the role has no pending tasks', () => {
    render(
      <ExecutiveDashboard
        userName="Luz Admin"
        dashboard={{ ...dashboard, priority: { total: 0, items: [] } }}
      />,
    )

    expect(screen.getByText(/no tienes pendientes/i)).toBeTruthy()
    expect(screen.getByText(/Pulso operativo/i)).toBeTruthy()
    expect(screen.getByText(/Proveedores del periodo/i)).toBeTruthy()
  })

  it('offers a recoverable error action when the executive snapshot fails', () => {
    const onRetry = vi.fn()
    render(<ExecutiveDashboardError onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})

describe('R5: executive dashboard preserves accessible states and reduced motion', () => {
  it('uses labelled sections, visible focus links and motion-safe transitions', () => {
    const { container } = render(
      <ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />,
    )

    const priority = screen.getByRole('region', {
      name: /prioridad inmediata/i,
    })
    const pulse = screen.getByRole('region', { name: /pulso operativo/i })
    expect(
      Boolean(
        pulse.compareDocumentPosition(priority) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      screen.getByRole('link', { name: /ODC-2026-00001/i }).className,
    ).toMatch(/focus-visible:ring/)
    expect(container.querySelector('[class*="motion-reduce"]')).toBeTruthy()
  })
})

describe('frontend-dashboard-template R2: financial panel, priority and operating context', () => {
  it('places the panel before priority, then suppliers and ageing in DOM order', () => {
    const { container } = render(
      <ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />,
    )

    const alerts = screen.getByRole('region', {
      name: /órdenes más antiguas/i,
    })
    const priority = screen.getByRole('region', {
      name: /prioridad inmediata/i,
    })
    const pulse = screen.getByRole('region', { name: /pulso operativo/i })
    const suppliers = screen.getByRole('region', {
      name: /proveedores del periodo/i,
    })

    expect(
      Boolean(
        pulse.compareDocumentPosition(priority) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      Boolean(
        priority.compareDocumentPosition(suppliers) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      Boolean(
        suppliers.compareDocumentPosition(alerts) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      container.querySelector('[aria-label="Órdenes con mayor antigüedad"]'),
    ).toBeTruthy()
  })

  it('reuses the R6 ageing orders data verbatim as the alerts section, without a new data source', () => {
    render(<ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />)

    expect(
      screen
        .getByRole('link', { name: /ODC-2026-00004/i })
        .getAttribute('href'),
    ).toBe('/odcs/active-1')
    expect(screen.getByText(/Software MX/i)).toBeTruthy()
  })
})

describe('frontend-dashboard-template R3: real monthly comparison and edge cases', () => {
  it('uses the two reported months, a shared scale and the total task count', () => {
    render(<ExecutiveDashboard userName="Ana" dashboard={dashboard} />)
    const panel = screen.getByRole('region', { name: /pulso operativo/i })
    const bars = within(panel).getAllByRole('meter')
    expect(bars).toHaveLength(2)
    expect(bars[0].getAttribute('aria-label')).toMatch(/julio de 2026/i)
    expect(bars[1].getAttribute('aria-label')).toMatch(/junio de 2026/i)
    expect(bars[0].getAttribute('aria-valuenow')).toBe('750000')
    expect(bars[1].getAttribute('aria-valuenow')).toBe('500000')
    expect(
      bars.every((bar) => bar.getAttribute('aria-valuemax') === '750000'),
    ).toBe(true)
    expect(within(panel).getByText('6')).toBeTruthy()
    expect(panel.textContent).toContain('+50%')
    expect(panel.textContent).not.toMatch(/mejora|ahorro/)
  })

  it.each([null, 0])(
    'distinguishes %s from a missing comparison with zero amounts',
    (change) => {
      render(
        <ExecutiveDashboard
          userName="Ana"
          dashboard={{
            ...dashboard,
            pulse: {
              current: { purchaseCount: 0, totalCents: 0 },
              previous: { month: '2026-06', purchaseCount: 0, totalCents: 0 },
              purchaseCountChangePercent: change,
              totalCentsChangePercent: change,
            },
            oldestActiveOrders: [],
          }}
        />,
      )
      const panel = screen.getByRole('region', { name: /pulso operativo/i })
      for (const bar of within(panel).getAllByRole('meter')) {
        expect(bar.getAttribute('aria-valuenow')).toBe('0')
        expect(bar.getAttribute('aria-valuemax')).toBe('1')
        expect(
          bar.querySelector<HTMLElement>('[aria-hidden="true"]')?.style.width,
        ).toBe('0%')
      }
      expect(panel.textContent).toContain(
        change === null ? 'Sin base de comparación' : '0%',
      )
      expect(panel.textContent).toContain('Sin órdenes')
    },
  )
})

describe('frontend-dashboard-template R4: complete and accessible priority table', () => {
  it('keeps task order, column headers and local keyboard scrolling', () => {
    render(<ExecutiveDashboard userName="Ana" dashboard={dashboard} />)
    const region = screen.getByRole('region', {
      name: 'Tabla de tareas prioritarias',
    })
    expect(region.tabIndex).toBe(0)
    const table = within(region).getByRole('table')
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((x) => x.textContent),
    ).toEqual(['Orden / proveedor', 'Estado', 'Importe', 'Siguiente acción'])
    const rows = within(table).getAllByRole('row').slice(1)
    expect(
      rows.map((row) => row.querySelector('a')?.getAttribute('href')),
    ).toEqual(['/odcs/draft-1', '/odcs/purchase-1', '/odcs/invoice-1'])
    expect(rows[0].textContent).toContain('26 días')
    expect(rows[0].textContent).toContain('$2,500.00')
  })

  it('omits the overflow link when every task is shown', () => {
    render(
      <ExecutiveDashboard
        userName="Ana"
        dashboard={{
          ...dashboard,
          priority: { ...dashboard.priority, total: 3 },
        }}
      />,
    )
    expect(
      screen.queryByRole('link', { name: /ver todas las tareas/i }),
    ).toBeNull()
  })
})

describe('frontend-dashboard-template R5: supplier bars and independent empty states', () => {
  it('keeps ranking order and normalizes against the largest amount, including zero', () => {
    render(
      <ExecutiveDashboard
        userName="Ana"
        dashboard={{
          ...dashboard,
          topSuppliers: [
            { supplier: 'Primero', purchaseCount: 1, totalCents: 500 },
            { supplier: 'Mayor', purchaseCount: 2, totalCents: 1000 },
            { supplier: 'Cero', purchaseCount: 0, totalCents: 0 },
          ],
        }}
      />,
    )
    const region = screen.getByRole('region', {
      name: 'Proveedores del periodo',
    })
    const bars = within(region).getAllByRole('meter')
    expect(bars.map((bar) => bar.getAttribute('aria-label'))).toEqual([
      'Primero',
      'Mayor',
      'Cero',
    ])
    expect(bars.map((bar) => bar.getAttribute('aria-valuenow'))).toEqual([
      '500',
      '1000',
      '0',
    ])
    expect(
      bars.every((bar) => bar.getAttribute('aria-valuemax') === '1000'),
    ).toBe(true)
    expect(
      bars.map(
        (bar) =>
          bar.querySelector<HTMLElement>('[aria-hidden="true"]')?.style.width,
      ),
    ).toEqual(['50%', '100%', '0%'])
  })

  it('renders all-zero and empty collections without hiding other sections', () => {
    const { rerender } = render(
      <ExecutiveDashboard
        userName="Ana"
        dashboard={{
          ...dashboard,
          topSuppliers: [{ supplier: 'Cero', purchaseCount: 0, totalCents: 0 }],
          oldestActiveOrders: [],
        }}
      />,
    )
    const bar = within(
      screen.getByRole('region', { name: 'Proveedores del periodo' }),
    ).getByRole('meter')
    expect(bar.getAttribute('aria-valuemax')).toBe('1')
    expect(
      bar.querySelector<HTMLElement>('[aria-hidden="true"]')?.style.width,
    ).toBe('0%')
    expect(
      screen.getByText(/No hay órdenes activas con antigüedad/),
    ).toBeTruthy()
    rerender(
      <ExecutiveDashboard
        userName="Ana"
        dashboard={{ ...dashboard, topSuppliers: [] }}
      />,
    )
    expect(
      screen.getByText(/No hay compras pagadas en este periodo/),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /ODC-2026-00004/ }).getAttribute('href'),
    ).toBe('/odcs/active-1')
  })
})

describe('frontend-dashboard-template R6: loading announcement and recovery', () => {
  it('announces loading without fabricated metrics and keeps an actionable error', () => {
    const { unmount } = render(<ExecutiveDashboardLoading />)
    expect(screen.getByRole('status').textContent).toContain(
      'Cargando resumen ejecutivo',
    )
    expect(screen.queryByRole('meter')).toBeNull()
    unmount()
    const retry = vi.fn()
    render(<ExecutiveDashboardError onRetry={retry} />)
    expect(screen.getByRole('alert')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
