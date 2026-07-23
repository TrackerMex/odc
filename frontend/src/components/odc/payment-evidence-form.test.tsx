import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Odc } from '@/lib/odc'
import { PaymentEvidenceForm } from './payment-evidence-form'

function paidOdc(): Odc {
  return {
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
    paymentReference: 'PAY-100',
    paymentNotes: 'Pago confirmado',
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

function setFile(input: HTMLInputElement, file: File) {
  fireEvent.change(input, { target: { files: [file] } })
}

describe('R7,R8,R11,R12: evidence form visibility and validation', () => {
  it('is limited to ADMINISTRACION and validates required MIME and max size', () => {
    const upload = vi.fn()
    const { rerender } = render(
      <PaymentEvidenceForm
        odc={paidOdc()}
        role="ADMINISTRACION"
        upload={upload}
        onSuccess={vi.fn()}
      />,
    )
    const reference = screen.getByLabelText(/referencia del comprobante/i)
    fireEvent.change(reference, { target: { value: 'SPEI-100' } })
    fireEvent.click(screen.getByRole('button', { name: /subir comprobante/i }))
    expect(screen.getByRole('alert').textContent).toMatch(
      /archivo.*obligatorio/i,
    )
    expect((reference as HTMLInputElement).value).toBe('SPEI-100')

    const input = screen.getByLabelText(/archivo del comprobante/i)
    setFile(input, new File(['text'], 'notes.txt', { type: 'text/plain' }))
    fireEvent.click(screen.getByRole('button', { name: /subir comprobante/i }))
    expect(screen.getByRole('alert').textContent).toMatch(/pdf.*jpg.*png/i)

    const oversized = new File(['x'], 'large.pdf', {
      type: 'application/pdf',
    })
    Object.defineProperty(oversized, 'size', { value: 10_485_761 })
    setFile(input, oversized)
    fireEvent.click(screen.getByRole('button', { name: /subir comprobante/i }))
    expect(screen.getByRole('alert').textContent).toMatch(/10 mb/i)
    expect(upload).not.toHaveBeenCalled()

    rerender(
      <PaymentEvidenceForm
        odc={paidOdc()}
        role="DIRECTOR_GENERAL"
        upload={upload}
        onSuccess={vi.fn()}
      />,
    )
    expect(
      screen.queryByRole('button', { name: /subir comprobante/i }),
    ).toBeNull()
  })
})

describe('R9,R10,R11: evidence upload lifecycle', () => {
  it('trims the optional reference, blocks duplicates and applies server result', async () => {
    const odc = paidOdc()
    let resolveUpload!: (value: Odc) => void
    const upload = vi.fn(
      () =>
        new Promise<Odc>((resolve) => {
          resolveUpload = resolve
        }),
    )
    const onSuccess = vi.fn()
    render(
      <PaymentEvidenceForm
        odc={odc}
        role="ADMINISTRACION"
        upload={upload}
        onSuccess={onSuccess}
      />,
    )
    const file = new File(['pdf'], 'comprobante.pdf', {
      type: 'application/pdf',
    })
    setFile(
      screen.getByLabelText(/archivo del comprobante/i),
      file,
    )
    fireEvent.change(screen.getByLabelText(/referencia del comprobante/i), {
      target: { value: '  SPEI-100  ' },
    })
    const submit = screen.getByRole('button', { name: /subir comprobante/i })
    fireEvent.click(submit)
    fireEvent.click(submit)

    expect(upload).toHaveBeenCalledOnce()
    expect(upload).toHaveBeenCalledWith(file, 'SPEI-100')
    expect(submit.hasAttribute('disabled')).toBe(true)
    resolveUpload({
      ...odc,
      status: 'EVIDENCIA_PAGO_SUBIDA',
      hasPaymentEvidence: true,
      evidenceReference: 'SPEI-100',
    })
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  it('preserves values and enables retry after an API error', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('Network'))
    render(
      <PaymentEvidenceForm
        odc={paidOdc()}
        role="ADMINISTRACION"
        upload={upload}
        onSuccess={vi.fn()}
      />,
    )
    const input = screen.getByLabelText(/archivo del comprobante/i)
    setFile(input, new File(['png'], 'comprobante.png', { type: 'image/png' }))
    const reference = screen.getByLabelText(/referencia del comprobante/i)
    fireEvent.change(reference, { target: { value: 'SPEI-200' } })
    fireEvent.click(screen.getByRole('button', { name: /subir comprobante/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(
        /no pudimos subir/i,
      ),
    )
    expect((reference as HTMLInputElement).value).toBe('SPEI-200')
    expect(
      screen
        .getByRole('button', { name: /subir comprobante/i })
        .hasAttribute('disabled'),
    ).toBe(false)
  })
})
