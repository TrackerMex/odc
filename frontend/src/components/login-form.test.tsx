import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return { ...actual, login: vi.fn(), getMe: vi.fn() }
})

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return { ...actual, useNavigate: () => navigateMock }
})

import { ApiError, getMe, login } from '@/lib/api'
import { useSessionStore } from '@/stores/session.store'
import { LoginForm } from './login-form'

const loggedInUser = {
  id: 'u1',
  email: 'user@example.com',
  fullName: 'User Example',
  role: 'ADMINISTRACION',
}

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
    useSessionStore.setState({ user: null })
  })

  it('writes the returned user to the session store and navigates to /', async () => {
    vi.mocked(login).mockResolvedValue({ user: loggedInUser })
    render(<LoginForm />)

    fillAndSubmit('user@example.com', 'secret123')

    await vi.waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/' })
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
