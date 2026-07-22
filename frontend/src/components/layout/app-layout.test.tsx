import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { logout } from '@/lib/api'
import type * as ApiModule from '@/lib/api'
import { useSessionStore } from '@/stores/session.store'
import type * as RouterModule from '@tanstack/react-router'
import { AppLayout } from './app-layout'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return { ...actual, logout: vi.fn() }
})

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return { ...actual, useNavigate: () => navigateMock }
})

const user = {
  id: 'u1',
  fullName: 'Ana Perez',
  email: 'ana.perez@example.com',
  role: 'DIRECTOR_OPS',
}

describe('R11: authenticated layout shows fullName/role and a logout control, no section nav', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    vi.mocked(logout).mockReset()
  })

  it('renders the user fullName and role with a logout control, without project/team nav', () => {
    render(
      <AppLayout user={user}>
        <div>protected content</div>
      </AppLayout>,
    )

    expect(screen.getByText(user.fullName)).toBeTruthy()
    expect(screen.getByText(user.role)).toBeTruthy()

    // Opens the nav-user dropdown to reveal the logout control.
    fireEvent.click(screen.getByText(user.fullName))
    expect(screen.getByText('Cerrar sesión')).toBeTruthy()

    expect(screen.queryByText(/proyectos/i)).toBeNull()
    expect(screen.queryByText(/equipos/i)).toBeNull()
  })
})

describe('R12: logout calls the API, clears the session store and navigates to /login', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    vi.mocked(logout).mockReset()
    useSessionStore.setState({ user })
  })

  it('logs out, clears the store and navigates to /login', async () => {
    vi.mocked(logout).mockResolvedValue({ success: true })
    render(
      <AppLayout user={user}>
        <div>protected content</div>
      </AppLayout>,
    )

    fireEvent.click(screen.getByText(user.fullName))
    fireEvent.click(screen.getByText('Cerrar sesión'))

    await vi.waitFor(() => {
      expect(logout).toHaveBeenCalled()
    })
    expect(useSessionStore.getState().user).toBeNull()
    expect(navigateMock).toHaveBeenCalledWith({ to: '/login' })
  })
})
