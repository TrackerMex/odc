import { describe, expect, it } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { odcFileUrl } from '@/lib/odc'
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

describe('R6: protected evidence and invoice previews', () => {
  it('loads the evidence endpoint only after opening its dialog', () => {
    render(
      <OdcDetail
        odc={{
          ...odc,
          status: 'COMPLETADA',
          rejectionReason: null,
          hasPaymentEvidence: true,
          hasInvoice: true,
        }}
      />,
    )

    expect(
      screen.queryByTitle(/vista previa del comprobante de pago/i),
    ).toBeNull()

    fireEvent.click(
      screen.getByRole('button', {
        name: /ver comprobante de pago/i,
      }),
    )

    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('heading', { name: /comprobante de pago/i }),
    ).toBeTruthy()
    const frame = within(dialog).getByTitle(
      /vista previa del comprobante de pago/i,
    )
    expect(frame.getAttribute('src')).toBe('/api/odcs/o1/files/evidence')
    expect(within(dialog).getByText(/cargando documento/i)).toBeTruthy()

    const externalLink = within(dialog).getByRole('link', {
      name: /abrir en otra pestaña/i,
    })
    expect(externalLink.getAttribute('href')).toBe(
      '/api/odcs/o1/files/evidence',
    )
    expect(externalLink.getAttribute('target')).toBe('_blank')
    expect(externalLink.getAttribute('rel')).toMatch(/noopener/)
  })

  it('opens the invoice preview with the invoice endpoint', () => {
    render(
      <OdcDetail
        odc={{
          ...odc,
          status: 'COMPLETADA',
          rejectionReason: null,
          hasPaymentEvidence: true,
          hasInvoice: true,
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /ver factura/i }))
    expect(
      screen.getByTitle(/vista previa de la factura/i).getAttribute('src'),
    ).toBe('/api/odcs/o1/files/invoice')
  })

  it('hides each preview action when its indicator is false', () => {
    render(
      <OdcDetail
        odc={{
          ...odc,
          status: 'PAGO_REGISTRADO',
          rejectionReason: null,
          hasPaymentEvidence: false,
          hasInvoice: false,
        }}
      />,
    )

    expect(
      screen.queryByRole('button', { name: /ver comprobante de pago/i }),
    ).toBeNull()
    expect(screen.queryByRole('button', { name: /ver factura/i })).toBeNull()
  })
})

describe('R12: responsive layout of the download links row', () => {
  it('wraps the download links instead of forcing horizontal scroll', () => {
    render(
      <OdcDetail
        odc={{
          ...odc,
          status: 'COMPLETADA',
          rejectionReason: null,
          hasPaymentEvidence: true,
          hasInvoice: true,
        }}
      />,
    )

    const evidenceAction = screen.getByRole('button', {
      name: /ver comprobante de pago/i,
    })
    expect(odcFileUrl(odc.id ?? '', 'evidence')).toBe(
      '/api/odcs/o1/files/evidence',
    )
    expect(evidenceAction.parentElement?.className).toMatch(/flex-wrap/)
  })
})

describe('R7: resilient and accessible document preview', () => {
  it('shows a recoverable error and keeps the external fallback when rendering fails', async () => {
    render(
      <OdcDetail
        odc={{
          ...odc,
          status: 'COMPLETADA',
          rejectionReason: null,
          hasPaymentEvidence: true,
        }}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /ver comprobante de pago/i }),
    )
    fireEvent.error(screen.getByTitle(/vista previa del comprobante de pago/i))

    const dialog = screen.getByRole('dialog')
    await waitFor(() =>
      expect(within(dialog).getByRole('alert').textContent).toMatch(
        /no pudimos mostrar el documento/i,
      ),
    )
    expect(
      within(dialog).getByRole('button', { name: /reintentar/i }),
    ).toBeTruthy()
    expect(
      within(dialog).getByRole('link', { name: /abrir en otra pestaña/i }),
    ).toBeTruthy()
  })
})
