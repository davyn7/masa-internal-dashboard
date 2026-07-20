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
