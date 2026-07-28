import type { ReactNode } from 'react'
import { AppSidebar } from '@/components/layout/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export function AppLayout({
  pathname,
  user,
  children,
}: {
  pathname?: string
  user: { fullName: string; email: string; role: string }
  children: ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} pathname={pathname} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="odc-route-content flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
