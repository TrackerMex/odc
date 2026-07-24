import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ODC_STATUSES } from '@/lib/odc'
import type { Odc, OdcStatus } from '@/lib/odc'
import type { SessionUser } from '@/lib/session'
import { UploadInvoiceForm } from './upload-invoice-form'

function evidenceUploadedOdc(): Odc {
  return {
    id: 'o1',
    odcNumber: 'ODC-2026-00001',
    status: 'EVIDENCIA_PAGO_SUBIDA',
    description: 'Sensores GPS',
    quantity: 2,
    unit: 'pieza',
    unitPriceCents: 10_000,
    totalCents: 20_000,
    supplier: 'Suntech',
    comments: null,
    createdById: 'ops',
    rejectionReason: null,
    paymentDate: '2026-07-20',
    paymentMethod: 'Transferencia',
    paymentReference: null,
    paymentNotes: null,
    hasPaymentEvidence: true,
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

const allRoles: Array<SessionUser['role']> = [
  'DIRECTOR_OPS',
  'ADMINISTRACION',
  'DIRECTOR_GENERAL',
]

const otherRoles: Array<SessionUser['role']> = [
  'ADMINISTRACION',
  'DIRECTOR_GENERAL',
]

const otherStatuses: OdcStatus[] = [
  'COMPRA_APROBADA',
  'PAGO_REGISTRADO',
  'COMPLETADA',
]

describe('R5: upload invoice form visibility and fields', () => {
  it('shows all fields to DIRECTOR_OPS on EVIDENCIA_PAGO_SUBIDA', () => {
    render(
      <UploadInvoiceForm
        odc={evidenceUploadedOdc()}
        role="DIRECTOR_OPS"
        upload={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/archivo de la factura/i)).toBeTruthy()
    expect(screen.getByLabelText(/número de factura/i)).toBeTruthy()
    expect(screen.getByLabelText(/fecha de factura/i)).toBeTruthy()
    expect(screen.getByLabelText(/fecha de entrada a almacén/i)).toBeTruthy()
    expect(screen.getByLabelText(/observaciones/i)).toBeTruthy()
  })

  it.each(otherRoles)(
    'is not rendered for role %s even on EVIDENCIA_PAGO_SUBIDA',
    (role) => {
      render(
        <UploadInvoiceForm
          odc={evidenceUploadedOdc()}
          role={role}
          upload={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )
      expect(screen.queryByLabelText(/archivo de la factura/i)).toBeNull()
    },
  )

  it.each(otherStatuses)(
    'is not rendered for DIRECTOR_OPS when status is %s',
    (status) => {
      render(
        <UploadInvoiceForm
          odc={{ ...evidenceUploadedOdc(), status }}
          role="DIRECTOR_OPS"
          upload={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )
      expect(screen.queryByLabelText(/archivo de la factura/i)).toBeNull()
    },
  )
})

describe('R9: hidden once the ODC reaches COMPLETADA', () => {
  it('does not render for DIRECTOR_OPS when status is COMPLETADA', () => {
    render(
      <UploadInvoiceForm
        odc={{ ...evidenceUploadedOdc(), status: 'COMPLETADA' }}
        role="DIRECTOR_OPS"
        upload={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )
    expect(screen.queryByLabelText(/archivo de la factura/i)).toBeNull()
  })
})

describe('R6: file and warehouse entry date validation', () => {
  it('requires a file before submitting', () => {
    const upload = vi.fn()
    render(
      <UploadInvoiceForm
        odc={evidenceUploadedOdc()}
        role="DIRECTOR_OPS"
        upload={upload}
        onSuccess={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText(/fecha de entrada a almacén/i), {
      target: { value: '2026-07-23' },
    })
    fireEvent.click(screen.getByRole('button', { name: /subir factura/i }))

    expect(screen.getByRole('alert').textContent).toMatch(
      /archivo.*obligatorio/i,
    )
    expect(upload).not.toHaveBeenCalled()
  })

  it('rejects a disallowed MIME type', () => {
    const upload = vi.fn()
    render(
      <UploadInvoiceForm
        odc={evidenceUploadedOdc()}
        role="DIRECTOR_OPS"
        upload={upload}
        onSuccess={vi.fn()}
      />,
    )
    setFile(
      screen.getByLabelText(/archivo de la factura/i),
      new File(['text'], 'notes.txt', { type: 'text/plain' }),
    )
    fireEvent.change(screen.getByLabelText(/fecha de entrada a almacén/i), {
      target: { value: '2026-07-23' },
    })
    fireEvent.click(screen.getByRole('button', { name: /subir factura/i }))

    expect(screen.getByRole('alert').textContent).toMatch(/pdf.*jpg.*png/i)
    expect(upload).not.toHaveBeenCalled()
  })

  it('rejects a file larger than 10 MB', () => {
    const upload = vi.fn()
    render(
      <UploadInvoiceForm
        odc={evidenceUploadedOdc()}
        role="DIRECTOR_OPS"
        upload={upload}
        onSuccess={vi.fn()}
      />,
    )
    const oversized = new File(['x'], 'factura.pdf', {
      type: 'application/pdf',
    })
    Object.defineProperty(oversized, 'size', { value: 10_485_761 })
    setFile(screen.getByLabelText(/archivo de la factura/i), oversized)
    fireEvent.change(screen.getByLabelText(/fecha de entrada a almacén/i), {
      target: { value: '2026-07-23' },
    })
    fireEvent.click(screen.getByRole('button', { name: /subir factura/i }))

    expect(screen.getByRole('alert').textContent).toMatch(/10 mb/i)
    expect(upload).not.toHaveBeenCalled()
  })

  it('requires the warehouse entry date', () => {
    const upload = vi.fn()
    render(
      <UploadInvoiceForm
        odc={evidenceUploadedOdc()}
        role="DIRECTOR_OPS"
        upload={upload}
        onSuccess={vi.fn()}
      />,
    )
    setFile(
      screen.getByLabelText(/archivo de la factura/i),
      new File(['pdf'], 'factura.pdf', { type: 'application/pdf' }),
    )
    fireEvent.click(screen.getByRole('button', { name: /subir factura/i }))

    expect(screen.getByRole('alert').textContent).toMatch(
      /entrada a almacén/i,
    )
    expect(upload).not.toHaveBeenCalled()
  })

  it.each(['application/pdf', 'image/jpeg', 'image/png'])(
    'accepts a valid file with MIME %s',
    async (mime) => {
      const upload = vi.fn().mockResolvedValue(evidenceUploadedOdc())
      render(
        <UploadInvoiceForm
          odc={evidenceUploadedOdc()}
          role="DIRECTOR_OPS"
          upload={upload}
          onSuccess={vi.fn()}
        />,
      )
      setFile(
        screen.getByLabelText(/archivo de la factura/i),
        new File(['data'], 'factura', { type: mime }),
      )
      fireEvent.change(screen.getByLabelText(/fecha de entrada a almacén/i), {
        target: { value: '2026-07-23' },
      })
      fireEvent.click(screen.getByRole('button', { name: /subir factura/i }))

      await waitFor(() => expect(upload).toHaveBeenCalledOnce())
    },
  )
})

describe('R7: invoice submission and confirmed transition', () => {
  it('sends a single multipart request with trimmed optional fields and applies the server result', async () => {
    let resolveUpload!: (value: Odc) => void
    const upload = vi.fn(
      () =>
        new Promise<Odc>((resolve) => {
          resolveUpload = resolve
        }),
    )
    const onSuccess = vi.fn()
    render(
      <UploadInvoiceForm
        odc={evidenceUploadedOdc()}
        role="DIRECTOR_OPS"
        upload={upload}
        onSuccess={onSuccess}
      />,
    )
    const file = new File(['pdf'], 'factura.pdf', {
      type: 'application/pdf',
    })
    setFile(screen.getByLabelText(/archivo de la factura/i), file)
    fireEvent.change(screen.getByLabelText(/número de factura/i), {
      target: { value: '  FAC-100  ' },
    })
    fireEvent.change(screen.getByLabelText(/fecha de entrada a almacén/i), {
      target: { value: '2026-07-23' },
    })
    const submit = screen.getByRole('button', { name: /subir factura/i })
    fireEvent.click(submit)
    fireEvent.click(submit)

    expect(upload).toHaveBeenCalledOnce()
    expect(upload).toHaveBeenCalledWith(file, {
      warehouseEntryDate: '2026-07-23',
      invoiceNumber: 'FAC-100',
      invoiceDate: undefined,
      observations: undefined,
    })
    expect(submit.hasAttribute('disabled')).toBe(true)

    resolveUpload({
      ...evidenceUploadedOdc(),
      status: 'COMPLETADA',
      hasInvoice: true,
      invoiceNumber: 'FAC-100',
      warehouseEntryDate: '2026-07-23',
    })
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })
})

describe('R8: recoverable errors on upload invoice', () => {
  it('preserves the entered values and re-enables the form after a failed request', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('Network'))
    render(
      <UploadInvoiceForm
        odc={evidenceUploadedOdc()}
        role="DIRECTOR_OPS"
        upload={upload}
        onSuccess={vi.fn()}
      />,
    )
    setFile(
      screen.getByLabelText(/archivo de la factura/i),
      new File(['pdf'], 'factura.pdf', { type: 'application/pdf' }),
    )
    fireEvent.change(screen.getByLabelText(/número de factura/i), {
      target: { value: 'FAC-200' },
    })
    fireEvent.change(screen.getByLabelText(/fecha de entrada a almacén/i), {
      target: { value: '2026-07-23' },
    })
    fireEvent.click(screen.getByRole('button', { name: /subir factura/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(
        /no pudimos subir/i,
      ),
    )
    expect(
      (screen.getByLabelText(/número de factura/i) as HTMLInputElement)
        .value,
    ).toBe('FAC-200')
    expect(
      (
        screen.getByLabelText(
          /fecha de entrada a almacén/i,
        ) as HTMLInputElement
      ).value,
    ).toBe('2026-07-23')
    expect(
      screen
        .getByRole('button', { name: /subir factura/i })
        .hasAttribute('disabled'),
    ).toBe(false)
  })
})

describe('R11: loading state and accessibility of upload invoice', () => {
  it('marks the form busy and disables its controls while the request is pending', async () => {
    let resolveUpload!: (value: Odc) => void
    const upload = vi.fn(
      () =>
        new Promise<Odc>((resolve) => {
          resolveUpload = resolve
        }),
    )
    render(
      <UploadInvoiceForm
        odc={evidenceUploadedOdc()}
        role="DIRECTOR_OPS"
        upload={upload}
        onSuccess={vi.fn()}
      />,
    )
    setFile(
      screen.getByLabelText(/archivo de la factura/i),
      new File(['pdf'], 'factura.pdf', { type: 'application/pdf' }),
    )
    fireEvent.change(screen.getByLabelText(/fecha de entrada a almacén/i), {
      target: { value: '2026-07-23' },
    })
    fireEvent.click(screen.getByRole('button', { name: /subir factura/i }))

    const form = screen
      .getByRole('button', { name: /subiendo/i })
      .closest('form')
    expect(form?.getAttribute('aria-busy')).toBe('true')
    expect(
      (screen.getByLabelText(/número de factura/i) as HTMLInputElement)
        .disabled,
    ).toBe(true)
    expect(
      (
        screen.getByLabelText(
          /fecha de entrada a almacén/i,
        ) as HTMLInputElement
      ).disabled,
    ).toBe(true)

    resolveUpload(evidenceUploadedOdc())
    await waitFor(() => expect(upload).toHaveBeenCalledOnce())
  })
})

describe('R12: role x status boundary for upload invoice', () => {
  const validCombination = {
    role: 'DIRECTOR_OPS',
    status: 'EVIDENCIA_PAGO_SUBIDA',
  }

  it.each(
    allRoles.flatMap((role) =>
      ODC_STATUSES.filter(
        (status) =>
          !(role === validCombination.role && status === validCombination.status),
      ).map((status) => [role, status] as const),
    ),
  )('hides the form for role %s and status %s', (role, status) => {
    render(
      <UploadInvoiceForm
        odc={{ ...evidenceUploadedOdc(), status }}
        role={role}
        upload={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )
    expect(screen.queryByLabelText(/archivo de la factura/i)).toBeNull()
  })
})
