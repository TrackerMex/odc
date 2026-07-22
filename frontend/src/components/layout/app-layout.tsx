import type { ReactNode } from 'react'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

export function AppLayout({
  user,
  children,
}: {
  user: { fullName: string; email: string; role: string }
  children: ReactNode
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader />
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
