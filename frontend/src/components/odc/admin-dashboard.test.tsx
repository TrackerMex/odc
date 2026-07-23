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
