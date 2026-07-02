import { KpiCards } from './kpi-cards'
import { MrrArrChart } from './mrr-arr-chart'
import { ArrCurrencyMixChart } from './arr-currency-mix-chart'
import { ChartPlaceholder } from './chart-placeholder'

export function MrrArrDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <KpiCards />

      <section
        aria-label="Revenue charts"
        className="grid grid-cols-1 gap-4 xl:grid-cols-2"
      >
        <MrrArrChart />
        <ArrCurrencyMixChart />
        <ChartPlaceholder
          title="Net Revenue Retention"
          hint="Reserved for an upcoming NRR cohort visualization."
        />
        <ChartPlaceholder
          title="Revenue by Vehicle Type"
          hint="Reserved for a breakdown across dump trucks, excavators, and more."
        />
      </section>
    </div>
  )
}
