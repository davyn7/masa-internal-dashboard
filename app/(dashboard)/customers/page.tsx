import { DashboardPage } from '@/components/dashboard-page'
import { CustomersOverview } from '@/components/customers/customers-overview'

export default function CustomersOverviewPage() {
  return (
    <DashboardPage
      title="Customers Overview"
      description="Customer sites across Indonesia"
    >
      <CustomersOverview />
    </DashboardPage>
  )
}
