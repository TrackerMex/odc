import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Odc } from '@/lib/odc'
import { OdcDetail } from './odc-detail'

const odc: Odc = {
  id: 'o1',
  odcNumber: 'ODC-2026-00001',
  status: 'RECHAZADA',
  description: 'Sensores GPS',
  quantity: 3,
  unit: 'pieza',
  unitPriceCents: 14_990,
  totalCents: 44_970,
  supplier: 'Suntech',
  comments: 'Entrega urgente',
  createdById: 'u1',
  rejectionReason: 'Falta justificar la cantidad',
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
  history: [
    {
      id: 'h1',
      odcId: 'o1',
      fromStatus: null,
      toStatus: 'BORRADOR',
      userId: 'u1',
      note: null,
      createdAt: '2026-07-22T12:00:00.000Z',
    },
    {
      id: 'h2',
      odcId: 'o1',
      fromStatus: 'PENDIENTE_ADMIN',
      toStatus: 'RECHAZADA',
      userId: 'u2',
      note: 'Falta justificar la cantidad',
      createdAt: '2026-07-22T13:00:00.000Z',
    },
  ],
}

describe('R7,R8: ODC detail and chronological history', () => {
  it('shows the business fields, rejection reason and ordered timeline', () => {
    render(<OdcDetail odc={odc} />)

    expect(screen.getByRole('heading', { name: odc.odcNumber! })).toBeTruthy()
    expect(screen.getByText(odc.description)).toBeTruthy()
    expect(screen.getByText(odc.supplier)).toBeTruthy()
    expect(screen.getAllByText(/falta justificar la cantidad/i).length).toBe(2)

    const history = screen.getByTestId('odc-history')
    const entries = within(history).getAllByRole('listitem')
    expect(entries).toHaveLength(2)
    expect(entries[0].textContent).toMatch(/borrador/i)
    expect(entries[1].textContent).toMatch(/rechazada/i)
  })
})

describe('R7: payment information in the shared detail', () => {
  it('shows payment date, method, reference and notes when registered', () => {
    render(
      <OdcDetail
        odc={{
          ...odc,
          status: 'PAGO_REGISTRADO',
          rejectionReason: null,
          paymentDate: '2026-07-22',
          paymentMethod: 'Transferencia',
          paymentReference: 'SPEI-100',
          paymentNotes: 'Pago confirmado por tesorería',
        }}
      />,
    )

    expect(screen.getByText('Transferencia')).toBeTruthy()
    expect(screen.getByText('SPEI-100')).toBeTruthy()
    expect(screen.getByText(/pago confirmado por tesorería/i)).toBeTruthy()
    expect(screen.getAllByText(/22 jul 2026/i).length).toBeGreaterThan(0)
  })
})

describe('R9: COMPLETADA badge and invoice information block', () => {
  it('shows the invoice information with pending dates and omitted text fields', () => {
    render(
      <OdcDetail
        odc={{
          ...odc,
          status: 'COMPLETADA',
          rejectionReason: null,
          invoiceNumber: null,
          invoiceDate: null,
          warehouseEntryDate: '2026-07-23',
          observations: 'Recibido en almacén central',
        }}
      />,
    )

    expect(screen.getByText('Completada')).toBeTruthy()
    expect(screen.getByText(/información de factura/i)).toBeTruthy()
    expect(screen.getByText(/recibido en almacén central/i)).toBeTruthy()
    expect(screen.queryByText(/número de factura/i)).toBeNull()
    expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0)
  })

  it('does not render an invoice block when there is no invoice data yet', () => {
    render(<OdcDetail odc={{ ...odc, status: 'EVIDENCIA_PAGO_SUBIDA' }} />)

    expect(screen.queryByText(/información de factura/i)).toBeNull()
  })
})
