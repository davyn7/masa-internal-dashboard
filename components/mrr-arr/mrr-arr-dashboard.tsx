import { KpiCards } from './kpi-cards'
import { MrrArrChart } from './mrr-arr-chart'
import { ArrCurrencyMixChart } from './arr-currency-mix-chart'
import { ArrBreakdownChart } from './arr-breakdown-chart'
import { ClientMatrixHeatmap } from './client-matrix-heatmap'

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
        <ArrBreakdownChart />
        <ClientMatrixHeatmap />
      </section>
    </div>
  )
}
