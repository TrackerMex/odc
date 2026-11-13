import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { uploadInvoice, uploadPaymentEvidence } from '@/lib/api'
import { statusLabel } from '@/lib/odc'
import type { Odc } from '@/lib/odc'
import { OdcDetail } from './odc-detail'
import { PaymentEvidenceForm } from './payment-evidence-form'
import { UploadInvoiceForm } from './upload-invoice-form'

type UploadKind = 'evidence' | 'invoice'
const uploadKinds: UploadKind[] = ['evidence', 'invoice']

function initialOrder(kind: UploadKind): Odc {
  const odc: Odc = {
    id: 'o1',
    odcNumber: 'ODC-2026-00001',
    status: 'PAGO_REGISTRADO',
    description: 'Sensores GPS',
    quantity: 2,
    unit: 'pieza',
    unitPriceCents: 10_000,
    totalCents: 20_000,
    supplier: 'Suntech',
    comments: null,
    createdById: 'ops',
    rejectionReason: null,
    paymentDate: '2026-07-22',
    paymentMethod: 'Transferencia',
    paymentReference: 'SPEI-1',
    paymentNotes: null,
    hasPaymentEvidence: false,
    evidenceReference: null,
    hasInvoice: false,
    invoiceNumber: null,
    invoiceDate: null,
    warehouseEntryDate: null,
    observations: null,
    createdAt: '2026-07-22T12:00:00.000Z',
    updatedAt: '2026-07-22T13:00:00.000Z',
    history: [
      {
        id: 'h1',
        odcId: 'o1',
        fromStatus: null,
        toStatus: 'BORRADOR',
        userId: 'ops',
        note: 'Solicitud original',
        createdAt: '2026-07-22T12:00:00.000Z',
      },
      {
        id: 'h2',
        odcId: 'o1',
        fromStatus: 'COMPRA_APROBADA',
        toStatus: 'PAGO_REGISTRADO',
        userId: 'admin',
        note: 'Pago persistido',
        createdAt: '2026-07-22T13:00:00.000Z',
      },
    ],
  }
  if (kind === 'invoice') {
    odc.status = 'EVIDENCIA_PAGO_SUBIDA'
    odc.hasPaymentEvidence = true
    odc.history.push({
      id: 'h3',
      odcId: 'o1',
      fromStatus: 'PAGO_REGISTRADO',
      toStatus: 'EVIDENCIA_PAGO_SUBIDA',
      userId: 'admin',
      note: 'Comprobante persistido',
      createdAt: '2026-07-22T14:00:00.000Z',
    })
  }
  return odc
}

// This UI contract fixture complements the real repository/HTTP regressions.
// It verifies state replacement and rendering, not backend persistence itself.
function serverResponse(kind: UploadKind, initial: Odc): Odc {
  const status = kind === 'evidence' ? 'EVIDENCIA_PAGO_SUBIDA' : 'COMPLETADA'
  return {
    ...initial,
    status,
    hasPaymentEvidence: true,
    hasInvoice: kind === 'invoice',
    warehouseEntryDate: kind === 'invoice' ? '2026-07-23' : null,
    history: [
      ...initial.history,
      {
        id: kind === 'evidence' ? 'h3' : 'h4',
        odcId: initial.id,
        fromStatus: initial.status,
        toStatus: status,
        userId: kind === 'evidence' ? 'admin' : 'ops',
        note:
          kind === 'evidence' ? 'Comprobante persistido' : 'Factura persistida',
        createdAt: '2026-07-22T15:00:00.000Z',
      },
    ],
  }
}

function DetailWithUploads({
  initial,
  kind,
}: {
  initial: Odc
  kind: UploadKind
}) {
  const [odc, setOdc] = useState(initial)
  return (
    <OdcDetail
      odc={odc}
      actions={
        kind === 'evidence' ? (
          <PaymentEvidenceForm
            odc={odc}
            role="ADMINISTRACION"
            upload={(file, reference) =>
              uploadPaymentEvidence(odc.id!, file, reference)
            }
            onSuccess={setOdc}
          />
        ) : (
          <UploadInvoiceForm
            odc={odc}
            role="DIRECTOR_OPS"
            upload={(file, payload) => uploadInvoice(odc.id!, file, payload)}
            onSuccess={setOdc}
          />
        )
      }
    />
  )
}

function submitUpload(kind: UploadKind) {
  const label =
    kind === 'evidence' ? /archivo del comprobante/i : /archivo de la factura/i
  fireEvent.change(screen.getByLabelText(label), {
    target: {
      files: [new File(['pdf'], 'documento.pdf', { type: 'application/pdf' })],
    },
  })
  if (kind === 'invoice') {
    fireEvent.change(screen.getByLabelText(/fecha de entrada a almacén/i), {
      target: { value: '2026-07-23' },
    })
  }
  fireEvent.click(
    screen.getByRole('button', {
      name: kind === 'evidence' ? /subir comprobante/i : /subir factura/i,
    }),
  )
  if (kind === 'invoice') {
    fireEvent.click(screen.getByRole('button', { name: /completar orden/i }))
  }
}

function assertTimeline(odc: Odc) {
  const history = screen.getByTestId('odc-history')
  const entries = history.querySelectorAll('li')
  expect(entries).toHaveLength(odc.history.length)
  odc.history.forEach((entry, index) => {
    expect(entries[index].textContent).toContain(statusLabel(entry.toStatus))
    expect(within(history).getAllByText(entry.note!)).toHaveLength(1)
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('odc-detail-history-hydration R2: upload responses replace detail state without losing the timeline', () => {
  it.each(uploadKinds)(
    'applies the complete %s response without a second GET',
    async (kind) => {
      const initial = initialOrder(kind)
      const next = serverResponse(kind, initial)
      let resolveResponse!: (response: Response) => void
      const request = vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveResponse = resolve
          }),
      )
      vi.stubGlobal('fetch', request)
      render(<DetailWithUploads initial={initial} kind={kind} />)
      assertTimeline(initial)

      submitUpload(kind)
      await vi.waitFor(() => expect(request).toHaveBeenCalledOnce())
      assertTimeline(initial)
      resolveResponse(
        new Response(JSON.stringify(next), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      await vi.waitFor(() => assertTimeline(next))
      expect(screen.getByText(statusLabel(next.status))).toBeTruthy()
      expect(
        screen.getByRole('button', {
          name:
            kind === 'evidence' ? /ver comprobante de pago/i : /ver factura/i,
        }),
      ).toBeTruthy()
      expect(request).toHaveBeenCalledExactlyOnceWith(
        `/api/odcs/o1/${kind === 'evidence' ? 'payment-evidence' : 'invoice'}`,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: expect.any(FormData),
        }),
      )
    },
  )

  it.each(uploadKinds)(
    'keeps prior events and the existing error handling when %s upload fails',
    async (kind) => {
      const initial = initialOrder(kind)
      const request = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Upload failed' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      vi.stubGlobal('fetch', request)
      render(<DetailWithUploads initial={initial} kind={kind} />)
      submitUpload(kind)

      await vi.waitFor(() =>
        expect(screen.getByRole('alert').textContent).toMatch(
          /no pudimos subir/i,
        ),
      )
      assertTimeline(initial)
      expect(
        screen.queryByText(
          kind === 'evidence' ? 'Comprobante persistido' : 'Factura persistida',
        ),
      ).toBeNull()
      expect(request).toHaveBeenCalledOnce()
      const retry = screen.getByRole('button', {
        name: kind === 'evidence' ? /subir comprobante/i : /completar orden/i,
      })
      expect(retry.hasAttribute('disabled')).toBe(false)
    },
  )
})
