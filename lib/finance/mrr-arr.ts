import {
  FLEET_SNAPSHOT,
  percentChange,
  REVENUE_SERIES,
  type MonthlyRevenue,
} from './shared'

export function getCurrentKpis() {
  const last = REVENUE_SERIES[REVENUE_SERIES.length - 1]
  const prev = REVENUE_SERIES[REVENUE_SERIES.length - 2]

  const mrrPerClient = last.mrr / FLEET_SNAPSHOT.activeClients
  const prevMrrPerClient = prev.mrr / FLEET_SNAPSHOT.activeClients
  const arrPerClient = last.arr / FLEET_SNAPSHOT.activeClients
  const prevArrPerClient = prev.arr / FLEET_SNAPSHOT.activeClients

  const mrrPerUnit = last.mrr / FLEET_SNAPSHOT.monitoredUnits
  const prevMrrPerUnit = prev.mrr / FLEET_SNAPSHOT.monitoredUnits
  const arrPerUnit = last.arr / FLEET_SNAPSHOT.monitoredUnits
  const prevArrPerUnit = prev.arr / FLEET_SNAPSHOT.monitoredUnits

  // MRR and ARR always share the same % change (ARR = MRR * 12)
  const mrrArrChange = percentChange(last.mrr, prev.mrr)

  return {
    mrr: { value: last.mrr, change: mrrArrChange },
    arr: { value: last.arr, change: mrrArrChange },
    perClient: {
      mrr: mrrPerClient,
      arr: arrPerClient,
      change: percentChange(mrrPerClient, prevMrrPerClient),
    },
    perUnit: {
      mrr: mrrPerUnit,
      arr: arrPerUnit,
      change: percentChange(mrrPerUnit, prevArrPerUnit),
    },
  }
}

export function filterRange(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
): MonthlyRevenue[] {
  return REVENUE_SERIES.filter((d) => {
    const afterFrom = d.year > fromYear || (d.year === fromYear && d.month >= fromMonth)
    const beforeTo = d.year < toYear || (d.year === toYear && d.month <= toMonth)
    return afterFrom && beforeTo
  })
}
