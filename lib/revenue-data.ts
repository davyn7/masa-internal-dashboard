export type Currency = 'USD' | 'IDR'

// Indicative FX rate used to convert base USD figures to IDR.
export const USD_TO_IDR = 16250

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: '$',
  IDR: 'Rp',
}

export type MonthlyRevenue = {
  /** ISO-ish key, e.g. "2024-01" */
  key: string
  /** Short label, e.g. "Jan 2024" */
  label: string
  year: number
  /** 0-indexed month */
  month: number
  /** Monthly Recurring Revenue (USD) */
  mrr: number
  /** Annual Recurring Revenue (USD) */
  arr: number
  /** Recognized revenue billed in the month (USD) */
  revenue: number
  /** Outstanding receivables for the month (USD) */
  receivables: number
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export const MONTH_OPTIONS = MONTH_LABELS.map((label, value) => ({
  label,
  value,
}))

/**
 * Deterministic series so server and client render identically.
 * Spans Jan 2024 -> Dec 2026 (36 months). Base figures are in USD.
 */
function buildSeries(): MonthlyRevenue[] {
  const series: MonthlyRevenue[] = []
  const startYear = 2024
  const totalMonths = 36

  let mrr = 82_000

  for (let i = 0; i < totalMonths; i++) {
    const year = startYear + Math.floor(i / 12)
    const month = i % 12

    // Smooth, deterministic growth with mild seasonal ripple.
    const growth = 0.032 + 0.012 * Math.sin(i / 5)
    if (i > 0) mrr = mrr * (1 + growth)

    const seasonal = 1 + 0.06 * Math.sin((month / 12) * Math.PI * 2)
    const revenue = mrr * seasonal
    // Receivables oscillate as a share of billed revenue.
    const receivableRatio = 0.18 + 0.08 * Math.abs(Math.sin(i / 3))
    const receivables = revenue * receivableRatio

    series.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: `${MONTH_LABELS[month]} ${year}`,
      year,
      month,
      mrr: Math.round(mrr),
      arr: Math.round(mrr * 12),
      revenue: Math.round(revenue),
      receivables: Math.round(receivables),
    })
  }

  return series
}

export const REVENUE_SERIES = buildSeries()

export const YEAR_OPTIONS = Array.from(
  new Set(REVENUE_SERIES.map((d) => d.year)),
).map((year) => ({ label: String(year), value: year }))

/** Operational snapshot used for per-client / per-unit KPIs. */
export const FLEET_SNAPSHOT = {
  activeClients: 26,
  monitoredUnits: 512,
}

export function convert(valueUsd: number, currency: Currency): number {
  return currency === 'IDR' ? valueUsd * USD_TO_IDR : valueUsd
}

/** Compact display, e.g. $1.24M, Rp 20.1B */
export function formatCompact(valueUsd: number, currency: Currency): string {
  const value = convert(valueUsd, currency)
  const symbol = CURRENCY_SYMBOL[currency]
  const abs = Math.abs(value)

  const units: Array<[number, string]> = [
    [1_000_000_000_000, 'T'],
    [1_000_000_000, 'B'],
    [1_000_000, 'M'],
    [1_000, 'K'],
  ]

  for (const [divisor, suffix] of units) {
    if (abs >= divisor) {
      const n = value / divisor
      const digits = Math.abs(n) >= 100 ? 0 : 1
      return `${symbol}${n.toFixed(digits)}${suffix}`
    }
  }
  return `${symbol}${Math.round(value).toLocaleString('en-US')}`
}

/** Full display with thousands separators. */
export function formatFull(valueUsd: number, currency: Currency): string {
  const value = convert(valueUsd, currency)
  const symbol = CURRENCY_SYMBOL[currency]
  return `${symbol}${Math.round(value).toLocaleString('en-US')}`
}

export function percentChange(current: number, previous: number): number {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

export function getCurrentKpis() {
  const last = REVENUE_SERIES[REVENUE_SERIES.length - 1]
  const prev = REVENUE_SERIES[REVENUE_SERIES.length - 2]

  const revenuePerClient = last.revenue / FLEET_SNAPSHOT.activeClients
  const prevRevenuePerClient = prev.revenue / FLEET_SNAPSHOT.activeClients
  const revenuePerUnit = last.revenue / FLEET_SNAPSHOT.monitoredUnits
  const prevRevenuePerUnit = prev.revenue / FLEET_SNAPSHOT.monitoredUnits

  return {
    mrr: { value: last.mrr, change: percentChange(last.mrr, prev.mrr) },
    arr: { value: last.arr, change: percentChange(last.arr, prev.arr) },
    revenuePerClient: {
      value: revenuePerClient,
      change: percentChange(revenuePerClient, prevRevenuePerClient),
    },
    revenuePerUnit: {
      value: revenuePerUnit,
      change: percentChange(revenuePerUnit, prevRevenuePerUnit),
    },
  }
}

export function filterFromStart(year: number, month: number): MonthlyRevenue[] {
  return REVENUE_SERIES.filter(
    (d) => d.year > year || (d.year === year && d.month >= month),
  )
}
