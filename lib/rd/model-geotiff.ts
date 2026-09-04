import { fromBlob } from 'geotiff'

export type GeoTiffTile = {
  label: string
  width: number
  height: number
  /** West, south, east, north in degrees (EPSG:4326-style geographic). */
  west: number
  south: number
  east: number
  north: number
  /** Row-major elevation samples (EGM2008 orthometric heights, meters). */
  elevations: Float32Array
  noData: number | null
}

function isGeographicBBox(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): boolean {
  return (
    Number.isFinite(minX) &&
    Number.isFinite(minY) &&
    Number.isFinite(maxX) &&
    Number.isFinite(maxY) &&
    minX < maxX &&
    minY < maxY &&
    minX >= -180 &&
    maxX <= 180 &&
    minY >= -90 &&
    maxY <= 90
  )
}

function resolveNoData(image: { getGDALNoData: () => number | null }): number | null {
  const raw = image.getGDALNoData()
  return raw !== null && Number.isFinite(raw) ? raw : null
}

/**
 * Parse a georeferenced elevation GeoTIFF from a browser File/Blob.
 * Requires a geographic bounding box (degrees). Projected-only files are rejected.
 */
export async function parseElevationGeoTiff(
  file: Blob,
  label: string,
): Promise<GeoTiffTile> {
  const tiff = await fromBlob(file)
  const image = await tiff.getImage()
  const width = image.getWidth()
  const height = image.getHeight()
  const bbox = image.getBoundingBox()
  const [minX, minY, maxX, maxY] = bbox

  if (!isGeographicBBox(minX, minY, maxX, maxY)) {
    throw new Error(
      `${label}: missing geographic georeferencing (expected lon/lat bbox in degrees). Projected CRS without a geographic bbox is not supported.`,
    )
  }

  const rasters = await image.readRasters({ interleave: true })
  const sampleCount = width * height
  const source = rasters as ArrayLike<number>
  if (source.length < sampleCount) {
    throw new Error(
      `${label}: unexpected raster size (got ${source.length}, expected at least ${sampleCount}).`,
    )
  }

  const elevations = new Float32Array(sampleCount)
  for (let i = 0; i < sampleCount; i++) {
    elevations[i] = Number(source[i])
  }

  return {
    label,
    width,
    height,
    west: minX,
    south: minY,
    east: maxX,
    north: maxY,
    elevations,
    noData: resolveNoData(image),
  }
}

export async function parseElevationGeoTiffs(
  entries: { file: File; label: string }[],
): Promise<GeoTiffTile[]> {
  const tiles: GeoTiffTile[] = []
  for (const entry of entries) {
    tiles.push(await parseElevationGeoTiff(entry.file, entry.label))
  }
  return tiles
}
