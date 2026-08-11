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

describe('R9: DatePicker blur, ARIA and focus passthrough', () => {
  it('forwards input accessibility props, blur and an imperative ref', () => {
    const onBlur = vi.fn()
    const inputRef = { current: null as HTMLInputElement | null }
    render(
      <>
        <label htmlFor="warehouse-date">Fecha de almacén</label>
        <p id="warehouse-date-error">La fecha es obligatoria.</p>
        <DatePicker
          id="warehouse-date"
          label="Fecha de almacén"
          value=""
          onChange={vi.fn()}
          onBlur={onBlur}
          aria-invalid="true"
          aria-describedby="warehouse-date-error"
          inputRef={inputRef}
        />
      </>,
    )

    const input = screen.getByLabelText('Fecha de almacén')
    fireEvent.blur(input)

    expect(onBlur).toHaveBeenCalledOnce()
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe('warehouse-date-error')
    expect(inputRef.current).toBe(input)
  })
})
