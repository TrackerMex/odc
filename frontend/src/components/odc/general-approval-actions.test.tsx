import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Odc, OdcStatus } from '@/lib/odc'
import { OdcDetail } from './odc-detail'
import { GeneralApprovalActions } from './general-approval-actions'

function pendingOdc(): Odc {
  return {
    id: 'o12',
    odcNumber: 'ODC-2026-00012',
    status: 'PRESUPUESTO_APROBADO',
    description: 'Sensores GPS',
    quantity: 3,
    unit: 'pieza',
    unitPriceCents: 14_990,
    totalCents: 44_970,
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
    createdAt: '2026-07-23T12:00:00.000Z',
    updatedAt: '2026-07-23T12:00:00.000Z',
    history: [
      {
        id: 'h1',
        odcId: 'o12',
        fromStatus: 'PENDIENTE_ADMIN',
        toStatus: 'PRESUPUESTO_APROBADO',
        userId: 'admin',
        note: null,
        createdAt: '2026-07-23T13:00:00.000Z',
      },
    ],
  }
}

function renderActions(odc = pendingOdc(), role = 'DIRECTOR_GENERAL') {
  return render(
    <GeneralApprovalActions
      odc={odc}
      role={role}
      approve={vi.fn()}
      reject={vi.fn()}
      onSuccess={vi.fn()}
    />,
  )
}

describe('R3: pending purchase detail and actions', () => {
  it('shows all ODC data, history and both purchase actions', () => {
    const odc = pendingOdc()
    render(
      <>
        <OdcDetail odc={odc} />
        <GeneralApprovalActions
          odc={odc}
          role="DIRECTOR_GENERAL"
          approve={vi.fn()}
          reject={vi.fn()}
          onSuccess={vi.fn()}
        />
      </>,
    )

    expect(screen.getByRole('heading', { name: odc.odcNumber! })).toBeTruthy()
    expect(screen.getByText(odc.description)).toBeTruthy()
    expect(screen.getByText(odc.supplier)).toBeTruthy()
    expect(screen.getByText(`${odc.quantity} ${odc.unit}`)).toBeTruthy()
    expect(screen.getByText(odc.comments!)).toBeTruthy()
    expect(screen.getByTestId('odc-history')).toBeTruthy()
    expect(screen.getByRole('button', { name: /aprobar compra/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^rechazar$/i })).toBeTruthy()
  })
})

describe('R4: administration validation mark comes only from history', () => {
  it('shows the mark when history transitioned to PRESUPUESTO_APROBADO', () => {
    renderActions()

    expect(screen.getByText('Validado por Administración')).toBeTruthy()
  })

  it('does not infer the mark from the current status', () => {
    renderActions({ ...pendingOdc(), history: [] })

    expect(screen.queryByText('Validado por Administración')).toBeNull()
  })
})

describe('R5: general approval role and status boundary', () => {
  it.each([
    ['DIRECTOR_OPS', 'PRESUPUESTO_APROBADO'],
    ['ADMINISTRACION', 'PRESUPUESTO_APROBADO'],
    ['DIRECTOR_GENERAL', 'BORRADOR'],
    ['DIRECTOR_GENERAL', 'COMPRA_APROBADA'],
    ['DIRECTOR_GENERAL', 'RECHAZADA'],
  ])('hides the panel for role %s and status %s', (role, status) => {
    renderActions({ ...pendingOdc(), status: status as OdcStatus }, role)

    expect(
      screen.queryByRole('heading', { name: /aprobar compra/i }),
    ).toBeNull()
    expect(screen.queryByRole('button', { name: /^rechazar$/i })).toBeNull()
  })
})

describe('R6: approve purchase with server-confirmed state', () => {
  it('blocks duplicate approval and removes the panel after server success', async () => {
    let resolveApproval!: (value: Odc) => void
    const approve = vi.fn(
      () =>
        new Promise<Odc>((resolve) => {
          resolveApproval = resolve
        }),
    )

    function Harness() {
      const [odc, setOdc] = useState(pendingOdc())
      return (
        <>
          <OdcDetail odc={odc} />
          <GeneralApprovalActions
            odc={odc}
            role="DIRECTOR_GENERAL"
            approve={approve}
            reject={vi.fn()}
            onSuccess={setOdc}
          />
        </>
      )
    }

    render(<Harness />)
    const approveButton = screen.getByRole('button', {
      name: /aprobar compra/i,
    })
    fireEvent.click(approveButton)
    fireEvent.click(approveButton)

    expect(approve).toHaveBeenCalledOnce()
    expect(approveButton.hasAttribute('disabled')).toBe(true)
    expect(approveButton.textContent).toMatch(/aprobando/i)

    resolveApproval({ ...pendingOdc(), status: 'COMPRA_APROBADA' })

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /aprobar compra/i }),
      ).toBeNull(),
    )
    expect(screen.getByText('Lista para comprar')).toBeTruthy()
  })
})

describe('R7: accessible rejection dialog and required reason', () => {
  it('keeps the named dialog open and skips the API for a blank reason', () => {
    const reject = vi.fn()
    render(
      <GeneralApprovalActions
        odc={pendingOdc()}
        role="DIRECTOR_GENERAL"
        approve={vi.fn()}
        reject={reject}
        onSuccess={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^rechazar$/i }))

    expect(
      screen.getByRole('dialog', { name: /rechazar compra/i }),
    ).toBeTruthy()
    expect(screen.getByLabelText('Motivo del rechazo')).toBeTruthy()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Motivo del rechazo'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /confirmar rechazo/i }))

    expect(screen.getByRole('alert').textContent).toMatch(
      /motivo.*obligatorio/i,
    )
    expect(
      screen.getByRole('dialog', { name: /rechazar compra/i }),
    ).toBeTruthy()
    expect(reject).not.toHaveBeenCalled()
  })
})

describe('R8: reject purchase with trimmed reason and server state', () => {
  it('blocks duplicate confirmation and updates the detail after success', async () => {
    let resolveRejection!: (value: Odc) => void
    const reject = vi.fn(
      () =>
        new Promise<Odc>((resolve) => {
          resolveRejection = resolve
        }),
    )

    function Harness() {
      const [odc, setOdc] = useState(pendingOdc())
      return (
        <>
          <OdcDetail odc={odc} />
          <GeneralApprovalActions
            odc={odc}
            role="DIRECTOR_GENERAL"
            approve={vi.fn()}
            reject={reject}
            onSuccess={setOdc}
          />
        </>
      )
    }

    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /^rechazar$/i }))
    fireEvent.change(screen.getByLabelText('Motivo del rechazo'), {
      target: { value: '  Compra no prioritaria  ' },
    })
    const confirm = screen.getByRole('button', {
      name: /confirmar rechazo/i,
    })
    fireEvent.click(confirm)
    fireEvent.click(confirm)

    expect(reject).toHaveBeenCalledOnce()
    expect(reject).toHaveBeenCalledWith('Compra no prioritaria')
    expect(confirm.hasAttribute('disabled')).toBe(true)

    resolveRejection({
      ...pendingOdc(),
      status: 'RECHAZADA',
      rejectionReason: 'Compra no prioritaria',
    })

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).toBeNull(),
    )
    expect(screen.getByText('Esta orden necesita correcciones')).toBeTruthy()
    expect(screen.getByText('Compra no prioritaria')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: /aprobar compra/i }),
    ).toBeNull()
  })
})

describe('R9: recoverable purchase decision errors', () => {
  it('keeps the original ODC and restores approval for retry', async () => {
    const approve = vi.fn().mockRejectedValue(new Error('Conflict'))
    render(
      <>
        <OdcDetail odc={pendingOdc()} />
        <GeneralApprovalActions
          odc={pendingOdc()}
          role="DIRECTOR_GENERAL"
          approve={approve}
          reject={vi.fn()}
          onSuccess={vi.fn()}
        />
      </>,
    )

    const button = screen.getByRole('button', { name: /aprobar compra/i })
    fireEvent.click(button)

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(
        /no pudimos aprobar la compra/i,
      ),
    )
    expect(screen.getByText('Presupuesto aprobado')).toBeTruthy()
    expect(button.hasAttribute('disabled')).toBe(false)

    fireEvent.click(button)
    await waitFor(() => expect(approve).toHaveBeenCalledTimes(2))
  })

  it('keeps the entered reason and restores rejection for retry', async () => {
    const reject = vi.fn().mockRejectedValue(new Error('Forbidden'))
    render(
      <GeneralApprovalActions
        odc={pendingOdc()}
        role="DIRECTOR_GENERAL"
        approve={vi.fn()}
        reject={reject}
        onSuccess={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^rechazar$/i }))
    const reason = screen.getByLabelText('Motivo del rechazo')
    fireEvent.change(reason, { target: { value: 'Fuera de presupuesto' } })
    fireEvent.click(screen.getByRole('button', { name: /confirmar rechazo/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(
        /no pudimos rechazar la compra/i,
      ),
    )
    expect((reason as HTMLTextAreaElement).value).toBe('Fuera de presupuesto')
    const confirm = screen.getByRole('button', {
      name: /confirmar rechazo/i,
    })
    expect(confirm.hasAttribute('disabled')).toBe(false)

    fireEvent.click(confirm)
    await waitFor(() => expect(reject).toHaveBeenCalledTimes(2))
  })
})

describe('R10: loading semantics and responsive actions', () => {
  it('announces a pending mutation and disables incompatible controls', () => {
    const approve = vi.fn(() => new Promise<Odc>(() => undefined))
    const { container } = render(
      <GeneralApprovalActions
        odc={pendingOdc()}
        role="DIRECTOR_GENERAL"
        approve={approve}
        reject={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /aprobar compra/i }))

    const busy = container.querySelector('[aria-busy="true"]')
    expect(busy).toBeTruthy()
    expect(busy?.className).toMatch(/flex-col.*sm:flex-row/)
    expect(
      screen.getByRole('button', { name: /aprobando/i }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen.getByRole('button', { name: /^rechazar$/i }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
