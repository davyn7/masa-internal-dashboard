import { CustomerIndividualView } from '@/components/customers/customer-individual-view'
import { DashboardPage } from '@/components/dashboard-page'
import {
  getCustomerIndividualDetail,
  getCustomerOptions,
} from '@/lib/customers/individual'

type IndividualPageProps = {
  searchParams: Promise<{ customer?: string }>
}

export default async function CustomerIndividualPage({
  searchParams,
}: IndividualPageProps) {
  const { customer: customerId } = await searchParams
  const options = getCustomerOptions()
  const selectedId =
    customerId && options.some((o) => o.id === customerId) ? customerId : null
  const customer = selectedId
    ? getCustomerIndividualDetail(selectedId)
    : null

  return (
    <DashboardPage
      title="Customer Details"
      description="Customer detail, equipment, and financials"
    >
      <CustomerIndividualView
        options={options}
        selectedId={selectedId}
        customer={customer}
      />
    </DashboardPage>
  )
}
