'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Box,
  Briefcase,
  Cpu,
  FileText,
  Gauge,
  LandmarkIcon,
  LineChart,
  Mountain,
  Truck,
  UserRound,
  Users,
  Wallet,
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
  { title: 'Unit Economics', icon: LineChart, href: '/unit-economics' },
]

const treasuryNav: NavItem[] = [
  { title: 'Accounts Overview', icon: LandmarkIcon, href: '/treasury/accounts' },
  {
    title: 'Account Details',
    icon: Wallet,
    href: '/treasury/account-details',
  },
]

const customersNav: NavItem[] = [
  { title: 'Customers Overview', icon: Users, href: '/customers' },
  {
    title: 'Customer Details',
    icon: UserRound,
    href: '/customers/individual',
  },
  { title: 'Contracts', icon: FileText, href: '/customers/contracts' },
]

const assetsNav: NavItem[] = [
  { title: 'Assignments', icon: Briefcase, href: '/assets/assignments' },
  { title: 'Equipment', icon: Truck, href: '/assets/equipment' },
  { title: 'IoT Devices', icon: Cpu, href: '/assets/iot-devices' },
]

const rdNav: NavItem[] = [
  { title: 'Digital Twin', icon: Box, href: '/rd/digital-twin' },
  { title: 'Model', icon: Mountain, href: '/rd/model' },
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
        <NavSection label="Treasury" items={treasuryNav} />
        <NavSection label="Commercial" items={customersNav} />
        <NavSection label="Assets" items={assetsNav} />
        <NavSection label="R&D" items={rdNav} />
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
