import type { ReactNode } from 'react'

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type DashboardPageProps = {
  title: string
  description: string
  children: ReactNode
  mainClassName?: string
}

export function DashboardPage({
  title,
  description,
  children,
  mainClassName,
}: DashboardPageProps) {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-col leading-tight">
          <h1 className="text-base font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="ml-auto flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-success" aria-hidden="true" />
          Live
        </span>
      </header>
      <main
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden p-4 md:p-6',
          mainClassName,
        )}
      >
        {children}
      </main>
    </>
  )
}
