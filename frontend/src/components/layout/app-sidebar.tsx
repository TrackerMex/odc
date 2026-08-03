import type { ComponentProps } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3Icon,
  ClipboardListIcon,
  FilePlus2Icon,
  LayoutDashboardIcon,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { NavUser } from '@/components/nav-user'
import { ThemeToggle } from '@/lib/theme'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

type AppSidebarProps = ComponentProps<typeof Sidebar> & {
  pathname?: string
  user: { fullName: string; email: string; role: string }
}

type NavigationItemProps = {
  icon: LucideIcon
  isActive: boolean
  title: string
  href: '/' | '/odcs/new' | '/monthly-summary'
}

function NavigationItem({
  href,
  icon: Icon,
  isActive,
  title,
}: NavigationItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link to={href} viewTransition />}
        isActive={isActive}
        tooltip={title}
      >
        <Icon />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ pathname = '', user, ...props }: AppSidebarProps) {
  const canManageOrders = user.role === 'DIRECTOR_OPS'

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-2 p-2">
        <div className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ClipboardListIcon className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold leading-none">ODC</p>
            <p className="mt-1 truncate text-xs text-sidebar-foreground/70">
              Órdenes de compra
            </p>
          </div>
        </div>
        <div className="flex justify-end px-1 group-data-[collapsible=icon]:justify-center">
          <ThemeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarMenu>
            <NavigationItem
              icon={LayoutDashboardIcon}
              href="/"
              isActive={pathname === '/'}
              title="Bandeja de trabajo"
            />
            {canManageOrders ? (
              <NavigationItem
                icon={FilePlus2Icon}
                href="/odcs/new"
                isActive={pathname === '/odcs/new'}
                title="Nueva orden"
              />
            ) : null}
            {canManageOrders ? (
              <NavigationItem
                icon={BarChart3Icon}
                href="/monthly-summary"
                isActive={pathname === '/monthly-summary'}
                title="Resumen mensual"
              />
            ) : null}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
