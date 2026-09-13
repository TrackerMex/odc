import type { CSSProperties, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRightIcon } from 'lucide-react'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { ThemeToggle } from '@/lib/theme'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'

function AppHeader({ pathname }: { pathname: string }) {
  const { isMobile, open, openMobile } = useSidebar()
  const title =
    pathname === '/tasks'
      ? 'Mis tareas'
      : pathname === '/odcs/new'
        ? 'Nueva orden'
        : pathname.startsWith('/odcs/')
          ? 'Detalle de orden'
          : pathname === '/monthly-summary'
            ? 'Resumen mensual'
            : 'Resumen ejecutivo'

  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between gap-3 border-b px-3 md:h-16 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger
          className="size-11 shrink-0 md:size-9"
          aria-label="Alternar navegación"
          aria-expanded={isMobile ? openMobile : open}
        />
        <nav aria-label="Ubicación actual" className="min-w-0 text-sm">
          <ol className="flex min-w-0 items-center gap-3">
            <li className="hidden items-center gap-3 text-muted-foreground md:flex">
              <Link
                to="/"
                viewTransition
                className="rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                TrackerMex
              </Link>
              <ChevronRightIcon className="size-3.5" aria-hidden="true" />
            </li>
            <li className="min-w-0">
              <span aria-current="page" className="font-medium">
                {title}
              </span>
            </li>
          </ol>
        </nav>
      </div>
      <ThemeToggle />
    </header>
  )
}

export function AppLayout({
  pathname = '/',
  user,
  children,
}: {
  pathname?: string
  user: { fullName: string; email: string; role: string }
  children: ReactNode
}) {
  return (
    <SidebarProvider
      className="odc-app-shell"
      style={{ '--sidebar-width': '232px' } as CSSProperties}
    >
      <AppSidebar user={user} pathname={pathname} />
      <SidebarInset className="min-w-0 bg-card md:my-2.5 md:mr-2.5 md:rounded-lg md:border md:shadow-none">
        <AppHeader pathname={pathname} />
        <div className="odc-route-content flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
