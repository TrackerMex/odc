import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'

vi.mock('@/lib/api', () => ({
  login: vi.fn(),
  getMe: vi.fn(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

import { login } from '@/lib/api'
import { LoginForm } from './login-form'

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: email },
  })
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: password },
  })
  fireEvent.submit(screen.getByTestId('login-form'))
}

describe('R7: login form validates email/password with zod before submitting', () => {
  beforeEach(() => {
    vi.mocked(login).mockReset()
  })

  it('shows a validation error and does not call login when the email is malformed', () => {
    render(<LoginForm />)

    fillAndSubmit('not-an-email', 'secret123')

    expect(login).not.toHaveBeenCalled()
    const emailField = screen.getByTestId('email-field')
    expect(within(emailField).getByRole('alert').textContent).not.toBe('')
  })

  it('shows a validation error and does not call login when the password is empty', () => {
    render(<LoginForm />)

    fillAndSubmit('user@example.com', '')

    expect(login).not.toHaveBeenCalled()
    const passwordField = screen.getByTestId('password-field')
    expect(within(passwordField).getByRole('alert').textContent).not.toBe('')
  })
})
