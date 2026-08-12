import { AccountDetailsView } from '@/components/accounts/account-details-view'
import { DashboardPage } from '@/components/dashboard-page'

type AccountDetailsPageProps = {
  searchParams: Promise<{ account?: string }>
}

export default async function AccountDetailsPage({
  searchParams,
}: AccountDetailsPageProps) {
  const { account: accountId } = await searchParams

  return (
    <DashboardPage
      title="Account Details"
      description="Treasury account information"
    >
      <AccountDetailsView selectedId={accountId ?? null} />
    </DashboardPage>
  )
}
