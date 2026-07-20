import { apiGet } from '@/lib/api/client'
import { MONTH_OPTIONS, TODAY } from '@/lib/finance/shared'

export type MrrArrMonthlyApiRecord = {
  year: number
  month: number
  mrr_idr_original: number | string
  mrr_usd_original: number | string
  mrr_total_idr: number | string
  mrr_total_usd: number | string
  mrr_usd_percentage: number | string
  arr_idr_original: number | string
  arr_usd_original: number | string
  arr_total_idr: number | string
  arr_total_usd: number | string
  arr_usd_percentage: number | string
  percentage_change: number | string
}

export type MrrArrMonthlyPoint = {
  key: string
  label: string
  year: number
  /** 0-indexed month */
  month: number
  mrrTotalUsd: number
  mrrTotalIdr: number
  arrTotalUsd: number
  arrTotalIdr: number
  arrUsdOriginal: number
  /** IDR-denominated contracts expressed in USD */
  arrIdrInUsd: number
  arrUsdPercentage: number
  percentageChange: number
  isProjected: boolean
}

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number.parseFloat(value)
}

export function mapMrrArrMonthlyRecord(
  record: MrrArrMonthlyApiRecord,
): MrrArrMonthlyPoint {
  const monthIndex = record.month - 1
  const arrTotalUsd = toNumber(record.arr_total_usd)
  const arrUsdOriginal = toNumber(record.arr_usd_original)

  return {
    key: `${record.year}-${String(record.month).padStart(2, '0')}`,
    label: `${MONTH_OPTIONS[monthIndex]?.label ?? ''} ${record.year}`,
    year: record.year,
    month: monthIndex,
    mrrTotalUsd: toNumber(record.mrr_total_usd),
    mrrTotalIdr: toNumber(record.mrr_total_idr),
    arrTotalUsd,
    arrTotalIdr: toNumber(record.arr_total_idr),
    arrUsdOriginal,
    arrIdrInUsd: arrTotalUsd - arrUsdOriginal,
    arrUsdPercentage: toNumber(record.arr_usd_percentage),
    percentageChange: toNumber(record.percentage_change),
    isProjected:
      record.year > TODAY.year ||
      (record.year === TODAY.year && monthIndex > TODAY.month),
  }
}

export async function fetchMrrArrMonthly(): Promise<MrrArrMonthlyPoint[]> {
  const records = await apiGet<MrrArrMonthlyApiRecord[]>('/treasury/mrr_arr_monthly')
  return records
    .map(mapMrrArrMonthlyRecord)
    .sort((a, b) => a.year - b.year || a.month - b.month)
}

export function filterMrrArrRange(
  data: MrrArrMonthlyPoint[],
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
): MrrArrMonthlyPoint[] {
  return data.filter((d) => {
    const afterFrom = d.year > fromYear || (d.year === fromYear && d.month >= fromMonth)
    const beforeTo = d.year < toYear || (d.year === toYear && d.month <= toMonth)
    return afterFrom && beforeTo
  })
}

export function getYearOptionsFromSeries(data: MrrArrMonthlyPoint[]) {
  return Array.from(new Set(data.map((d) => d.year))).map((year) => ({
    label: String(year),
    value: year,
  }))
}

export function getDefaultDateRange(data: MrrArrMonthlyPoint[]) {
  if (!data.length) {
    return {
      fromYear: TODAY.year,
      fromMonth: 0,
      toYear: TODAY.year,
      toMonth: TODAY.month,
    }
  }

  const first = data[0]
  const last = data[data.length - 1]
  return {
    fromYear: first.year,
    fromMonth: first.month,
    toYear: last.year,
    toMonth: last.month,
  }
}
