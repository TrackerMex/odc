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
