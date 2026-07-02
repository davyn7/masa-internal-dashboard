import { DashboardPage } from '@/components/dashboard-page'
import { MrrArrDashboard } from '@/components/mrr-arr/mrr-arr-dashboard'

export default function Page() {
  return (
    <DashboardPage
      title="MRR & ARR Overview"
      description="Monthly and annual recurring revenue trends"
    >
      <MrrArrDashboard />
    </DashboardPage>
  )
}
