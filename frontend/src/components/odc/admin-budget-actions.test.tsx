import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Odc } from '@/lib/odc'
import { AdminBudgetActions } from './admin-budget-actions'

function pendingOdc(): Odc {
  return {
    id: 'o1',
    odcNumber: 'ODC-2026-00001',
    status: 'PENDIENTE_ADMIN',
    description: 'Sensores GPS',
    quantity: 2,
    unit: 'pieza',
    unitPriceCents: 10_000,
    totalCents: 20_000,
    supplier: 'Suntech',
    comments: 'Entrega urgente',
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

describe('R3,R4,R11,R12: budget action visibility and approval', () => {
  it('shows actions only for ADMINISTRACION on PENDIENTE_ADMIN and blocks duplicate approval', async () => {
    let resolveApproval!: (value: Odc) => void
    const approve = vi.fn(
      () =>
        new Promise<Odc>((resolve) => {
          resolveApproval = resolve
        }),
    )
    const onSuccess = vi.fn()
    const odc = pendingOdc()
    const { rerender } = render(
      <AdminBudgetActions
        odc={odc}
        role="ADMINISTRACION"
        approve={approve}
        reject={vi.fn()}
        onSuccess={onSuccess}
      />,
    )

    const approveButton = screen.getByRole('button', {
      name: /aprobar presupuesto/i,
    })
    fireEvent.click(approveButton)
    fireEvent.click(approveButton)
    expect(approve).toHaveBeenCalledOnce()
    expect(approveButton.hasAttribute('disabled')).toBe(true)

    resolveApproval({ ...odc, status: 'PRESUPUESTO_APROBADO' })
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())

    rerender(
      <AdminBudgetActions
        odc={odc}
        role="DIRECTOR_OPS"
        approve={approve}
        reject={vi.fn()}
        onSuccess={onSuccess}
      />,
    )
    expect(
      screen.queryByRole('button', { name: /aprobar presupuesto/i }),
    ).toBeNull()
  })
})

describe('R5,R6,R10,R11: rejection dialog', () => {
  it('requires a reason and submits its trimmed value', async () => {
    const odc = pendingOdc()
    const reject = vi.fn().mockResolvedValue({
      ...odc,
      status: 'RECHAZADA',
      rejectionReason: 'Presupuesto insuficiente',
    })
    const onSuccess = vi.fn()
    render(
      <AdminBudgetActions
        odc={odc}
        role="ADMINISTRACION"
        approve={vi.fn()}
        reject={reject}
        onSuccess={onSuccess}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^rechazar$/i }))
    expect(
      screen.getByRole('dialog', { name: /rechazar presupuesto/i }),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /confirmar rechazo/i }))
    expect(screen.getByRole('alert').textContent).toMatch(
      /motivo.*obligatorio/i,
    )
    expect(reject).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/motivo del rechazo/i), {
      target: { value: '  Presupuesto insuficiente  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /confirmar rechazo/i }))

    await waitFor(() =>
      expect(reject).toHaveBeenCalledWith('Presupuesto insuficiente'),
    )
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'RECHAZADA' }),
    )
  })

  it('keeps the reason and original status after a server failure', async () => {
    const reject = vi.fn().mockRejectedValue(new Error('Conflict'))
    render(
      <AdminBudgetActions
        odc={pendingOdc()}
        role="ADMINISTRACION"
        approve={vi.fn()}
        reject={reject}
        onSuccess={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /^rechazar$/i }))
    const reason = screen.getByLabelText(/motivo del rechazo/i)
    fireEvent.change(reason, { target: { value: 'Duplicada' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar rechazo/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(
        /no pudimos rechazar/i,
      ),
    )
    expect((reason as HTMLTextAreaElement).value).toBe('Duplicada')
    expect(
      screen
        .getByRole('button', { name: /confirmar rechazo/i })
        .hasAttribute('disabled'),
    ).toBe(false)
  })
})

describe('R10: approval errors remain recoverable', () => {
  it('keeps the pending state and restores the approval action for retry', async () => {
    const approve = vi.fn().mockRejectedValue(new Error('Conflict'))
    render(
      <AdminBudgetActions
        odc={pendingOdc()}
        role="ADMINISTRACION"
        approve={approve}
        reject={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /aprobar presupuesto/i }),
    )

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(
        /no pudimos aprobar/i,
      ),
    )
    expect(
      screen
        .getByRole('button', { name: /aprobar presupuesto/i })
        .hasAttribute('disabled'),
    ).toBe(false)
  })
})
