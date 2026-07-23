import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type * as RouterModule from '@tanstack/react-router'
import type { Odc, OdcPage } from '@/lib/odc'
import { GeneralDashboard } from './general-dashboard'

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

const odc: Odc = {
  id: 'o12',
  odcNumber: 'ODC-2026-00012',
  status: 'PRESUPUESTO_APROBADO',
  description: 'Sensores GPS',
  quantity: 3,
  unit: 'pieza',
  unitPriceCents: 14_990,
  totalCents: 44_970,
  supplier: 'Suntech',
  comments: null,
  createdById: 'ops',
  rejectionReason: null,
  paymentDate: null,
  paymentMethod: null,
  paymentReference: null,
  paymentNotes: null,
  hasPaymentEvidence: false,
  evidenceReference: null,
  hasInvoice: false,
  invoiceNumber: null,
  invoiceDate: null,
  warehouseEntryDate: null,
  observations: null,
  createdAt: '2026-07-23T12:00:00.000Z',
  updatedAt: '2026-07-23T12:00:00.000Z',
  history: [],
}

function page(items: Odc[], total = items.length): OdcPage {
  return { items, total, page: 1, pageSize: 20 }
}

describe('R2: Dirección General approval dashboard', () => {
  it('renders the queue total, ODC data, MXN amount and detail link', () => {
    render(
      <GeneralDashboard userName="Laura Dirección" page={page([odc], 7)} />,
    )

    expect(screen.getByText(/buen día, laura dirección/i)).toBeTruthy()
    expect(screen.getByText('Esperando mi aprobación')).toBeTruthy()
    expect(screen.getByText('7')).toBeTruthy()
    expect(screen.getByText(/\$449\.70/)).toBeTruthy()
    const detailLink = screen.getByRole('link', {
      name: new RegExp(odc.odcNumber!, 'i'),
    })
    expect(detailLink.textContent).toContain(odc.description)
    expect(detailLink.textContent).toContain(odc.supplier)
    expect(detailLink.getAttribute('href')).toBe('/odcs/o12')
    expect(screen.queryByRole('link', { name: /nueva odc/i })).toBeNull()
  })

  it('renders an explicit empty state', () => {
    render(<GeneralDashboard userName="Laura" page={page([])} />)

    expect(screen.getByText(/no hay órdenes esperando tu aprobación/i)).toBeTruthy()
  })
})

describe('R10: responsive Dirección General dashboard', () => {
  it('keeps the queue and links constrained on narrow screens', () => {
    const { container } = render(
      <GeneralDashboard userName="Laura" page={page([odc])} />,
    )

    expect(container.querySelector('main')?.className).toContain('min-w-0')
    expect(
      screen.getByRole('link', { name: /ODC-2026-00012/i }).className,
    ).toMatch(/flex-col.*sm:flex-row/)
    expect(screen.getAllByText('Dirección General')).toHaveLength(2)
  })
})
