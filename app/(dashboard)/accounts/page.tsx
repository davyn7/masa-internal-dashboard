import { AccountCards } from '@/components/accounts/account-cards'
import { ExternalTransactionsTable } from '@/components/accounts/external-transactions-table'
import { InternalTransactionsTable } from '@/components/accounts/internal-transactions-table'
import { DashboardPage } from '@/components/dashboard-page'

export default function AccountsPage() {
  return (
    <DashboardPage
      title="Accounts"
      description="Bank account balances across all entities"
      mainClassName="flex flex-1 flex-col gap-6 p-4 md:p-6"
    >
      <AccountCards />
      <section
        aria-label="Transactions"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <InternalTransactionsTable />
        <ExternalTransactionsTable />
      </section>
    </DashboardPage>
  )
}
