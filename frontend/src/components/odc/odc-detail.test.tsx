import { describe, expect, it } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { ODC_STATUSES, odcFileUrl } from '@/lib/odc'
import type { Odc, OdcStatus } from '@/lib/odc'
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

describe('R1: definition rows and a single emphasized total', () => {
  it('uses semantic rows, two responsive columns and full-width detail sections', () => {
    const { container } = render(
      <OdcDetail
        odc={{
          ...odc,
          status: 'COMPLETADA',
          rejectionReason: null,
          paymentDate: '2026-07-22',
          paymentMethod: 'Transferencia',
          invoiceNumber: 'FAC-100',
          warehouseEntryDate: '2026-07-23',
        }}
      />,
    )

    const details = container.querySelector('dl')
    expect(details?.className).toMatch(/sm:grid-cols-2/)
    expect(details?.className).not.toMatch(/lg:grid-cols-3/)
    expect(screen.getByText('Descripción').tagName).toBe('DT')
    expect(screen.getByText(odc.description).tagName).toBe('DD')

    const total = screen.getByText('Total').closest('[data-detail-row]')
    expect(total?.className).toMatch(/col-span-full/)
    expect(total?.className).toMatch(/border-t-2/)
    expect(within(total!).getByText(/449[.,]70/).className).toMatch(
      /text-xl.*font-semibold.*tabular-nums/,
    )

    for (const heading of [
      'Comentarios',
      'Información de pago',
      'Información de factura',
    ]) {
      const section = screen.getByText(heading).closest('[data-detail-section]')
      expect(section?.className).toMatch(/border-t/)
      expect(section?.className).not.toMatch(/rounded-|bg-muted/)
    }
  })
})

describe('R2: semantic ODC timeline', () => {
  it('maps every status token and distinguishes the latest point', () => {
    const tokenByStatus: Record<OdcStatus, string> = {
      BORRADOR: 'status-draft',
      PENDIENTE_ADMIN: 'status-pending',
      PRESUPUESTO_APROBADO: 'status-budget',
      COMPRA_APROBADA: 'status-approved',
      PAGO_REGISTRADO: 'status-paid',
      EVIDENCIA_PAGO_SUBIDA: 'status-evidence',
      COMPLETADA: 'status-done',
      RECHAZADA: 'status-rejected',
    }
    const history = ODC_STATUSES.map((toStatus, index) => ({
      id: `h-${index}`,
      odcId: 'o1',
      fromStatus: index === 0 ? null : ODC_STATUSES[index - 1],
      toStatus,
      userId: 'u1',
      note: index === 1 ? 'Revisión administrativa' : null,
      createdAt: `2026-07-${String(index + 10).padStart(2, '0')}T12:00:00.000Z`,
    }))

    render(<OdcDetail odc={{ ...odc, history }} />)

    const entries = within(screen.getByTestId('odc-history')).getAllByRole(
      'listitem',
    )
    entries.forEach((entry, index) => {
      const point = entry.querySelector('[data-timeline-point]')
      expect(point?.className).toMatch(
        new RegExp(tokenByStatus[history[index].toStatus]),
      )
      if (index === entries.length - 1) {
        expect(point?.className).toMatch(/bg-status-.*ring-4/)
      } else {
        expect(point?.className).toMatch(/border-\[1\.5px\].*bg-background/)
      }
    })

    const note = screen.getByText('Revisión administrativa')
    expect(note.className).toMatch(/border-l-2.*pl-3/)
    expect(note.className).not.toMatch(/rounded-|bg-muted/)
    expect(entries[0].className).toMatch(/pb-4/)
  })
})

describe('R3: semantic rejection and protected preview surfaces', () => {
  it('uses the card radius and preserves the sticky history and preview behavior', () => {
    const { container } = render(
      <OdcDetail
        odc={{ ...odc, hasPaymentEvidence: true, hasInvoice: true }}
      />,
    )

    const banner = screen
      .getByText('Esta orden necesita correcciones')
      .closest('[data-rejection-banner]')
    expect(banner?.className).toMatch(/rounded-card/)
    expect(banner?.className).toMatch(/bg-destructive\/3.*text-destructive/)
    expect(banner?.querySelector('svg')?.getAttribute('class')).toMatch(
      /size-4/,
    )

    const historyCard = screen
      .getByText('Historial')
      .closest('[data-slot="card"]')
    expect(historyCard?.className).toMatch(/xl:sticky.*xl:top-6.*xl:self-start/)
    expect(container.firstElementChild?.className).toMatch(/_22rem/)

    fireEvent.click(
      screen.getByRole('button', { name: /ver comprobante de pago/i }),
    )
    const frame = screen.getByTitle(/vista previa del comprobante de pago/i)
    const surface = frame.parentElement
    expect(surface?.className).toMatch(/rounded-card/)
    expect(surface?.className).not.toMatch(/rounded-xl|rounded-2xl/)
  })
})

describe('R4: action surface belongs to the detail main column', () => {
  it('renders actions after the detail card and before the history sidebar', () => {
    render(
      <OdcDetail
        odc={odc}
        actions={
          <section aria-label="Acciones de la orden">Acción permitida</section>
        }
      />,
    )

    const action = screen.getByRole('region', { name: /acciones de la orden/i })
    const mainColumn = action.closest('[data-detail-main]')
    expect(mainColumn).toBeTruthy()
    expect(mainColumn?.contains(screen.getByText(odc.description))).toBe(true)
    expect(
      action.compareDocumentPosition(screen.getByText('Historial')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
