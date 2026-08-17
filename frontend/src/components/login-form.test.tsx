import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ApiError, getMe, login } from '@/lib/api'
import type * as ApiModule from '@/lib/api'
import { useSessionStore } from '@/stores/session.store'
import type * as RouterModule from '@tanstack/react-router'
import { LoginForm } from './login-form'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return { ...actual, login: vi.fn(), getMe: vi.fn() }
})

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

const loggedInUser = {
  id: 'u1',
  email: 'user@example.com',
  fullName: 'User Example',
  role: 'ADMINISTRACION',
}

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: email },
  })
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: password },
  })
  fireEvent.submit(screen.getByTestId('login-form'))
}

describe('R1: login field labels are in Spanish and keep their association', () => {
  it('labels the email and password inputs with their Spanish text', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText('Correo electrónico').id).toBe('email')
    expect(screen.getByLabelText('Contraseña').id).toBe('password')
  })
})

describe('R2: login validation messages are in Spanish', () => {
  it('shows the Spanish message when the email is malformed', () => {
    render(<LoginForm />)

    fillAndSubmit('not-an-email', 'secret123')

    const emailField = screen.getByTestId('email-field')
    expect(within(emailField).getByRole('alert').textContent).toBe(
      'Ingresa un correo electrónico válido.',
    )
  })

  it('shows the Spanish message when the password is empty', () => {
    render(<LoginForm />)

    fillAndSubmit('user@example.com', '')

    const passwordField = screen.getByTestId('password-field')
    expect(within(passwordField).getByRole('alert').textContent).toBe(
      'Ingresa tu contraseña.',
    )
  })
})

describe('R7: login form validates email/password with zod before submitting', () => {
  beforeEach(() => {
    vi.mocked(login).mockReset()
    vi.mocked(getMe).mockReset()
    navigateMock.mockReset()
    useSessionStore.setState({ user: null })
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

describe('R8: successful login stores the user and navigates to / without re-calling getMe', () => {
  beforeEach(() => {
    vi.mocked(login).mockReset()
    vi.mocked(getMe).mockReset()
    navigateMock.mockReset()
    navigateMock.mockResolvedValue(undefined)
    useSessionStore.setState({ user: null })
  })

  it('stores the user and awaits navigation from a clean login document', async () => {
    vi.mocked(login).mockResolvedValue({ user: loggedInUser })
    render(<LoginForm />)

    fillAndSubmit('user@example.com', 'secret123')

    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: '/',
        replace: true,
      })
    })
    expect(useSessionStore.getState().user).toEqual(loggedInUser)
    expect(getMe).not.toHaveBeenCalled()
  })
})

describe('R9: failed login (401) keeps the user on /login with an error, store untouched', () => {
  beforeEach(() => {
    vi.mocked(login).mockReset()
    vi.mocked(getMe).mockReset()
    navigateMock.mockReset()
    useSessionStore.setState({ user: null })
  })

  it('shows an error message, leaves the store empty and does not navigate', async () => {
    vi.mocked(login).mockRejectedValue(new ApiError(401, 'Invalid credentials'))
    render(<LoginForm />)

    fillAndSubmit('user@example.com', 'wrong-password')

    await screen.findByText(/correo o contraseña incorrectos/i)
    expect(useSessionStore.getState().user).toBeNull()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})

describe('R6,R12: login blur validation, focus and pending state', () => {
  beforeEach(() => {
    vi.mocked(login).mockReset()
    navigateMock.mockReset()
    useSessionStore.setState({ user: null })
  })

  it('validates each blurred field with stable accessible associations', () => {
    render(<LoginForm />)
    const email = screen.getByLabelText('Correo electrónico')
    fireEvent.change(email, { target: { value: 'not-an-email' } })
    fireEvent.blur(email)

    const emailError = within(screen.getByTestId('email-field')).getByRole(
      'alert',
    )
    expect(emailError.id).toBe('email-error')
    expect(email.getAttribute('aria-invalid')).toBe('true')
    expect(email.getAttribute('aria-describedby')).toBe(emailError.id)
    expect(
      within(screen.getByTestId('password-field')).queryByRole('alert'),
    ).toBeNull()
  })

  it('focuses the email field first when submit contains multiple invalid fields', () => {
    render(<LoginForm />)
    fireEvent.submit(screen.getByTestId('login-form'))
    expect(document.activeElement).toBe(
      screen.getByLabelText('Correo electrónico'),
    )
  })

  it('marks the form busy, disables controls and blocks duplicate login requests', () => {
    vi.mocked(login).mockImplementation(() => new Promise(() => undefined))
    render(<LoginForm />)
    fillAndSubmit('user@example.com', 'secret123')
    fireEvent.submit(screen.getByTestId('login-form'))

    expect(login).toHaveBeenCalledOnce()
    expect(screen.getByTestId('login-form').getAttribute('aria-busy')).toBe(
      'true',
    )
    expect(screen.getByLabelText('Correo electrónico').disabled).toBe(true)
    expect(screen.getByLabelText('Contraseña').disabled).toBe(true)
    expect(
      screen
        .getByRole('button', { name: /ingresando/i })
        .hasAttribute('disabled'),
    ).toBe(true)
  })
})
