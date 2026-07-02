import {
  CLIENT_WEIGHTS,
  SITE_CATALOG,
} from './client-matrix'
import type { MonthlyRevenue } from './shared'

export type BreakdownView = 'client' | 'site'

export type BreakdownEntity = {
  id: string
  label: string
  color: string
}

export type BreakdownSegment = {
  id: string
  label: string
  mrr: number
  arr: number
}

export type MonthlyBreakdownPoint = {
  key: string
  label: string
  year: number
  month: number
  isProjected: boolean
  totalMrr: number
  totalArr: number
  segments: BreakdownSegment[]
}

export type ChartBreakdownRow = MonthlyBreakdownPoint & {
  [entityId: string]: string | number | boolean | BreakdownSegment[] | undefined
}

export type DrilldownRow = {
  id: string
  label: string
  subtitle?: string
  mrr: number
  arr: number
}

function entityColor(index: number, total: number): string {
  const hue = Math.round((index * 360) / total)
  return `oklch(0.62 0.14 ${hue})`
}

function allocateClientMrr(monthMrr: number): Map<string, number> {
  const totalWeight = CLIENT_WEIGHTS.reduce((sum, c) => sum + c.mrrWeight, 0)
  const allocations = CLIENT_WEIGHTS.map((client) => ({
    id: client.id,
    mrr: Math.round(monthMrr * (client.mrrWeight / totalWeight)),
  }))

  const drift = monthMrr - allocations.reduce((sum, row) => sum + row.mrr, 0)
  if (drift !== 0 && allocations.length > 0) {
    const largestIdx = allocations.reduce(
      (bestIdx, row, idx, rows) =>
        row.mrr > rows[bestIdx].mrr ? idx : bestIdx,
      0,
    )
    allocations[largestIdx] = {
      ...allocations[largestIdx],
      mrr: allocations[largestIdx].mrr + drift,
    }
  }

  return new Map(allocations.map((row) => [row.id, row.mrr]))
}

function buildClientSegments(monthMrr: number): BreakdownSegment[] {
  const mrrByClient = allocateClientMrr(monthMrr)

  return CLIENT_WEIGHTS.map((client) => {
    const mrr = mrrByClient.get(client.id) ?? 0
    return {
      id: client.id,
      label: client.companyName,
      mrr,
      arr: mrr * 12,
    }
  })
}

function buildSiteSegments(monthMrr: number): BreakdownSegment[] {
  const mrrByClient = allocateClientMrr(monthMrr)

  return SITE_CATALOG.map((site) => {
    const clients = CLIENT_WEIGHTS.filter((c) => c.siteId === site.siteId)
    const mrr = clients.reduce(
      (sum, client) => sum + (mrrByClient.get(client.id) ?? 0),
      0,
    )
    return {
      id: site.siteId,
      label: site.siteName,
      mrr,
      arr: mrr * 12,
    }
  })
}

export function getBreakdownEntities(view: BreakdownView): BreakdownEntity[] {
  if (view === 'client') {
    return CLIENT_WEIGHTS.map((client, index) => ({
      id: client.id,
      label: client.companyName,
      color: entityColor(index, CLIENT_WEIGHTS.length),
    }))
  }

  return SITE_CATALOG.map((site, index) => ({
    id: site.siteId,
    label: site.siteName,
    color: entityColor(index, SITE_CATALOG.length),
  }))
}

export function buildMonthlyBreakdown(
  view: BreakdownView,
  months: MonthlyRevenue[],
): MonthlyBreakdownPoint[] {
  return months.map((month) => {
    const segments =
      view === 'client'
        ? buildClientSegments(month.mrr)
        : buildSiteSegments(month.mrr)
    const totalMrr = segments.reduce((sum, segment) => sum + segment.mrr, 0)
    const totalArr = segments.reduce((sum, segment) => sum + segment.arr, 0)

    return {
      key: month.key,
      label: month.label,
      year: month.year,
      month: month.month,
      isProjected: month.isProjected,
      totalMrr,
      totalArr,
      segments,
    }
  })
}

export function flattenBreakdownForChart(
  points: MonthlyBreakdownPoint[],
): ChartBreakdownRow[] {
  return points.map((point) => {
    const row: ChartBreakdownRow = {
      ...point,
      segments: point.segments,
    }

    for (const segment of point.segments) {
      row[segment.id] = segment.arr
    }

    return row
  })
}

export function getDrilldown(
  view: BreakdownView,
  segmentId: string,
  month: MonthlyBreakdownPoint,
): { title: string; subtitle?: string; rows: DrilldownRow[] } {
  if (view === 'client') {
    const client = CLIENT_WEIGHTS.find((c) => c.id === segmentId)
    const segment = month.segments.find((s) => s.id === segmentId)
    if (!client || !segment) {
      return { title: 'Client', rows: [] }
    }

    return {
      title: client.companyName,
      subtitle: `${client.siteName} · ${client.mineral}`,
      rows: [
        {
          id: client.siteId,
          label: client.siteName,
          subtitle: client.mineral,
          mrr: segment.mrr,
          arr: segment.arr,
        },
      ],
    }
  }

  const site = SITE_CATALOG.find((s) => s.siteId === segmentId)
  const siteSegment = month.segments.find((s) => s.id === segmentId)
  if (!site || !siteSegment) {
    return { title: 'Site', rows: [] }
  }

  const mrrByClient = allocateClientMrr(month.totalMrr)
  const clients = CLIENT_WEIGHTS.filter((c) => c.siteId === segmentId)

  return {
    title: site.siteName,
    subtitle: site.mineral,
    rows: clients.map((client) => {
      const mrr = mrrByClient.get(client.id) ?? 0
      return {
        id: client.id,
        label: client.companyName,
        mrr,
        arr: mrr * 12,
      }
    }),
  }
}

export function getTotalBreakdown(
  view: BreakdownView,
  month: MonthlyBreakdownPoint,
): DrilldownRow[] {
  return month.segments.map((segment) => {
    const subtitle =
      view === 'site'
        ? SITE_CATALOG.find((site) => site.siteId === segment.id)?.mineral
        : undefined

    return {
      id: segment.id,
      label: segment.label,
      subtitle,
      mrr: segment.mrr,
      arr: segment.arr,
    }
  })
}
