export const POLYGON_TYPES = [
  'IUP',
  'Pit',
  'Disposal',
  'Stockpile',
  'Road',
] as const

export type PolygonType = (typeof POLYGON_TYPES)[number]

export type LonLat = readonly [number, number]

export type ModelPolygonOverlay = {
  id: string
  name: string
  type: PolygonType
  /** Exterior rings as WGS84 [lon, lat] (GeoJSON Z discarded). */
  rings: LonLat[][]
}

export type PolygonStyle = {
  boundary: string
  /** null = no fill (IUP). */
  fill: string | null
  fillOpacity: number
}

export const POLYGON_STYLES: Record<PolygonType, PolygonStyle> = {
  IUP: { boundary: '#ffffff', fill: null, fillOpacity: 0 },
  Pit: { boundary: '#ff1a1a', fill: '#ff1a1a', fillOpacity: 0.5 },
  Disposal: { boundary: '#f5e000', fill: '#f5e000', fillOpacity: 0.5 },
  Stockpile: { boundary: '#ff8c00', fill: '#ff8c00', fillOpacity: 0.5 },
  Road: { boundary: '#00e5ff', fill: '#00e5ff', fillOpacity: 0.5 },
}

export function isPolygonType(value: string): value is PolygonType {
  return (POLYGON_TYPES as readonly string[]).includes(value)
}

type GeoJsonPosition = number[]
type GeoJsonRing = GeoJsonPosition[]

function toLonLat(pos: GeoJsonPosition): LonLat | null {
  if (
    !Array.isArray(pos) ||
    pos.length < 2 ||
    !Number.isFinite(pos[0]) ||
    !Number.isFinite(pos[1])
  ) {
    return null
  }
  // WGS84 lon/lat; discard any ellipsoidal Z ordinate.
  return [pos[0], pos[1]]
}

function normalizeRing(ring: GeoJsonRing): LonLat[] {
  const out: LonLat[] = []
  for (const pos of ring) {
    const ll = toLonLat(pos)
    if (ll) out.push(ll)
  }
  // Drop closing duplicate if present.
  if (
    out.length >= 2 &&
    out[0][0] === out[out.length - 1][0] &&
    out[0][1] === out[out.length - 1][1]
  ) {
    out.pop()
  }
  return out
}

function collectExteriorRings(
  geometry: { type?: string; coordinates?: unknown },
  into: LonLat[][],
): void {
  const { type, coordinates } = geometry
  if (!type || coordinates == null) return

  if (type === 'Polygon') {
    const rings = coordinates as GeoJsonRing[]
    if (!Array.isArray(rings) || rings.length === 0) return
    const exterior = normalizeRing(rings[0])
    if (exterior.length >= 3) into.push(exterior)
    return
  }

  if (type === 'MultiPolygon') {
    const polys = coordinates as GeoJsonRing[][]
    if (!Array.isArray(polys)) return
    for (const poly of polys) {
      if (!Array.isArray(poly) || poly.length === 0) continue
      const exterior = normalizeRing(poly[0])
      if (exterior.length >= 3) into.push(exterior)
    }
    return
  }

  if (type === 'GeometryCollection') {
    const geoms = (geometry as { geometries?: unknown }).geometries
    if (!Array.isArray(geoms)) return
    for (const g of geoms) {
      if (g && typeof g === 'object') {
        collectExteriorRings(
          g as { type?: string; coordinates?: unknown },
          into,
        )
      }
    }
  }
}

/**
 * Parse a WGS84 GeoJSON file into exterior polygon rings.
 * Third ordinates (ellipsoidal heights) are ignored.
 */
export async function parseGeoJsonFile(file: File): Promise<LonLat[][]> {
  let text: string
  try {
    text = await file.text()
  } catch {
    throw new Error(`Could not read GeoJSON file "${file.name}".`)
  }

  let data: unknown
  try {
    data = JSON.parse(text) as unknown
  } catch {
    throw new Error(`Invalid JSON in "${file.name}".`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error(`"${file.name}" is not a GeoJSON object.`)
  }

  const root = data as {
    type?: string
    geometry?: { type?: string; coordinates?: unknown }
    features?: unknown[]
    coordinates?: unknown
    geometries?: unknown
  }

  const rings: LonLat[][] = []

  if (root.type === 'Feature') {
    if (root.geometry && typeof root.geometry === 'object') {
      collectExteriorRings(root.geometry, rings)
    }
  } else if (root.type === 'FeatureCollection') {
    if (!Array.isArray(root.features)) {
      throw new Error(`"${file.name}" FeatureCollection has no features.`)
    }
    for (const feature of root.features) {
      if (!feature || typeof feature !== 'object') continue
      const geom = (feature as { geometry?: unknown }).geometry
      if (geom && typeof geom === 'object') {
        collectExteriorRings(
          geom as { type?: string; coordinates?: unknown },
          rings,
        )
      }
    }
  } else if (
    root.type === 'Polygon' ||
    root.type === 'MultiPolygon' ||
    root.type === 'GeometryCollection'
  ) {
    collectExteriorRings(root, rings)
  } else {
    throw new Error(
      `"${file.name}" must be a Polygon, MultiPolygon, Feature, or FeatureCollection (WGS84).`,
    )
  }

  if (rings.length === 0) {
    throw new Error(
      `"${file.name}" contains no usable polygon rings (need ≥3 vertices).`,
    )
  }

  return rings
}

export type LocalVertex = { x: number; y: number }

/** Densify a closed ring in local meters so draped edges follow terrain. */
export function densifyLocalRing(
  vertices: readonly LocalVertex[],
  step: number,
): LocalVertex[] {
  const out: LocalVertex[] = []
  const n = vertices.length
  if (n < 2) return [...vertices]
  for (let i = 0; i < n; i++) {
    const a = vertices[i]
    const b = vertices[(i + 1) % n]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    const segs = Math.max(1, Math.ceil(len / Math.max(step, 1e-6)))
    for (let s = 0; s < segs; s++) {
      const t = s / segs
      out.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      })
    }
  }
  return out
}
