import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { BellIcon, CheckCheckIcon, CircleIcon, RefreshCwIcon } from 'lucide-react'
import {
  getNotifications,
  markNotificationsRead,
  ODC_MUTATED_EVENT,
} from '@/lib/api'
import type { NotificationFeed, NotificationItem } from '@/lib/odc'
import { statusLabel } from '@/lib/odc'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const EMPTY_FEED: NotificationFeed = { items: [], unreadCount: 0 }

export function NotificationCenter() {
  const [feed, setFeed] = useState(EMPTY_FEED)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [marking, setMarking] = useState(false)
  const [markError, setMarkError] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setFeed(await getNotifications())
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onFocus = () => void refresh()
    const interval = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', onFocus)
    window.addEventListener(ODC_MUTATED_EVENT, onFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(ODC_MUTATED_EVENT, onFocus)
    }
  }, [refresh])

  async function markAllRead() {
    setMarking(true)
    try {
      await markNotificationsRead()
      setFeed((current) => ({
        unreadCount: 0,
        items: current.items.map((item) => ({ ...item, isRead: true })),
      }))
      setMarkError(false)
    } catch {
      setMarkError(true)
    } finally {
      setMarking(false)
    }
  }

  const triggerLabel = feed.unreadCount
    ? `Notificaciones, ${feed.unreadCount} sin leer`
    : 'Notificaciones'

  return (
    <DropdownMenu onOpenChange={(open) => open && void refresh()}>
      <DropdownMenuTrigger
        aria-label={triggerLabel}
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-11 md:size-9"
          />
        }
      >
        <BellIcon aria-hidden="true" />
        {feed.unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white">
            {feed.unreadCount > 99 ? '99+' : feed.unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notificaciones</p>
            <p className="text-xs text-muted-foreground">
              Actividad reciente de las ODC
            </p>
          </div>
          {feed.unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 md:min-h-7"
              disabled={marking}
              onClick={markAllRead}
            >
              <CheckCheckIcon aria-hidden="true" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
        {markError && (
          <p role="alert" className="px-4 pb-3 text-xs text-destructive">
            No pudimos actualizar el estado de lectura. Intenta de nuevo.
          </p>
        )}
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[min(28rem,70vh)] overflow-y-auto p-1">
          {loading && feed.items.length === 0 ? (
            <p role="status" className="px-3 py-8 text-center text-sm text-muted-foreground">
              Cargando notificaciones…
            </p>
          ) : error ? (
            <div role="alert" className="space-y-3 px-3 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No pudimos cargar las notificaciones.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="min-h-11 md:min-h-7"
                onClick={refresh}
              >
                <RefreshCwIcon aria-hidden="true" />
                Reintentar
              </Button>
            </div>
          ) : feed.items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No hay actividad reciente.
            </p>
          ) : (
            feed.items.map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <DropdownMenuItem
      className="min-h-0 items-start gap-3 px-3 py-3"
      render={
        <Link
          to="/odcs/$id"
          params={{ id: item.odcId }}
          viewTransition
          aria-label={`${item.odcNumber}: ${statusLabel(item.toStatus)}`}
        />
      }
    >
      <CircleIcon
        aria-hidden="true"
        className={`mt-1 size-2 fill-current ${item.isRead ? 'text-muted-foreground/30' : 'text-primary'}`}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="font-medium">{item.odcNumber}</span>
          <time
            dateTime={item.createdAt}
            className="shrink-0 text-[11px] text-muted-foreground"
          >
            {relativeTime(item.createdAt)}
          </time>
        </span>
        <span className="mt-0.5 block text-sm">
          {item.fromStatus === null ? 'ODC creada' : statusLabel(item.toStatus)}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          Por {item.actorName}
        </span>
      </span>
    </DropdownMenuItem>
  )
}

function relativeTime(value: string): string {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60_000),
  )
  if (elapsedMinutes < 1) return 'Ahora'
  if (elapsedMinutes < 60) return `Hace ${elapsedMinutes} min`
  const hours = Math.floor(elapsedMinutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}
