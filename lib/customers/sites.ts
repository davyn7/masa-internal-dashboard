import {
  getClientMatrixGroups,
  type Mineral,
} from '@/lib/finance/client-matrix'

export type SiteLocation = {
  siteId: string
  siteName: string
  mineral: Mineral
  province: string
  kotaKabupaten: string
  postalCode: string
  latitude: number
  longitude: number
}

export type CustomerSiteOverview = SiteLocation & {
  customers: string[]
}

export type CustomerStatus = 'Pitch' | 'Trial' | 'Commercial' | 'Churned'

export const CUSTOMER_STATUSES: CustomerStatus[] = [
  'Pitch',
  'Trial',
  'Commercial',
  'Churned',
]

export type CustomerOverviewRow = {
  id: string
  companyName: string
  siteId: string
  siteName: string
  mineral: Mineral
  province: string
  city: string
  productionUnitsTotal: number
  productionUnitsInstalled: number
  supportUnitsTotal: number
  supportUnitsInstalled: number
  status: CustomerStatus
  currentArr: number
  potentialArr: number
}

/** Deterministic status + unit mix for overview table mock data. */
const CUSTOMER_OVERVIEW_META: Record<
  string,
  {
    status: CustomerStatus
    productionShare: number
    installedRatio: number
    potentialMultiplier: number
  }
> = {
  c01: { status: 'Commercial', productionShare: 0.78, installedRatio: 1, potentialMultiplier: 1 },
  c02: { status: 'Commercial', productionShare: 0.72, installedRatio: 0.95, potentialMultiplier: 1.05 },
  c03: { status: 'Trial', productionShare: 0.7, installedRatio: 0.55, potentialMultiplier: 1.8 },
  c04: { status: 'Pitch', productionShare: 0.75, installedRatio: 0.2, potentialMultiplier: 3.2 },
  c05: { status: 'Commercial', productionShare: 0.8, installedRatio: 1, potentialMultiplier: 1 },
  c06: { status: 'Commercial', productionShare: 0.74, installedRatio: 0.92, potentialMultiplier: 1.08 },
  c07: { status: 'Trial', productionShare: 0.68, installedRatio: 0.48, potentialMultiplier: 2.1 },
  c08: { status: 'Commercial', productionShare: 0.76, installedRatio: 0.88, potentialMultiplier: 1.12 },
  c09: { status: 'Commercial', productionShare: 0.82, installedRatio: 1, potentialMultiplier: 1 },
  c10: { status: 'Commercial', productionShare: 0.77, installedRatio: 0.9, potentialMultiplier: 1.1 },
  c11: { status: 'Trial', productionShare: 0.71, installedRatio: 0.42, potentialMultiplier: 2.4 },
  c12: { status: 'Pitch', productionShare: 0.73, installedRatio: 0.15, potentialMultiplier: 3.5 },
  c13: { status: 'Commercial', productionShare: 0.75, installedRatio: 0.97, potentialMultiplier: 1.03 },
  c14: { status: 'Churned', productionShare: 0.7, installedRatio: 0.35, potentialMultiplier: 0 },
  c15: { status: 'Commercial', productionShare: 0.79, installedRatio: 1, potentialMultiplier: 1 },
  c16: { status: 'Trial', productionShare: 0.69, installedRatio: 0.5, potentialMultiplier: 1.9 },
  c17: { status: 'Commercial', productionShare: 0.81, installedRatio: 1, potentialMultiplier: 1 },
  c18: { status: 'Commercial', productionShare: 0.74, installedRatio: 0.86, potentialMultiplier: 1.15 },
  c19: { status: 'Pitch', productionShare: 0.72, installedRatio: 0.18, potentialMultiplier: 3 },
  c20: { status: 'Churned', productionShare: 0.68, installedRatio: 0.25, potentialMultiplier: 0 },
  c21: { status: 'Commercial', productionShare: 0.76, installedRatio: 0.93, potentialMultiplier: 1.07 },
  c22: { status: 'Trial', productionShare: 0.7, installedRatio: 0.45, potentialMultiplier: 2.2 },
  c23: { status: 'Pitch', productionShare: 0.71, installedRatio: 0.12, potentialMultiplier: 3.8 },
  c24: { status: 'Commercial', productionShare: 0.8, installedRatio: 0.98, potentialMultiplier: 1.02 },
  c25: { status: 'Commercial', productionShare: 0.75, installedRatio: 0.9, potentialMultiplier: 1.1 },
  c26: { status: 'Trial', productionShare: 0.73, installedRatio: 0.52, potentialMultiplier: 1.85 },
}

const SITE_LOCATIONS: SiteLocation[] = [
  {
    siteId: 'sorowako',
    siteName: 'Sorowako',
    mineral: 'Nickel',
    province: 'Sulawesi Selatan',
    kotaKabupaten: 'Luwu Timur',
    postalCode: '92982',
    latitude: -2.52,
    longitude: 121.35,
  },
  {
    siteId: 'weda-bay',
    siteName: 'Weda Bay',
    mineral: 'Nickel',
    province: 'Maluku Utara',
    kotaKabupaten: 'Halmahera Tengah',
    postalCode: '97752',
    latitude: 0.58,
    longitude: 127.95,
  },
  {
    siteId: 'grasberg',
    siteName: 'Grasberg',
    mineral: 'Copper',
    province: 'Papua',
    kotaKabupaten: 'Mimika',
    postalCode: '99962',
    latitude: -4.05,
    longitude: 137.12,
  },
  {
    siteId: 'martabe',
    siteName: 'Martabe',
    mineral: 'Gold',
    province: 'Sumatera Utara',
    kotaKabupaten: 'Tapanuli Selatan',
    postalCode: '22738',
    latitude: 1.08,
    longitude: 99.42,
  },
  {
    siteId: 'adaro',
    siteName: 'Adaro',
    mineral: 'Coal',
    province: 'Kalimantan Selatan',
    kotaKabupaten: 'Tabalong',
    postalCode: '71513',
    latitude: -2.05,
    longitude: 115.52,
  },
  {
    siteId: 'bintan',
    siteName: 'Bintan',
    mineral: 'Bauxite',
    province: 'Kepulauan Riau',
    kotaKabupaten: 'Bintan',
    postalCode: '29152',
    latitude: 1.08,
    longitude: 104.48,
  },
  {
    siteId: 'kaltim',
    siteName: 'Kaltim',
    mineral: 'Coal',
    province: 'Kalimantan Timur',
    kotaKabupaten: 'Kutai Kartanegara',
    postalCode: '75511',
    latitude: -0.5,
    longitude: 117.15,
  },
]

export function getCustomerSiteOverview(): CustomerSiteOverview[] {
  const groups = getClientMatrixGroups()
  const groupBySiteId = new Map(groups.map((g) => [g.siteId, g]))

  return SITE_LOCATIONS.map((site) => {
    const group = groupBySiteId.get(site.siteId)
    return {
      ...site,
      customers: group?.clients.map((c) => c.companyName) ?? [],
    }
  })
}

export async function fetchCustomerSiteOverview(): Promise<CustomerSiteOverview[]> {
  return getCustomerSiteOverview()
}

function buildUnitBreakdown(
  unitsInstalled: number,
  productionShare: number,
  installedRatio: number,
) {
  const productionInstalled = Math.round(unitsInstalled * productionShare)
  const supportInstalled = Math.max(0, unitsInstalled - productionInstalled)
  const safeRatio = Math.max(installedRatio, 0.05)
  const productionTotal = Math.max(
    productionInstalled,
    Math.round(productionInstalled / safeRatio),
  )
  const supportTotal = Math.max(
    supportInstalled,
    Math.round(supportInstalled / safeRatio),
  )

  return {
    productionUnitsTotal: productionTotal,
    productionUnitsInstalled: productionInstalled,
    supportUnitsTotal: supportTotal,
    supportUnitsInstalled: supportInstalled,
  }
}

export function getCustomerOverviewRows(): CustomerOverviewRow[] {
  const sitesById = new Map(SITE_LOCATIONS.map((site) => [site.siteId, site]))
  const groups = getClientMatrixGroups()

  return groups.flatMap((group) => {
    const site = sitesById.get(group.siteId)
    if (!site) return []

    return group.clients.map((client) => {
      const meta = CUSTOMER_OVERVIEW_META[client.id] ?? {
        status: 'Commercial' as CustomerStatus,
        productionShare: 0.75,
        installedRatio: 1,
        potentialMultiplier: 1,
      }
      const units = buildUnitBreakdown(
        client.unitsInstalled,
        meta.productionShare,
        meta.installedRatio,
      )
      const currentArr =
        meta.status === 'Churned' ? 0 : meta.status === 'Pitch' ? Math.round(client.arr * 0.15) : client.arr
      const potentialArr =
        meta.status === 'Churned'
          ? 0
          : Math.round(client.arr * meta.potentialMultiplier)

      return {
        id: client.id,
        companyName: client.companyName,
        siteId: client.siteId,
        siteName: client.siteName,
        mineral: client.mineral,
        province: site.province,
        city: site.kotaKabupaten,
        ...units,
        status: meta.status,
        currentArr,
        potentialArr: Math.max(potentialArr, currentArr),
      }
    })
  })
}

export async function fetchCustomerOverviewRows(): Promise<CustomerOverviewRow[]> {
  return getCustomerOverviewRows()
}
