import { REVENUE_SERIES, type MonthlyRevenue } from './shared'

export function filterFromStart(year: number, month: number): MonthlyRevenue[] {
  return REVENUE_SERIES.filter(
    (d) => d.year > year || (d.year === year && d.month >= month),
  )
}
