import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import type { ReactElement } from 'react'
import type { Root } from 'react-dom/client'
import type { Odc } from '@/lib/odc'
import type { SessionUser } from '@/lib/session'
import { OdcDetail } from './odc-detail'
import { OdcForm } from './odc-form'

const NativeDateTimeFormat = Intl.DateTimeFormat
const mounted: Array<{ root: Root; container: HTMLDivElement }> = []
const user: SessionUser = {
  id: 'ops',
  email: 'ops@odc.local',
  fullName: 'Ana Pérez',
  role: 'DIRECTOR_OPS',
}

function persistedOdc(): Odc {
  return {
    id: 'o1',
    odcNumber: 'ODC-2026-00001',
    status: 'BORRADOR',
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
    createdAt: '2026-01-01T05:30:00.000Z',
    updatedAt: '2026-01-01T06:30:00.000Z',
    history: [
      {
        id: 'h1',
        odcId: 'o1',
        fromStatus: null,
        toStatus: 'BORRADOR',
        userId: 'ops',
        note: 'Creación persistida',
        createdAt: '2026-01-01T05:30:00.000Z',
      },
    ],
  }
}

function mexicoInstant(value: string) {
  return new NativeDateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  }).format(new Date(value))
}

async function hydrateAcrossEnvironments(
  content: ReactElement,
  clientTimeZone: string,
) {
  let defaultTimeZone = 'UTC'
  // Vitest threads do not change ICU's default zone with process.env.TZ.
  // Override only the implicit environment default; explicit application zones win.
  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(
    function (locales, options) {
      return new NativeDateTimeFormat(locales, {
        ...options,
        timeZone: options?.timeZone ?? defaultTimeZone,
      })
    },
  )
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2025-12-31T23:59:59.000Z'))
  const container = document.createElement('div')
  vi.stubGlobal('window', undefined)
  try {
    container.innerHTML = renderToString(content)
  } finally {
    vi.unstubAllGlobals()
  }
  const serverText = container.textContent
  document.body.appendChild(container)
  defaultTimeZone = clientTimeZone
  vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'))
  const onRecoverableError = vi.fn()
  await act(async () => {
    const root = hydrateRoot(container, content, { onRecoverableError })
    mounted.push({ root, container })
  })
  return { container, serverText, onRecoverableError }
}

afterEach(async () => {
  for (const { root, container } of mounted.splice(0)) {
    await act(async () => root.unmount())
    container.remove()
  }
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('odc-detail-history-hydration R4,R7: SSR and hydration of persisted instants', () => {
  it.each(['America/Mexico_City', 'Asia/Tokyo'])(
    'hydrates detail from UTC into %s with identical creation, update and history text',
    async (clientTimeZone) => {
      const odc = persistedOdc()
      const { container, serverText, onRecoverableError } =
        await hydrateAcrossEnvironments(<OdcDetail odc={odc} />, clientTimeZone)

      expect(onRecoverableError).not.toHaveBeenCalled()
      expect(container.textContent).toBe(serverText)
      expect(
        screen.getByText(`Creada ${mexicoInstant(odc.createdAt!)}`),
      ).toBeTruthy()
      const updatedRow = screen.getByText('Última actualización').parentElement!
      expect(
        within(updatedRow).getByText(mexicoInstant(odc.updatedAt!)),
      ).toBeTruthy()
      expect(
        within(screen.getByTestId('odc-history')).getByText(
          mexicoInstant(odc.history[0].createdAt!),
        ),
      ).toBeTruthy()
    },
  )

  it('hydrates an existing form and keeps editing, validation and save operational', async () => {
    const odc = persistedOdc()
    const saved = { ...odc, description: 'Sensores actualizados' }
    const persist = vi.fn().mockResolvedValue(saved)
    const onSuccess = vi.fn()
    const { container, serverText, onRecoverableError } =
      await hydrateAcrossEnvironments(
        <OdcForm
          user={user}
          suppliers={[{ id: 's1', name: 'Suntech' }]}
          initialOdc={odc}
          persist={persist}
          submit={vi.fn()}
          onSuccess={onSuccess}
        />,
        'Asia/Tokyo',
      )

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.textContent).toBe(serverText)
    expect(screen.getByText(mexicoInstant(odc.createdAt!))).toBeTruthy()
    const description =
      screen.getByLabelText<HTMLTextAreaElement>(/descripción/i)
    fireEvent.change(description, { target: { value: '' } })
    fireEvent.click(
      screen.getByRole('button', { name: /guardar como borrador/i }),
    )
    expect(screen.getByText('La descripción es obligatoria.')).toBeTruthy()
    expect(persist).not.toHaveBeenCalled()
    fireEvent.change(description, { target: { value: saved.description } })
    fireEvent.click(
      screen.getByRole('button', { name: /guardar como borrador/i }),
    )
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledWith(saved))
    expect(persist).toHaveBeenCalledOnce()
    expect(persist.mock.calls[0][0]).toMatchObject({
      description: saved.description,
    })
  })
})

describe('odc-detail-history-hydration R5,R7: calendar dates visible after hydration', () => {
  it.each(['America/Mexico_City', 'Asia/Tokyo'])(
    'preserves payment, invoice and warehouse calendar days from UTC into %s',
    async (clientTimeZone) => {
      const odc = {
        ...persistedOdc(),
        paymentDate: '2024-02-29',
        paymentMethod: 'Transferencia',
        invoiceNumber: 'FAC-1',
        invoiceDate: '2026-12-31',
        warehouseEntryDate: '2027-01-01',
      }
      const { container, serverText, onRecoverableError } =
        await hydrateAcrossEnvironments(<OdcDetail odc={odc} />, clientTimeZone)
      expect(onRecoverableError).not.toHaveBeenCalled()
      expect(container.textContent).toBe(serverText)
      for (const [label, text] of [
        ['Fecha de pago', '29 feb 2024'],
        ['Fecha de factura', '31 dic 2026'],
        ['Fecha de entrada a almacén', '1 ene 2027'],
      ]) {
        expect(
          within(screen.getByText(label).parentElement!).getByText(text),
        ).toBeTruthy()
      }
    },
  )

  it('keeps null calendar dates pending without a hydration recovery', async () => {
    const odc = {
      ...persistedOdc(),
      paymentMethod: 'Transferencia',
      invoiceNumber: 'FAC-1',
    }
    const { onRecoverableError } = await hydrateAcrossEnvironments(
      <OdcDetail odc={odc} />,
      'Asia/Tokyo',
    )
    expect(onRecoverableError).not.toHaveBeenCalled()
    for (const label of [
      'Fecha de pago',
      'Fecha de factura',
      'Fecha de entrada a almacén',
    ]) {
      expect(
        within(screen.getByText(label).parentElement!).getByText('Pendiente'),
      ).toBeTruthy()
    }
  })
})
