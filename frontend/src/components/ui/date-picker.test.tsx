import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker } from './date-picker'

describe('DatePicker', () => {
  it('keeps an accessible text field and opens the calendar selector', () => {
    const onChange = vi.fn()
    render(
      <>
        <label htmlFor="payment-date">Fecha de pago</label>
        <DatePicker
          id="payment-date"
          label="Fecha de pago"
          value=""
          onChange={onChange}
        />
      </>,
    )

    fireEvent.change(screen.getByLabelText('Fecha de pago'), {
      target: { value: '2026-07-22' },
    })
    expect(onChange).toHaveBeenCalledWith('2026-07-22')

    fireEvent.click(
      screen.getByRole('button', { name: 'Abrir selector de fecha' }),
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(
      screen.getByText('Selecciona la fecha en el calendario.'),
    ).toBeTruthy()
  })
})
