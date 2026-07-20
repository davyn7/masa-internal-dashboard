'use client'

import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import {
  GeoJSON as GeoJSONLayer,
  MapContainer,
  Marker,
  Tooltip,
  useMap,
} from 'react-leaflet'

import { ChartShell } from '@/components/charts/chart-shell'
import { MineralBadge } from '@/components/customers/mineral-badge'
import type { CustomerSiteOverview } from '@/lib/customers/sites'

import 'leaflet/dist/leaflet.css'
import './indonesia-site-map.css'

type ProvinceGeoJson = GeoJSON.GeoJsonObject

const MAP_CENTER: [number, number] = [-2.5, 118]
const MAP_ZOOM = 6
const FIT_BOUNDS_PADDING: [number, number] = [4, 4]
const FIT_BOUNDS_MAX_ZOOM = 7
const PROVINCE_STYLE = {
  color: 'oklch(0.8 0.13 196)',
  weight: 1,
  opacity: 0.6,
  fillOpacity: 0,
}

const siteMarkerIcon = L.divIcon({
  className: '',
  html: '<div class="site-map-marker-dot"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
})

function FitIndonesiaBounds({ geojson }: { geojson: ProvinceGeoJson }) {
  const map = useMap()

  useEffect(() => {
    const layer = L.geoJSON(geojson)
    map.fitBounds(layer.getBounds(), {
      padding: FIT_BOUNDS_PADDING,
      maxZoom: FIT_BOUNDS_MAX_ZOOM,
    })
  }, [geojson, map])

  return null
}

function SiteTooltipContent({ site }: { site: CustomerSiteOverview }) {
  return (
    <div className="w-52 p-3 text-sm">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-card-foreground">{site.siteName}</p>
        <MineralBadge mineral={site.mineral} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {site.kotaKabupaten}, {site.province}
      </p>
      <ul className="mt-2 space-y-0.5 text-xs text-card-foreground">
        {site.customers.map((customer) => (
          <li key={customer} className="truncate">
            {customer}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function IndonesiaSiteMap({ sites }: { sites: CustomerSiteOverview[] }) {
  const [geojson, setGeojson] = useState<ProvinceGeoJson | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/geo/indonesia-provinces.geojson')
      .then((res) => res.json())
      .then((data: ProvinceGeoJson) => {
        if (!cancelled) setGeojson(data)
      })
      .catch(() => {
        if (!cancelled) setGeojson(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const provinceStyle = useMemo(
    () => ({
      style: () => PROVINCE_STYLE,
    }),
    [],
  )

  return (
    <ChartShell
      title="Customer Sites"
      description="Sites across Indonesia"
      className="overflow-hidden border-border/60 bg-card/80"
    >
      <div className="indonesia-site-map -mx-(--card-spacing) -mb-(--card-spacing) h-[min(52vh,560px)] min-h-[480px]">
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          scrollWheelZoom
          zoomControl={false}
          attributionControl={false}
          className="h-full w-full"
          minZoom={4}
          maxZoom={8}
        >
          {geojson ? (
            <>
              <GeoJSONLayer data={geojson} {...provinceStyle} />
              <FitIndonesiaBounds geojson={geojson} />
            </>
          ) : null}
          {sites.map((site) => (
            <Marker
              key={site.siteId}
              position={[site.latitude, site.longitude]}
              icon={siteMarkerIcon}
            >
              <Tooltip
                direction="top"
                offset={[0, -8]}
                opacity={1}
                className="site-map-tooltip"
                interactive={false}
              >
                <SiteTooltipContent site={site} />
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </ChartShell>
  )
}
