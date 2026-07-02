import { AppSidebar } from '@/components/app-sidebar'
import { AccountCards } from '@/components/accounts/account-cards'
import { InternalTransactionsTable } from '@/components/accounts/internal-transactions-table'
import { ExternalTransactionsTable } from '@/components/accounts/external-transactions-table'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export default function AccountsPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col leading-tight">
            <h1 className="text-base font-semibold tracking-tight">
              Accounts
            </h1>
            <p className="text-xs text-muted-foreground">
              Bank account balances across all entities
            </p>
          </div>
          <span className="ml-auto flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-success" aria-hidden="true" />
            Live
          </span>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <AccountCards />
          <section
            aria-label="Transactions"
            className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            <InternalTransactionsTable />
            <ExternalTransactionsTable />
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
