import {
  FLEET_SNAPSHOT,
  percentChange,
  REVENUE_SERIES,
  TODAY,
} from './shared'

export type Mineral = 'Nickel' | 'Coal' | 'Gold' | 'Copper' | 'Bauxite'

export type ClientSiteRecord = {
  id: string
  companyName: string
  siteId: string
  siteName: string
  mineral: Mineral
  mrr: number
  prevMrr: number
  arr: number
  prevArr: number
  mrrChange: number
  unitsInstalled: number
  contractExpiryDate: string
  monthsUntilExpiry: number
}

export type SiteGroup = {
  siteId: string
  siteName: string
  mineral: Mineral
  clients: ClientSiteRecord[]
  totalMrr: number
  totalArr: number
  totalPrevMrr: number
}

type RawClient = {
  id: string
  companyName: string
  siteId: string
  siteName: string
  mineral: Mineral
  mrrWeight: number
  units: number
  contractExpiryDate: string
}

const SITES: Array<{ siteId: string; siteName: string; mineral: Mineral }> = [
  { siteId: 'sorowako', siteName: 'Sorowako', mineral: 'Nickel' },
  { siteId: 'weda-bay', siteName: 'Weda Bay', mineral: 'Nickel' },
  { siteId: 'grasberg', siteName: 'Grasberg', mineral: 'Copper' },
  { siteId: 'martabe', siteName: 'Martabe', mineral: 'Gold' },
  { siteId: 'adaro', siteName: 'Adaro', mineral: 'Coal' },
  { siteId: 'bintan', siteName: 'Bintan', mineral: 'Bauxite' },
  { siteId: 'kaltim', siteName: 'Kaltim', mineral: 'Coal' },
]

const RAW_CLIENTS: RawClient[] = [
  { id: 'c01', companyName: 'Vale Indonesia', siteId: 'sorowako', siteName: 'Sorowako', mineral: 'Nickel', mrrWeight: 1.4, units: 38, contractExpiryDate: '2027-04-01' },
  { id: 'c02', companyName: 'IMIP', siteId: 'sorowako', siteName: 'Sorowako', mineral: 'Nickel', mrrWeight: 1.1, units: 32, contractExpiryDate: '2026-10-15' },
  { id: 'c03', companyName: 'Sorikmas', siteId: 'sorowako', siteName: 'Sorowako', mineral: 'Nickel', mrrWeight: 0.7, units: 18, contractExpiryDate: '2027-09-01' },
  { id: 'c04', companyName: 'Harita Nickel', siteId: 'sorowako', siteName: 'Sorowako', mineral: 'Nickel', mrrWeight: 0.9, units: 24, contractExpiryDate: '2026-08-01' },
  { id: 'c05', companyName: 'Weda Bay Nickel', siteId: 'weda-bay', siteName: 'Weda Bay', mineral: 'Nickel', mrrWeight: 1.6, units: 42, contractExpiryDate: '2028-03-01' },
  { id: 'c06', companyName: 'Huayou Cobalt', siteId: 'weda-bay', siteName: 'Weda Bay', mineral: 'Nickel', mrrWeight: 1.2, units: 30, contractExpiryDate: '2027-06-01' },
  { id: 'c07', companyName: 'Lygg', siteId: 'weda-bay', siteName: 'Weda Bay', mineral: 'Nickel', mrrWeight: 0.8, units: 20, contractExpiryDate: '2026-11-01' },
  { id: 'c08', companyName: 'Eramet', siteId: 'weda-bay', siteName: 'Weda Bay', mineral: 'Nickel', mrrWeight: 1.0, units: 26, contractExpiryDate: '2027-12-01' },
  { id: 'c09', companyName: 'Freeport', siteId: 'grasberg', siteName: 'Grasberg', mineral: 'Copper', mrrWeight: 1.8, units: 48, contractExpiryDate: '2028-07-01' },
  { id: 'c10', companyName: 'Amman Mineral', siteId: 'grasberg', siteName: 'Grasberg', mineral: 'Copper', mrrWeight: 1.3, units: 34, contractExpiryDate: '2027-02-01' },
  { id: 'c11', companyName: 'Newmont', siteId: 'grasberg', siteName: 'Grasberg', mineral: 'Copper', mrrWeight: 1.0, units: 28, contractExpiryDate: '2026-09-01' },
  { id: 'c12', companyName: 'Bumi Resources', siteId: 'grasberg', siteName: 'Grasberg', mineral: 'Copper', mrrWeight: 0.6, units: 16, contractExpiryDate: '2027-08-15' },
  { id: 'c13', companyName: 'Agincourt', siteId: 'martabe', siteName: 'Martabe', mineral: 'Gold', mrrWeight: 1.2, units: 30, contractExpiryDate: '2027-05-01' },
  { id: 'c14', companyName: 'Archi Indonesia', siteId: 'martabe', siteName: 'Martabe', mineral: 'Gold', mrrWeight: 0.9, units: 22, contractExpiryDate: '2026-12-01' },
  { id: 'c15', companyName: 'PT Merdeka', siteId: 'martabe', siteName: 'Martabe', mineral: 'Gold', mrrWeight: 1.1, units: 26, contractExpiryDate: '2028-01-01' },
  { id: 'c16', companyName: 'G-Resources', siteId: 'martabe', siteName: 'Martabe', mineral: 'Gold', mrrWeight: 0.7, units: 18, contractExpiryDate: '2027-03-01' },
  { id: 'c17', companyName: 'Adaro Energy', siteId: 'adaro', siteName: 'Adaro', mineral: 'Coal', mrrWeight: 1.5, units: 40, contractExpiryDate: '2027-07-01' },
  { id: 'c18', companyName: 'Bayan Resources', siteId: 'adaro', siteName: 'Adaro', mineral: 'Coal', mrrWeight: 1.0, units: 28, contractExpiryDate: '2026-10-01' },
  { id: 'c19', companyName: 'Geo Energy', siteId: 'adaro', siteName: 'Adaro', mineral: 'Coal', mrrWeight: 0.8, units: 20, contractExpiryDate: '2027-11-01' },
  { id: 'c20', companyName: 'Indika Energy', siteId: 'adaro', siteName: 'Adaro', mineral: 'Coal', mrrWeight: 0.6, units: 14, contractExpiryDate: '2026-08-15' },
  { id: 'c21', companyName: 'Antam', siteId: 'bintan', siteName: 'Bintan', mineral: 'Bauxite', mrrWeight: 0.9, units: 22, contractExpiryDate: '2027-04-15' },
  { id: 'c22', companyName: 'Well Harvest', siteId: 'bintan', siteName: 'Bintan', mineral: 'Bauxite', mrrWeight: 0.7, units: 18, contractExpiryDate: '2026-11-15' },
  { id: 'c23', companyName: 'MMP', siteId: 'bintan', siteName: 'Bintan', mineral: 'Bauxite', mrrWeight: 0.5, units: 12, contractExpiryDate: '2028-02-01' },
  { id: 'c24', companyName: 'KPC', siteId: 'kaltim', siteName: 'Kaltim', mineral: 'Coal', mrrWeight: 1.3, units: 34, contractExpiryDate: '2027-09-01' },
  { id: 'c25', companyName: 'Kideco', siteId: 'kaltim', siteName: 'Kaltim', mineral: 'Coal', mrrWeight: 1.0, units: 26, contractExpiryDate: '2026-09-15' },
  { id: 'c26', companyName: 'Borneo Indobara', siteId: 'kaltim', siteName: 'Kaltim', mineral: 'Coal', mrrWeight: 0.8, units: 20, contractExpiryDate: '2027-01-01' },
]

const REFERENCE_DATE = new Date(TODAY.year, TODAY.month, 1)

export function computeMonthsUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  const months =
    (expiry.getFullYear() - REFERENCE_DATE.getFullYear()) * 12 +
    (expiry.getMonth() - REFERENCE_DATE.getMonth())
  return Math.max(0, months)
}

function buildClients(): ClientSiteRecord[] {
  const last = REVENUE_SERIES[REVENUE_SERIES.length - 1]
  const prev = REVENUE_SERIES[REVENUE_SERIES.length - 2]
  const totalWeight = RAW_CLIENTS.reduce((sum, c) => sum + c.mrrWeight, 0)
  const totalUnits = RAW_CLIENTS.reduce((sum, c) => sum + c.units, 0)
  const targetMrr = last.mrr
  const targetPrevMrr = prev.mrr

  const scaled = RAW_CLIENTS.map((raw) => {
    const share = raw.mrrWeight / totalWeight
    const mrr = Math.round(targetMrr * share)
    const prevMrr = Math.round(targetPrevMrr * share)
    const unitsInstalled = Math.round(
      (raw.units / totalUnits) * FLEET_SNAPSHOT.monitoredUnits,
    )
    const monthsUntilExpiry = computeMonthsUntilExpiry(raw.contractExpiryDate)

    return {
      id: raw.id,
      companyName: raw.companyName,
      siteId: raw.siteId,
      siteName: raw.siteName,
      mineral: raw.mineral,
      mrr,
      prevMrr,
      arr: mrr * 12,
      prevArr: prevMrr * 12,
      mrrChange: percentChange(mrr, prevMrr),
      unitsInstalled,
      contractExpiryDate: raw.contractExpiryDate,
      monthsUntilExpiry,
    }
  })

  // Fix rounding drift so units sum exactly to fleet total.
  const unitDrift =
    FLEET_SNAPSHOT.monitoredUnits -
    scaled.reduce((sum, c) => sum + c.unitsInstalled, 0)
  if (unitDrift !== 0 && scaled.length > 0) {
    scaled[0] = {
      ...scaled[0],
      unitsInstalled: scaled[0].unitsInstalled + unitDrift,
    }
  }

  return scaled
}

const CLIENTS = buildClients()

export function getClientMatrixGroups(): SiteGroup[] {
  return SITES.map((site) => {
    const clients = CLIENTS.filter((c) => c.siteId === site.siteId)
    const totalMrr = clients.reduce((sum, c) => sum + c.mrr, 0)
    const totalPrevMrr = clients.reduce((sum, c) => sum + c.prevMrr, 0)

    return {
      siteId: site.siteId,
      siteName: site.siteName,
      mineral: site.mineral,
      clients,
      totalMrr,
      totalArr: totalMrr * 12,
      totalPrevMrr,
    }
  }).filter((g) => g.clients.length > 0)
}

export function getClientById(id: string): ClientSiteRecord | undefined {
  return CLIENTS.find((c) => c.id === id)
}

export function getAllClients(): ClientSiteRecord[] {
  return CLIENTS
}

export function formatExpiryLabel(months: number): string {
  if (months === 0) return '0 mo'
  if (months === 1) return '1 mo'
  return `${months} mo`
}

/** Sanity check: client count and units match fleet snapshot. */
export function getMatrixTotals() {
  return {
    clients: CLIENTS.length,
    units: CLIENTS.reduce((sum, c) => sum + c.unitsInstalled, 0),
    mrr: CLIENTS.reduce((sum, c) => sum + c.mrr, 0),
    expectedClients: FLEET_SNAPSHOT.activeClients,
    expectedUnits: FLEET_SNAPSHOT.monitoredUnits,
  }
}
