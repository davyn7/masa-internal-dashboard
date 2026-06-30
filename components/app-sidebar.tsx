'use client'

import {
  Activity,
  BarChart3,
  Bell,
  FileText,
  Fuel,
  Gauge,
  LayoutDashboard,
  Settings,
  Truck,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

type NavItem = {
  title: string
  icon: LucideIcon
  active?: boolean
}

const analyticsNav: NavItem[] = [
  { title: 'Revenue', icon: BarChart3, active: true },
  { title: 'Fleet Overview', icon: LayoutDashboard },
  { title: 'Efficiency', icon: Gauge },
  { title: 'Utilization', icon: Activity },
]

const operationsNav: NavItem[] = [
  { title: 'Vehicles', icon: Truck },
  { title: 'Fuel & Energy', icon: Fuel },
  { title: 'Maintenance', icon: Wrench },
  { title: 'Alerts', icon: Bell },
]

const systemNav: NavItem[] = [
  { title: 'Reports', icon: FileText },
  { title: 'Settings', icon: Settings },
]

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton isActive={item.active} tooltip={item.title}>
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Gauge className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-wide text-sidebar-foreground">
              COMMAND
            </span>
            <span className="text-xs text-muted-foreground">
              Mine Management System
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavSection label="Analytics" items={analyticsNav} />
        <NavSection label="Operations" items={operationsNav} />
        <NavSection label="System" items={systemNav} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2.5 rounded-md px-1 py-1.5 group-data-[collapsible=icon]:justify-center">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            OP
          </span>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-sidebar-foreground">
              Ops Console
            </span>
            <span className="text-xs text-muted-foreground">
              internal@command.io
            </span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
