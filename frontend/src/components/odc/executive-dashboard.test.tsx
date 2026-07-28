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
    expect(screen.getByText(/Pulso del periodo/i)).toBeTruthy()
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
    expect(screen.getByText(/Pulso del periodo/i)).toBeTruthy()
    expect(screen.getByText(/Proveedores del periodo/i)).toBeTruthy()
  })

  it('offers a recoverable error action when the executive snapshot fails', () => {
    const onRetry = vi.fn()
    render(<ExecutiveDashboardError onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})

describe('R9: executive dashboard preserves semantic order, responsive composition and reduced motion', () => {
  it('uses labelled sections, visible focus links and motion-safe transitions', () => {
    const { container } = render(
      <ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />,
    )

    const priority = screen.getByRole('region', {
      name: /prioridad inmediata/i,
    })
    const pulse = screen.getByRole('region', { name: /pulso del periodo/i })
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

describe('R13: executive dashboard orders sections by hierarchy — alerts, priority, pulse, suppliers', () => {
  it('places ageing alerts before priority, priority before pulse, and suppliers after all three in the DOM', () => {
    const { container } = render(
      <ExecutiveDashboard userName="Ana Pérez" dashboard={dashboard} />,
    )

    const alerts = screen.getByRole('region', {
      name: /alertas: órdenes con mayor antigüedad/i,
    })
    const priority = screen.getByRole('region', {
      name: /prioridad inmediata/i,
    })
    const pulse = screen.getByRole('region', { name: /pulso del periodo/i })
    const suppliers = screen.getByRole('region', {
      name: /proveedores del periodo/i,
    })

    expect(
      Boolean(
        alerts.compareDocumentPosition(priority) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      Boolean(
        priority.compareDocumentPosition(pulse) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true)
    expect(
      Boolean(
        pulse.compareDocumentPosition(suppliers) &
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
