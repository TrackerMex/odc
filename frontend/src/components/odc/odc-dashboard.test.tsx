import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type * as RouterModule from '@tanstack/react-router'
import type { Odc, OdcPage, OdcStatus } from '@/lib/odc'
import { OdcDashboard } from './odc-dashboard'

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
    createdAt: '2026-07-22T12:00:00.000Z',
    updatedAt: '2026-07-22T12:00:00.000Z',
    history: [],
  }
}

function page(items: Odc[], total = items.length): OdcPage {
  return { items, total, page: 1, pageSize: 20 }
}

describe('R1,R12: DIRECTOR_OPS dashboard exposes four responsive workflow queues', () => {
  it('renders every counter, list item, detail link and create action', () => {
    render(
      <OdcDashboard
        userName="Ana Pérez"
        sections={{
          BORRADOR: page([odc('BORRADOR', '1')], 3),
          RECHAZADA: page([], 0),
          COMPRA_APROBADA: page([odc('COMPRA_APROBADA', '2')], 1),
          EVIDENCIA_PAGO_SUBIDA: page([], 2),
        }}
      />,
    )

    expect(screen.getByText(/buen día, ana pérez/i)).toBeTruthy()
    for (const label of [
      'Borradores',
      'Rechazadas',
      'Listas para comprar',
      'Pendientes de factura',
    ]) {
      expect(screen.getByText(label)).toBeTruthy()
    }
    expect(
      screen.getByRole('link', { name: /nueva odc/i }).getAttribute('href'),
    ).toBe('/odcs/new')
    expect(
      screen
        .getByRole('link', { name: /ODC-2026-00001/i })
        .getAttribute('href'),
    ).toBe('/odcs/1')
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
  })
})
