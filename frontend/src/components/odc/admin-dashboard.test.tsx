import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type * as RouterModule from '@tanstack/react-router'
import type { Odc, OdcPage, OdcStatus } from '@/lib/odc'
import { AdminDashboard } from './admin-dashboard'

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

function odc(status: OdcStatus, id: string): Odc {
  return {
    id,
    odcNumber: `ODC-2026-${id.padStart(5, '0')}`,
    status,
    description: `Orden ${id}`,
    quantity: 2,
    unit: 'pieza',
    unitPriceCents: 10_000,
    totalCents: 20_000,
    supplier: 'Suntech',
    comments: null,
    createdById: 'u1',
    rejectionReason: null,
    paymentDate: status === 'PAGO_REGISTRADO' ? '2026-07-22' : null,
    paymentMethod: status === 'PAGO_REGISTRADO' ? 'Transferencia' : null,
    paymentReference: null,
    paymentNotes: null,
    hasPaymentEvidence: false,
    evidenceReference: null,
    hasInvoice: false,
    invoiceNumber: null,
    invoiceDate: null,
    warehouseEntryDate: null,
    observations: null,
    createdAt: '2026-07-22T12:00:00.000Z',
    updatedAt: '2026-07-22T12:00:00.000Z',
    history: [],
  }
}

function page(items: Odc[], total = items.length): OdcPage {
  return { items, total, page: 1, pageSize: 20 }
}

const sections = {
  PENDIENTE_ADMIN: page([odc('PENDIENTE_ADMIN', '1')], 4),
  PAGO_REGISTRADO: page([], 0),
}

describe('ui-surfaces-dashboards R3,R4: consola de trabajo densa, no landing', () => {
  it('usa el ancho y el padding de página de la superficie de dashboard', () => {
    const { container } = render(
      <AdminDashboard userName="María Admin" sections={sections} />,
    )

    const main = container.querySelector('main')!
    expect(main.className).toContain('min-w-0')
    expect(main.className).toContain('flex-1')
    expect(main.className).toContain('p-4')
    expect(main.className).toContain('sm:p-6')
    expect(main.className).not.toContain('lg:p-8')
    expect(container.querySelector('.max-w-\\[1400px\\]')).toBeTruthy()
    expect(container.querySelector('.max-w-7xl')).toBeNull()
  })

  it('reduce el header a un escalón tipográfico y suelta el párrafo de onboarding', () => {
    render(<AdminDashboard userName="María Admin" sections={sections} />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.className).toContain('text-2xl')
    expect(heading.className).not.toContain('text-3xl')
    expect(heading.className).not.toContain('sm:text-4xl')
    expect(screen.queryByText(/valida presupuestos y adjunta/i)).toBeNull()
    expect(screen.getAllByText('Administración').length).toBeGreaterThan(0)
  })
})

function queueHeader(title: string) {
  return screen.getByText(title).closest('[data-slot="card-header"]')!
}

describe('ui-surfaces-dashboards R7,R8: cada cola se distingue de un vistazo', () => {
  it.each([
    ['Pendientes de validar', 'border-l-status-pending'],
    ['Compras pagadas', 'border-l-status-paid'],
  ])('la tarjeta %s lleva la barra de acento de su estado', (title, accent) => {
    render(<AdminDashboard userName="María Admin" sections={sections} />)

    const header = queueHeader(title)
    expect(header.className).toContain('border-l-2')
    expect(header.className).toContain(accent)
    expect(header.className).toContain('pb-3')
  })

  it('el contador baja de escalón y se queda en el gris de metadatos', () => {
    render(<AdminDashboard userName="María Admin" sections={sections} />)

    for (const title of ['Pendientes de validar', 'Compras pagadas']) {
      const counter = queueHeader(title).querySelector('.tabular-nums')!
      expect(counter.className).toContain('text-2xl')
      expect(counter.className).not.toContain('text-3xl')
      expect(counter.className).toContain('text-muted-foreground')
    }
  })

  it('el estado vacío baja de alto sin perder su borde discontinuo ni su mensaje', () => {
    render(<AdminDashboard userName="María Admin" sections={sections} />)

    const empty = screen.getByText(/no hay órdenes en esta etapa/i)
    expect(empty.className).toContain('min-h-20')
    expect(empty.className).toContain('border-dashed')
  })
})

describe('R2,R12: ADMINISTRACION dashboard queues', () => {
  it('renders counters, detail links and explicit empty states without create action', () => {
    render(
      <AdminDashboard
        userName="María Admin"
        sections={{
          PENDIENTE_ADMIN: page([odc('PENDIENTE_ADMIN', '1')], 4),
          PAGO_REGISTRADO: page([], 0),
        }}
      />,
    )

    expect(screen.getByText(/buen día, maría admin/i)).toBeTruthy()
    expect(screen.getByText('Pendientes de validar')).toBeTruthy()
    expect(screen.getByText('Compras pagadas')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText(/no hay órdenes en esta etapa/i)).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: /ODC-2026-00001/i })
        .getAttribute('href'),
    ).toBe('/odcs/1')
    expect(screen.queryByRole('link', { name: /nueva odc/i })).toBeNull()
  })
})
