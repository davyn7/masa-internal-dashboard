import { AccountCards } from '@/components/accounts/account-cards'
import { ExternalTransactionsTable } from '@/components/accounts/external-transactions-table'
import { FixedDepositsTable } from '@/components/accounts/fixed-deposits-table'
import { InternalTransactionsTable } from '@/components/accounts/internal-transactions-table'
import { DashboardPage } from '@/components/dashboard-page'

export default function AccountsPage() {
  return (
    <DashboardPage
      title="Accounts Overview"
      description="Bank account balances across all entities"
      mainClassName="gap-6"
    >
      <AccountCards />
      <FixedDepositsTable />
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
