import type { StaticImageData } from 'next/image'

import { EQUIPMENT_TYPES } from '@/lib/assets/equipment-types'
import {
  getClientById,
  type ClientSiteRecord,
} from '@/lib/finance/client-matrix'
import { TODAY } from '@/lib/finance/shared'
import {
  getCustomerOverviewRows,
  type CustomerOverviewRow,
  type CustomerStatus,
} from '@/lib/customers/sites'

export type CustomerEquipmentCount = {
  id: string
  label: string
  image: StaticImageData
  totalUnits: number
  iotInstalled: number
}

export type CustomerEquipmentUnit = {
  id: string
  equipmentTypeId: string
  equipmentLabel: string
  unitId: string
  manufacturer: string
  model: string
  deviceId: string | null
  installationDate: string | null
}

export type CustomerIndividualDetail = CustomerOverviewRow & {
  mrr: number
  potentialMrr: number
  contractStartDate: string
  contractEndDate: string
  tcv: number
  realizedRevenue: number
  receivables: number
  overdueReceivables: number
  remainder: number
  totalExpenses: number
  profitability: number
  profitabilityMargin: number
  equipment: CustomerEquipmentCount[]
  equipmentUnits: CustomerEquipmentUnit[]
}

export type CustomerOption = {
  id: string
  companyName: string
  siteName: string
}

/** Preferred equipment mix weights by mineral (sums ≈ 1). */
const MIX_BY_MINERAL: Record<string, Record<string, number>> = {
  Nickel: { dt: 0.28, exca: 0.22, dozer: 0.12, grader: 0.08, lv: 0.1, mh: 0.08, ft: 0.07, wt: 0.05 },
  Coal: { dt: 0.32, exca: 0.18, dozer: 0.14, grader: 0.1, lv: 0.08, mh: 0.06, ft: 0.07, wt: 0.05 },
  Gold: { dt: 0.18, exca: 0.24, dozer: 0.12, grader: 0.1, lv: 0.14, mh: 0.1, ft: 0.06, wt: 0.06 },
  Copper: { dt: 0.26, exca: 0.22, dozer: 0.14, grader: 0.08, lv: 0.1, mh: 0.08, ft: 0.07, wt: 0.05 },
  Bauxite: { dt: 0.3, exca: 0.2, dozer: 0.12, grader: 0.08, lv: 0.1, mh: 0.08, ft: 0.07, wt: 0.05 },
}

const CONTRACT_MONTHS: Record<CustomerStatus, number> = {
  Pitch: 12,
  Trial: 6,
  Commercial: 36,
  Churned: 24,
}

function shiftMonths(isoDate: string, months: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + months)
  return date.toISOString().slice(0, 10)
}

function distributeUnits(
  total: number,
  weights: Record<string, number>,
): Record<string, number> {
  const ids = EQUIPMENT_TYPES.map((t) => t.id)
  const weightSum = ids.reduce((sum, id) => sum + (weights[id] ?? 0), 0) || 1
  const raw = ids.map((id) => ({
    id,
    value: (total * (weights[id] ?? 0)) / weightSum,
  }))
  const floored = raw.map((r) => ({ id: r.id, value: Math.floor(r.value) }))
  let remainder = total - floored.reduce((sum, r) => sum + r.value, 0)

  const byFraction = [...raw].sort(
    (a, b) => b.value - Math.floor(b.value) - (a.value - Math.floor(a.value)),
  )
  const counts: Record<string, number> = Object.fromEntries(
    floored.map((r) => [r.id, r.value]),
  )
  for (const entry of byFraction) {
    if (remainder <= 0) break
    counts[entry.id] += 1
    remainder -= 1
  }
  return counts
}

const EQUIPMENT_CATALOG: Record<
  string,
  { manufacturers: string[]; models: string[]; unitPrefix: string }
> = {
  dt: {
    manufacturers: ['Caterpillar', 'Komatsu', 'Volvo'],
    models: ['777G', 'HD785-8', 'A60H'],
    unitPrefix: 'DT',
  },
  exca: {
    manufacturers: ['Caterpillar', 'Komatsu', 'Hitachi'],
    models: ['390F', 'PC2000-11', 'EX1900-7'],
    unitPrefix: 'EX',
  },
  lv: {
    manufacturers: ['Toyota', 'Mitsubishi', 'Isuzu'],
    models: ['Hilux', 'Triton', 'D-Max'],
    unitPrefix: 'LV',
  },
  mh: {
    manufacturers: ['Hino', 'Isuzu', 'Mercedes-Benz'],
    models: ['500 Series', 'NQR', 'Atego'],
    unitPrefix: 'MH',
  },
  ft: {
    manufacturers: ['Hino', 'Isuzu', 'UD Trucks'],
    models: ['500 Series', 'FVR', 'Quester'],
    unitPrefix: 'FT',
  },
  wt: {
    manufacturers: ['Hino', 'Isuzu', 'Volvo'],
    models: ['500 Series', 'FVZ', 'FMX'],
    unitPrefix: 'WT',
  },
  dozer: {
    manufacturers: ['Caterpillar', 'Komatsu', 'John Deere'],
    models: ['D11T', 'D375A-8', '1050K'],
    unitPrefix: 'DZ',
  },
  grader: {
    manufacturers: ['Caterpillar', 'Komatsu', 'John Deere'],
    models: ['16M', 'GD825A-2', '872G'],
    unitPrefix: 'GR',
  },
}

function hashSeed(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function shiftDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function buildEquipment(row: CustomerOverviewRow): {
  equipment: CustomerEquipmentCount[]
  equipmentUnits: CustomerEquipmentUnit[]
} {
  const mix = MIX_BY_MINERAL[row.mineral] ?? MIX_BY_MINERAL.Nickel
  const totalUnits = row.productionUnitsTotal + row.supportUnitsTotal
  const iotInstalled =
    row.productionUnitsInstalled + row.supportUnitsInstalled

  const totalByType = distributeUnits(totalUnits, mix)
  const iotByType = distributeUnits(iotInstalled, mix)

  const equipment = EQUIPMENT_TYPES.map((type) => {
    const total = totalByType[type.id] ?? 0
    const installed = Math.min(total, iotByType[type.id] ?? 0)
    return {
      id: type.id,
      label: type.label,
      image: type.image,
      totalUnits: total,
      iotInstalled: installed,
    }
  }).filter((e) => e.totalUnits > 0 || e.iotInstalled > 0)

  const todayIso = `${TODAY.year}-${String(TODAY.month + 1).padStart(2, '0')}-15`
  const equipmentUnits: CustomerEquipmentUnit[] = []

  for (const type of equipment) {
    const catalog = EQUIPMENT_CATALOG[type.id]
    if (!catalog) continue

    for (let i = 0; i < type.totalUnits; i++) {
      const seed = hashSeed(`${row.id}:${type.id}:${i}`)
      const manufacturer =
        catalog.manufacturers[seed % catalog.manufacturers.length]
      const model = catalog.models[seed % catalog.models.length]
      const installed = i < type.iotInstalled
      const unitNumber = String(i + 1).padStart(3, '0')

      equipmentUnits.push({
        id: `${row.id}-${type.id}-${unitNumber}`,
        equipmentTypeId: type.id,
        equipmentLabel: type.label,
        unitId: `${catalog.unitPrefix}-${unitNumber}`,
        manufacturer,
        model,
        deviceId: installed
          ? `IOT-${String((seed % 900000) + 100000)}`
          : null,
        installationDate: installed
          ? shiftDays(todayIso, -((seed % 540) + 30))
          : null,
      })
    }
  }

  return { equipment, equipmentUnits }
}

function buildFinancials(
  row: CustomerOverviewRow,
  client: ClientSiteRecord,
): Pick<
  CustomerIndividualDetail,
  | 'mrr'
  | 'potentialMrr'
  | 'contractStartDate'
  | 'contractEndDate'
  | 'tcv'
  | 'realizedRevenue'
  | 'receivables'
  | 'overdueReceivables'
  | 'remainder'
  | 'totalExpenses'
  | 'profitability'
  | 'profitabilityMargin'
> {
  const months = CONTRACT_MONTHS[row.status]
  const contractEndDate =
    row.status === 'Pitch'
      ? shiftMonths(client.contractExpiryDate, 6)
      : client.contractExpiryDate
  const contractStartDate = shiftMonths(contractEndDate, -months)

  const mrr =
    row.status === 'Churned'
      ? 0
      : row.status === 'Pitch'
        ? Math.round(client.mrr * 0.15)
        : client.mrr
  const potentialMrr = Math.max(
    mrr,
    row.status === 'Churned' ? 0 : Math.round(row.potentialArr / 12),
  )

  const tcv = Math.round(
    (row.status === 'Churned' ? client.arr : Math.max(row.currentArr, mrr * 12)) *
      (months / 12),
  )

  const startMs = new Date(`${contractStartDate}T00:00:00Z`).getTime()
  const endMs = new Date(`${contractEndDate}T00:00:00Z`).getTime()
  const todayMs = new Date(
    `${TODAY.year}-${String(TODAY.month + 1).padStart(2, '0')}-15T00:00:00Z`,
  ).getTime()
  const elapsed = Math.min(1, Math.max(0, (todayMs - startMs) / Math.max(endMs - startMs, 1)))

  // Billed share of TCV grows with elapsed time; split billed into cash / open / overdue.
  const billedShare =
    row.status === 'Churned'
      ? 0.92
      : row.status === 'Pitch'
        ? Math.min(elapsed, 0.12)
        : elapsed
  const billed = Math.round(tcv * billedShare)
  const realizedRevenue = Math.round(billed * 0.72)
  const receivables = Math.round(billed * 0.2)
  const overdueReceivables = Math.max(0, billed - realizedRevenue - receivables)
  const remainder = Math.max(0, tcv - realizedRevenue - receivables - overdueReceivables)

  const expenseRatio =
    row.status === 'Commercial'
      ? 0.62
      : row.status === 'Trial'
        ? 0.78
        : row.status === 'Pitch'
          ? 0.9
          : 0.95
  const totalExpenses = Math.round(tcv * expenseRatio)
  const profitability = tcv - totalExpenses
  const profitabilityMargin = tcv > 0 ? (profitability / tcv) * 100 : 0

  return {
    mrr,
    potentialMrr,
    contractStartDate,
    contractEndDate,
    tcv,
    realizedRevenue,
    receivables,
    overdueReceivables,
    remainder,
    totalExpenses,
    profitability,
    profitabilityMargin,
  }
}

export function getCustomerOptions(): CustomerOption[] {
  return getCustomerOverviewRows()
    .map((row) => ({
      id: row.id,
      companyName: row.companyName,
      siteName: row.siteName,
    }))
    .sort((a, b) => a.companyName.localeCompare(b.companyName))
}

export function getCustomerIndividualDetail(
  id: string,
): CustomerIndividualDetail | null {
  const row = getCustomerOverviewRows().find((r) => r.id === id)
  if (!row) return null

  const client = getClientById(id)
  if (!client) return null

  return {
    ...row,
    ...buildFinancials(row, client),
    ...buildEquipment(row),
  }
}
