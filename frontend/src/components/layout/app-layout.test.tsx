import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { logout } from '@/lib/api'
import type * as ApiModule from '@/lib/api'
import { useSessionStore } from '@/stores/session.store'
import type * as RouterModule from '@tanstack/react-router'
import { AppLayout } from './app-layout'
import { ThemeProvider } from '@/lib/theme'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return { ...actual, logout: vi.fn() }
})

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof RouterModule>()
  return {
    ...actual,
    Link: ({ children, to, viewTransition, ...props }: any) => (
      <a
        href={to}
        data-view-transition={viewTransition ? 'true' : undefined}
        {...props}
      >
        {children}
      </a>
    ),
    useNavigate: () => navigateMock,
  }
})

const user = {
  id: 'u1',
  fullName: 'Ana Perez',
  email: 'ana.perez@example.com',
  role: 'DIRECTOR_OPS',
}

function renderAppLayout() {
  return render(
    <ThemeProvider>
      <AppLayout user={user}>
        <div>protected content</div>
      </AppLayout>
    </ThemeProvider>,
  )
}

describe('R11: authenticated layout shows fullName/role and a logout control, no section nav', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    vi.mocked(logout).mockReset()
  })

  it('renders the user fullName and role with a logout control, without project/team nav', () => {
    renderAppLayout()

    expect(screen.getByText(user.fullName)).toBeTruthy()
    expect(screen.getByText(user.role)).toBeTruthy()

    // Opens the nav-user dropdown to reveal the logout control.
    fireEvent.click(screen.getByText(user.fullName))
    expect(screen.getByText('Cerrar sesión')).toBeTruthy()

    expect(screen.queryByText(/proyectos/i)).toBeNull()
    expect(screen.queryByText(/equipos/i)).toBeNull()
  })
})

describe('route navigation', () => {
  it('uses SPA links with view transitions while keeping the work area isolated', () => {
    renderAppLayout()

    expect(
      screen.getByRole('link', { name: 'Nueva orden' }).getAttribute('href'),
    ).toBe('/odcs/new')
    expect(
      screen
        .getByRole('link', { name: 'Nueva orden' })
        .getAttribute('data-view-transition'),
    ).toBe('true')
    expect(document.querySelector('.odc-route-content')).toBeTruthy()
  })
})

describe('R5,R12: logout calls the API, clears the session store and navigates to /login', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    vi.mocked(logout).mockReset()
    useSessionStore.setState({ user })
  })

  it('logs out, clears the store and navigates to /login', async () => {
    vi.mocked(logout).mockResolvedValue({ success: true })
    renderAppLayout()

    fireEvent.click(screen.getByText(user.fullName))
    fireEvent.click(screen.getByText('Cerrar sesión'))

    await vi.waitFor(() => {
      expect(logout).toHaveBeenCalled()
    })
    expect(useSessionStore.getState().user).toBeNull()
    expect(navigateMock).toHaveBeenCalledWith({
      to: '/login',
      replace: true,
      reloadDocument: true,
    })
  })
})
