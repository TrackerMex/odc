import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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
      screen.getByRole('link', { name: /ver todas las tareas/i }).getAttribute('href'),
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
    expect(
      screen.queryByRole('link', { name: /reabrir y editar/i }),
    ).toBeNull()
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
    expect(pulse.textContent).toContain('Tareas prioritarias')
    expect(pulse.textContent).toContain('Compras pagadas')
    expect(pulse.textContent).toContain('Importe pagado')
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
        priority.compareDocumentPosition(pulse) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      screen.getByRole('link', { name: /ODC-2026-00001/i }).className,
    ).toMatch(/focus-visible:ring/)
    expect(container.querySelector('[class*="motion-reduce"]')).toBeTruthy()
  })
})

describe('R4: executive dashboard orders sections by hierarchy — priority, pulse, context', () => {
  it('places priority before pulse and context modules in the DOM', () => {
    const { container } = render(
      <ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />,
    )

    const alerts = screen.getByRole('region', {
      name: /alertas: órdenes con mayor antigüedad/i,
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
        priority.compareDocumentPosition(pulse) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      Boolean(
        pulse.compareDocumentPosition(alerts) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      Boolean(
        alerts.compareDocumentPosition(suppliers) &
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
