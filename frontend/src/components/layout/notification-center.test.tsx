import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getNotifications,
  markNotificationsRead,
  ODC_MUTATED_EVENT,
} from '@/lib/api'
import { NotificationCenter } from './notification-center'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, viewTransition, ...props }: any) => (
    <a href={to.replace('$id', params.id)} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/api', () => ({
  ODC_MUTATED_EVENT: 'odc:mutated',
  getNotifications: vi.fn(),
  markNotificationsRead: vi.fn(),
}))

const feed = {
  unreadCount: 1,
  items: [
    {
      id: 'event-2',
      odcId: 'odc-2',
      odcNumber: 'ODC-2026-00002',
      fromStatus: 'PENDIENTE_ADMIN' as const,
      toStatus: 'PRESUPUESTO_APROBADO' as const,
      actorName: 'Ana Administración',
      createdAt: '2026-09-13T18:00:00.000Z',
      isRead: false,
    },
  ],
}

describe('odc-notifications R4-R6: header notification center', () => {
  beforeEach(() => {
    vi.mocked(getNotifications).mockReset().mockResolvedValue(feed)
    vi.mocked(markNotificationsRead).mockReset().mockResolvedValue({
      success: true,
    })
  })

  it('shows an accessible unread badge and a linked status update with actor context', async () => {
    render(<NotificationCenter />)

    const trigger = await screen.findByRole('button', {
      name: 'Notificaciones, 1 sin leer',
    })
    fireEvent.click(trigger)

    expect(await screen.findByText('ODC-2026-00002')).toBeTruthy()
    expect(screen.getByText('Presupuesto aprobado')).toBeTruthy()
    expect(screen.getByText(/Ana Administración/)).toBeTruthy()
    expect(
      screen.getByRole('menuitem', { name: /ODC-2026-00002/ }).getAttribute('href'),
    ).toBe('/odcs/odc-2')
  })

  it('marks the authenticated feed read and refreshes after a successful ODC mutation', async () => {
    render(<NotificationCenter />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Notificaciones, 1 sin leer' }),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Marcar todas como leídas' }))

    await waitFor(() => expect(markNotificationsRead).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeTruthy()

    window.dispatchEvent(new Event(ODC_MUTATED_EVENT))
    await waitFor(() => expect(getNotifications).toHaveBeenCalledTimes(3))
  })

  it('keeps the shell usable and offers retry when loading fails', async () => {
    vi.mocked(getNotifications)
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(feed)
    render(<NotificationCenter />)
    fireEvent.click(screen.getByRole('button', { name: 'Notificaciones' }))

    expect(await screen.findByText('No pudimos cargar las notificaciones.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('ODC-2026-00002')).toBeTruthy()
  })
})
