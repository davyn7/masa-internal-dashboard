import { DashboardPage } from '@/components/dashboard-page'
import { RevenueReceivablesChart } from '@/components/unit-economics/revenue-receivables-chart'

export default function UnitEconomicsPage() {
  return (
    <DashboardPage
      title="Unit Economics"
      description="Revenue and receivables performance by billing period"
    >
      <div className="flex flex-col gap-6">
        <RevenueReceivablesChart />
      </div>
    </DashboardPage>
  )
}
