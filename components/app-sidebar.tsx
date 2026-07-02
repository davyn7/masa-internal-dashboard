'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  BarChart3,
  Bell,
  FileText,
  Fuel,
  Gauge,
  LayoutDashboard,
  LandmarkIcon,
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
  href: string
}

const financeNav: NavItem[] = [
  { title: 'MRR & ARR', icon: BarChart3, href: '/' },
  { title: 'Unit Economics', icon: LayoutDashboard, href: '/unit-economics' },
  { title: 'Accounts', icon: LandmarkIcon, href: '/accounts' },
]

const analyticsNav: NavItem[] = [
  { title: 'Fleet Overview', icon: LayoutDashboard, href: '/fleet-overview' },
  { title: 'Efficiency', icon: Gauge, href: '/efficiency' },
  { title: 'Utilization', icon: Activity, href: '/utilization' },
]

const operationsNav: NavItem[] = [
  { title: 'Vehicles', icon: Truck, href: '/vehicles' },
  { title: 'Fuel & Energy', icon: Fuel, href: '/fuel-energy' },
  { title: 'Maintenance', icon: Wrench, href: '/maintenance' },
  { title: 'Alerts', icon: Bell, href: '/alerts' },
]

const systemNav: NavItem[] = [
  { title: 'Reports', icon: FileText, href: '/reports' },
  { title: 'Settings', icon: Settings, href: '/settings' },
]

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.href} className="flex w-full">
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.title}
                    className="w-full"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )
          })}
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
        <NavSection label="Finance" items={financeNav} />
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
