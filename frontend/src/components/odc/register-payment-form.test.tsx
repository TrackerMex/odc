import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Odc, OdcStatus } from '@/lib/odc'
import type { SessionUser } from '@/lib/session'
import { RegisterPaymentForm } from './register-payment-form'

function approvedOdc(): Odc {
  return {
    id: 'o1',
    odcNumber: 'ODC-2026-00001',
    status: 'COMPRA_APROBADA',
    description: 'Sensores GPS',
    quantity: 2,
    unit: 'pieza',
    unitPriceCents: 10_000,
    totalCents: 20_000,
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
    createdAt: '2026-07-22T12:00:00.000Z',
    updatedAt: '2026-07-22T12:00:00.000Z',
    history: [],
  }
}

const otherRoles: Array<SessionUser['role']> = [
  'ADMINISTRACION',
  'DIRECTOR_GENERAL',
]

const otherStatuses: OdcStatus[] = [
  'BORRADOR',
  'PENDIENTE_ADMIN',
  'PAGO_REGISTRADO',
]

describe('R1: register payment form visibility and fields', () => {
  it('shows all fields to DIRECTOR_OPS on COMPRA_APROBADA', () => {
    render(
      <RegisterPaymentForm
        odc={approvedOdc()}
        role="DIRECTOR_OPS"
        register={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/fecha de pago/i)).toBeTruthy()
    expect(screen.getByLabelText(/método de pago/i)).toBeTruthy()
    expect(screen.getByLabelText(/^referencia$/i)).toBeTruthy()
    expect(screen.getByLabelText(/^notas$/i)).toBeTruthy()
  })

  it.each(otherRoles)(
    'is not rendered for role %s even on COMPRA_APROBADA',
    (role) => {
      render(
        <RegisterPaymentForm
          odc={approvedOdc()}
          role={role}
          register={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )
      expect(screen.queryByLabelText(/fecha de pago/i)).toBeNull()
    },
  )

  it.each(otherStatuses)(
    'is not rendered for DIRECTOR_OPS when status is %s',
    (status) => {
      render(
        <RegisterPaymentForm
          odc={{ ...approvedOdc(), status }}
          role="DIRECTOR_OPS"
          register={vi.fn()}
          onSuccess={vi.fn()}
        />,
      )
      expect(screen.queryByLabelText(/fecha de pago/i)).toBeNull()
    },
  )
})

describe('R2: required field validation on register payment', () => {
  function fillOptionalFields() {
    fireEvent.change(screen.getByLabelText(/^referencia$/i), {
      target: { value: 'SPEI-100' },
    })
    fireEvent.change(screen.getByLabelText(/^notas$/i), {
      target: { value: 'Pago parcial' },
    })
  }

  it('blocks submit without a payment date', () => {
    const register = vi.fn()
    render(
      <RegisterPaymentForm
        odc={approvedOdc()}
        role="DIRECTOR_OPS"
        register={register}
        onSuccess={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText(/método de pago/i), {
      target: { value: 'Transferencia' },
    })
    fillOptionalFields()
    fireEvent.click(screen.getByRole('button', { name: /registrar pago/i }))

    expect(screen.getByRole('alert').textContent).toMatch(/fecha de pago/i)
    expect(register).not.toHaveBeenCalled()
    expect(
      (screen.getByLabelText(/^referencia$/i) as HTMLInputElement).value,
    ).toBe('SPEI-100')
    expect(
      (screen.getByLabelText(/^notas$/i) as HTMLTextAreaElement).value,
    ).toBe('Pago parcial')
  })

  it('blocks submit without a payment method', () => {
    const register = vi.fn()
    render(
      <RegisterPaymentForm
        odc={approvedOdc()}
        role="DIRECTOR_OPS"
        register={register}
        onSuccess={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText(/fecha de pago/i), {
      target: { value: '2026-07-22' },
    })
    fillOptionalFields()
    fireEvent.click(screen.getByRole('button', { name: /registrar pago/i }))

    expect(screen.getByRole('alert').textContent).toMatch(/método de pago/i)
    expect(register).not.toHaveBeenCalled()
  })

  it('blocks submit when the payment method is only whitespace', () => {
    const register = vi.fn()
    render(
      <RegisterPaymentForm
        odc={approvedOdc()}
        role="DIRECTOR_OPS"
        register={register}
        onSuccess={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText(/fecha de pago/i), {
      target: { value: '2026-07-22' },
    })
    fireEvent.change(screen.getByLabelText(/método de pago/i), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /registrar pago/i }))

    expect(screen.getByRole('alert').textContent).toMatch(/método de pago/i)
    expect(register).not.toHaveBeenCalled()
  })
})

describe('R3: register payment submission and confirmed transition', () => {
  it('sends a single request with trimmed optional fields and applies the server result', async () => {
    let resolveRegister!: (value: Odc) => void
    const register = vi.fn(
      () =>
        new Promise<Odc>((resolve) => {
          resolveRegister = resolve
        }),
    )
    const onSuccess = vi.fn()
    render(
      <RegisterPaymentForm
        odc={approvedOdc()}
        role="DIRECTOR_OPS"
        register={register}
        onSuccess={onSuccess}
      />,
    )
    fireEvent.change(screen.getByLabelText(/fecha de pago/i), {
      target: { value: '2026-07-22' },
    })
    fireEvent.change(screen.getByLabelText(/método de pago/i), {
      target: { value: 'Transferencia' },
    })
    fireEvent.change(screen.getByLabelText(/^referencia$/i), {
      target: { value: '  SPEI-100  ' },
    })
    const submit = screen.getByRole('button', { name: /registrar pago/i })
    fireEvent.click(submit)
    fireEvent.click(submit)

    expect(register).toHaveBeenCalledOnce()
    expect(register).toHaveBeenCalledWith({
      paymentDate: '2026-07-22',
      paymentMethod: 'Transferencia',
      paymentReference: 'SPEI-100',
    })
    expect(submit.hasAttribute('disabled')).toBe(true)

    resolveRegister({ ...approvedOdc(), status: 'PAGO_REGISTRADO' })
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })
})

describe('R11: loading state and accessibility of register payment', () => {
  it('marks the form busy and disables its controls while the request is pending', async () => {
    let resolveRegister!: (value: Odc) => void
    const register = vi.fn(
      () =>
        new Promise<Odc>((resolve) => {
          resolveRegister = resolve
        }),
    )
    render(
      <RegisterPaymentForm
        odc={approvedOdc()}
        role="DIRECTOR_OPS"
        register={register}
        onSuccess={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText(/fecha de pago/i), {
      target: { value: '2026-07-22' },
    })
    fireEvent.change(screen.getByLabelText(/método de pago/i), {
      target: { value: 'Transferencia' },
    })
    fireEvent.click(screen.getByRole('button', { name: /registrar pago/i }))

    const form = screen.getByRole('button', {
      name: /registrando/i,
    }).closest('form')
    expect(form?.getAttribute('aria-busy')).toBe('true')
    expect(
      (screen.getByLabelText(/fecha de pago/i) as HTMLInputElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByLabelText(/método de pago/i) as HTMLInputElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByLabelText(/^referencia$/i) as HTMLInputElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByLabelText(/^notas$/i) as HTMLTextAreaElement).disabled,
    ).toBe(true)

    resolveRegister({ ...approvedOdc(), status: 'PAGO_REGISTRADO' })
    await waitFor(() => expect(register).toHaveBeenCalledOnce())
  })
})

describe('R4: recoverable errors on register payment', () => {
  it('preserves the entered values and re-enables the form after a failed request', async () => {
    const register = vi.fn().mockRejectedValue(new Error('Network'))
    render(
      <RegisterPaymentForm
        odc={approvedOdc()}
        role="DIRECTOR_OPS"
        register={register}
        onSuccess={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText(/fecha de pago/i), {
      target: { value: '2026-07-22' },
    })
    fireEvent.change(screen.getByLabelText(/método de pago/i), {
      target: { value: 'Transferencia' },
    })
    fireEvent.click(screen.getByRole('button', { name: /registrar pago/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(
        /no pudimos registrar/i,
      ),
    )
    expect(
      (screen.getByLabelText(/fecha de pago/i) as HTMLInputElement).value,
    ).toBe('2026-07-22')
    expect(
      (screen.getByLabelText(/método de pago/i) as HTMLInputElement).value,
    ).toBe('Transferencia')
    expect(
      screen
        .getByRole('button', { name: /registrar pago/i })
        .hasAttribute('disabled'),
    ).toBe(false)
  })
})
