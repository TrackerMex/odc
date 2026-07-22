import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ApiError } from '@/lib/api'
import type { Odc, Supplier } from '@/lib/odc'
import { OdcForm } from './odc-form'

const suppliers: Supplier[] = [
  { id: 's1', name: 'Suntech' },
  { id: 's2', name: 'Teltonika' },
]

function rejectedOdc(): Odc {
  return {
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
    history: [],
  }
}

const user = {
  id: 'u1',
  email: 'ops@odc.local',
  fullName: 'Ana Pérez',
  role: 'DIRECTOR_OPS',
}

describe('R2,R3,R4,R5,R6: ODC form metadata, fields and live total', () => {
  it('shows the server-assigned number hint, accessible labels and live MXN total', () => {
    render(
      <OdcForm
        user={user}
        suppliers={suppliers}
        persist={vi.fn()}
        submit={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    expect(screen.getByText(/se asignará al guardar/i)).toBeTruthy()
    expect(screen.getByText(user.fullName)).toBeTruthy()
    expect(screen.getByLabelText(/descripción/i)).toBeTruthy()
    expect(screen.getByLabelText(/cantidad/i)).toBeTruthy()
    expect(screen.getByLabelText(/unidad/i)).toBeTruthy()
    expect(screen.getByLabelText(/precio unitario/i)).toBeTruthy()
    expect(screen.getByLabelText(/proveedor/i)).toBeTruthy()
    expect(screen.getByLabelText(/comentarios/i)).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/cantidad/i), {
      target: { value: '3' },
    })
    fireEvent.change(screen.getByLabelText(/precio unitario/i), {
      target: { value: '149.90' },
    })

    expect(screen.getByTestId('odc-total').textContent).toMatch(/449[.,]70/)
  })

  it('selects a catalog supplier and creates before submitting a new ODC', async () => {
    const draft = rejectedOdc()
    draft.status = 'BORRADOR'
    const sent = { ...draft, status: 'PENDIENTE_ADMIN' as const }
    const persist = vi.fn().mockResolvedValue(draft)
    const submit = vi.fn().mockResolvedValue(sent)
    const onSuccess = vi.fn()
    render(
      <OdcForm
        user={user}
        suppliers={suppliers}
        persist={persist}
        submit={submit}
        onSuccess={onSuccess}
      />,
    )

    fireEvent.change(screen.getByLabelText(/descripción/i), {
      target: { value: 'Sensores GPS' },
    })
    fireEvent.change(screen.getByLabelText(/cantidad/i), {
      target: { value: '3' },
    })
    fireEvent.change(screen.getByLabelText(/unidad/i), {
      target: { value: 'pieza' },
    })
    fireEvent.change(screen.getByLabelText(/precio unitario/i), {
      target: { value: '149.90' },
    })
    fireEvent.click(screen.getByRole('combobox', { name: /proveedor/i }))
    fireEvent.click(await screen.findByRole('option', { name: 'Suntech' }))
    fireEvent.click(
      screen.getByRole('button', { name: /enviar a administración/i }),
    )

    await vi.waitFor(() => expect(persist).toHaveBeenCalled())
    expect(persist.mock.calls[0][0]).toMatchObject({ supplier: 'Suntech' })
    expect(submit).toHaveBeenCalledWith('o1')
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith(sent))
  })

  it('announces field errors and never persists invalid values', () => {
    const persist = vi.fn()
    render(
      <OdcForm
        user={user}
        suppliers={suppliers}
        persist={persist}
        submit={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /guardar como borrador/i }),
    )

    expect(persist).not.toHaveBeenCalled()
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
  })
})

describe('R8,R9,R10,R11: rejected ODC editing, resend and failures', () => {
  beforeEach(() => vi.clearAllMocks())

  it('prefills rejected values, persists the PATCH payload and then submits', async () => {
    const initialOdc = rejectedOdc()
    const updated = { ...initialOdc, description: 'Sensores GPS actualizados' }
    const submitted = { ...updated, status: 'PENDIENTE_ADMIN' as const }
    const persist = vi.fn().mockResolvedValue(updated)
    const submit = vi.fn().mockResolvedValue(submitted)
    const onSuccess = vi.fn()

    render(
      <OdcForm
        user={user}
        suppliers={suppliers}
        initialOdc={initialOdc}
        persist={persist}
        submit={submit}
        onSuccess={onSuccess}
      />,
    )

    expect(screen.getByDisplayValue('Sensores GPS')).toBeTruthy()
    expect(screen.getByDisplayValue('149.90')).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/descripción/i), {
      target: { value: 'Sensores GPS actualizados' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /enviar a administración/i }),
    )

    await vi.waitFor(() => expect(persist).toHaveBeenCalled())
    expect(persist.mock.calls[0][0]).toMatchObject({
      description: 'Sensores GPS actualizados',
      unitPriceCents: 14_990,
      supplier: 'Suntech',
    })
    expect(submit).toHaveBeenCalledWith('o1')
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith(submitted))
  })

  it('preserves the form, skips submit after PATCH failure and reports a Spanish error', async () => {
    const persist = vi
      .fn()
      .mockRejectedValue(new ApiError(409, 'Invalid transition'))
    const submit = vi.fn()

    render(
      <OdcForm
        user={user}
        suppliers={suppliers}
        initialOdc={rejectedOdc()}
        persist={persist}
        submit={submit}
        onSuccess={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText(/descripción/i), {
      target: { value: 'Valor que debe conservarse' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /enviar a administración/i }),
    )

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(/estado de la odc cambió/i)).toBeTruthy()
    expect(screen.getByDisplayValue('Valor que debe conservarse')).toBeTruthy()
    expect(submit).not.toHaveBeenCalled()
  })
})
