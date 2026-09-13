import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { logout } from '@/lib/api'
import type * as ApiModule from '@/lib/api'
import { useSessionStore } from '@/stores/session.store'
import type * as RouterModule from '@tanstack/react-router'
import { AppLayout } from './app-layout'
import { THEME_STORAGE_KEY, ThemeProvider } from '@/lib/theme'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return {
    ...actual,
    logout: vi.fn(),
    getNotifications: vi.fn().mockResolvedValue({ items: [], unreadCount: 0 }),
    markNotificationsRead: vi.fn().mockResolvedValue({ success: true }),
  }
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

function renderAppLayout(pathname = '/', role = user.role) {
  return render(
    <ThemeProvider>
      <AppLayout user={{ ...user, role }} pathname={pathname}>
        <div>protected content</div>
      </AppLayout>
    </ThemeProvider>,
  )
}

describe('executive-workspace-v2 R1: persistent navigation', () => {
  it('keeps an opaque sticky header below dialogs and above route content', () => {
    renderAppLayout('/odcs/order-1')
    const header = screen.getByRole('navigation', { name: 'Ubicación actual' }).closest('header')!
    expect(header.className).toContain('sticky')
    expect(header.className).toContain('top-0')
    expect(header.className).toContain('bg-card')
    expect(header.className).toContain('z-20')
  })
})

describe('R1: frontend-dashboard-template shell preserves route context, permissions and controls', () => {
  it.each([
    ['/', 'Resumen ejecutivo'],
    ['/tasks', 'Mis tareas'],
    ['/odcs/new', 'Nueva orden'],
    ['/odcs/uncached-order', 'Detalle de orden'],
    ['/monthly-summary', 'Resumen mensual'],
  ])('identifies %s without fetching an order folio', (pathname, title) => {
    renderAppLayout(pathname)

    const breadcrumb = screen.getByRole('navigation', {
      name: 'Ubicación actual',
    })
    expect(
      within(breadcrumb).getByText(title).getAttribute('aria-current'),
    ).toBe('page')
    expect(screen.getAllByText('TrackerMex').length).toBeGreaterThan(0)
    expect(screen.getByText('ODC')).toBeTruthy()
    expect(screen.getByText('protected content')).toBeTruthy()
  })

  it.each(['DIRECTOR_OPS', 'ADMINISTRACION', 'DIRECTOR_GENERAL'])(
    'offers active tasks and only permitted links to %s',
    (role) => {
      renderAppLayout('/tasks', role)

      expect(
        screen.getByRole('link', { name: 'Mis tareas' }).getAttribute('href'),
      ).toBe('/tasks')
      expect(
        screen
          .getByRole('link', { name: 'Mis tareas' })
          .getAttribute('aria-current'),
      ).toBe('page')
      expect(
        screen
          .getByRole('link', { name: 'Resumen ejecutivo' })
          .getAttribute('aria-current'),
      ).toBeNull()
      expect(Boolean(screen.queryByRole('link', { name: 'Nueva orden' }))).toBe(
        role === 'DIRECTOR_OPS',
      )
      expect(
        Boolean(screen.queryByRole('link', { name: 'Resumen mensual' })),
      ).toBe(role === 'DIRECTOR_OPS')
    },
  )

  it('keeps the stored theme, header toggle and desktop sidebar collapse', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderAppLayout()

    const header = document.querySelector('header')!
    fireEvent.click(
      within(header).getByRole('button', { name: 'Cambiar a modo claro' }),
    )
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    const sidebar = document.querySelector('[data-slot="sidebar"]')!
    expect(sidebar.getAttribute('data-state')).toBe('expanded')
    fireEvent.click(
      within(header).getByRole('button', { name: 'Alternar navegación' }),
    )
    expect(sidebar.getAttribute('data-state')).toBe('collapsed')
  })
})

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
