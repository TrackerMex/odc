import type { ComponentProps } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3Icon,
  ClipboardListIcon,
  FilePlus2Icon,
  LayoutDashboardIcon,
  ListTodoIcon,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { NavUser } from '@/components/nav-user'
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
  SidebarTrigger,
} from '@/components/ui/sidebar'

type AppSidebarProps = ComponentProps<typeof Sidebar> & {
  pathname?: string
  user: { fullName: string; email: string; role: string }
}

type NavigationItemProps = {
  icon: LucideIcon
  isActive: boolean
  title: string
  href: '/' | '/tasks' | '/odcs/new' | '/monthly-summary'
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
        aria-current={isActive ? 'page' : undefined}
        tooltip={title}
        className="h-11 rounded-md data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground"
      >
        <Icon aria-hidden="true" />
        <span>{title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar({ pathname = '', user, ...props }: AppSidebarProps) {
  const canManageOrders = user.role === 'DIRECTOR_OPS'

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 p-2.5 group-data-[collapsible=icon]:px-1 [&_[data-slot=sidebar-inner]]:rounded-lg [&_[data-slot=sidebar-inner]]:border"
      {...props}
    >
      <SidebarHeader className="gap-0 px-3 pt-6 pb-0 group-data-[collapsible=icon]:px-0">
        <div className="flex min-w-0 items-center gap-2.5 px-1 pb-6 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-8">
            <ClipboardListIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-2xl font-semibold leading-none tracking-tight">
              ODC
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Órdenes de compra
            </p>
          </div>
          <SidebarTrigger
            className="ml-auto size-11 md:hidden"
            aria-label="Cerrar navegación"
          />
        </div>
        <p className="border-t px-1 py-4 text-sm font-medium group-data-[collapsible=icon]:hidden">
          TrackerMex
        </p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-3 group-data-[collapsible=icon]:px-0">
          <SidebarGroupLabel className="px-2 font-normal">
            Espacio de trabajo
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            <NavigationItem
              icon={LayoutDashboardIcon}
              href="/"
              isActive={pathname === '/'}
              title="Resumen ejecutivo"
            />
            <NavigationItem
              icon={ListTodoIcon}
              href="/tasks"
              isActive={pathname === '/tasks'}
              title="Mis tareas"
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
      <SidebarFooter className="mx-3 border-t px-0 py-4 group-data-[collapsible=icon]:mx-0">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail
        aria-label="Alternar navegación"
        title="Alternar navegación"
      />
    </Sidebar>
  )
}
