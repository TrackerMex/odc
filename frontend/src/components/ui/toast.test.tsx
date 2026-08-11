import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createToastManager, Toaster } from './toast'

describe('Toaster', () => {
  it('renders a success confirmation from its toast manager', async () => {
    const toastManager = createToastManager()
    render(<Toaster toastManager={toastManager} />)

    toastManager.add({
      type: 'success',
      title: 'Pago registrado',
      description: 'Administración ya puede adjuntar el comprobante.',
    })

    await waitFor(() =>
      expect(screen.getByText('Pago registrado')).toBeTruthy(),
    )
    expect(
      screen.getByText('Administración ya puede adjuntar el comprobante.'),
    ).toBeTruthy()
  })
})

describe('R13: semantic toast radius', () => {
  it('uses rounded-card without important or oversized radius classes', async () => {
    const toastManager = createToastManager()
    render(<Toaster toastManager={toastManager} />)

    toastManager.add({ title: 'Guardado' })

    const root = await screen.findByText('Guardado')
    const toastRoot = root.closest('[data-slot="toast"]')
    expect(toastRoot?.className).toMatch(/rounded-card/)
    expect(toastRoot?.className).not.toMatch(/rounded-2xl|!important|\w+!\b/)
  })
})
