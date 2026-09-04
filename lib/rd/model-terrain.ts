import type { GeoTiffTile } from '@/lib/rd/model-geotiff'

export type ElevationMosaic = {
  west: number
  south: number
  east: number
  north: number
  width: number
  height: number
  /** Row-major, north-up; NaN = no data. */
  heights: Float32Array
  /** Mean of valid heights; used as fill outside mosaic footprint. */
  fillHeight: number
}

const MAX_MOSAIC_DIM = 512
const MAX_MESH_DIM = 512

function sampleTile(
  tile: GeoTiffTile,
  lon: number,
  lat: number,
): number | null {
  if (
    lon < tile.west ||
    lon > tile.east ||
    lat < tile.south ||
    lat > tile.north
  ) {
    return null
  }

  const u = (lon - tile.west) / (tile.east - tile.west)
  // GeoTIFF rows are typically north-up in geographic space when using bbox:
  // row 0 ≈ north edge.
  const v = (tile.north - lat) / (tile.north - tile.south)
  const x = Math.min(tile.width - 1, Math.max(0, Math.floor(u * tile.width)))
  const y = Math.min(tile.height - 1, Math.max(0, Math.floor(v * tile.height)))
  const value = tile.elevations[y * tile.width + x]
  if (!Number.isFinite(value)) return null
  if (tile.noData !== null && value === tile.noData) return null
  return value
}

/**
 * Stitch georeferenced elevation tiles into one geographic height mosaic
 * covering the union of all tile bboxes.
 */
export function buildElevationMosaic(tiles: GeoTiffTile[]): ElevationMosaic {
  if (tiles.length === 0) {
    throw new Error('No GeoTIFF tiles to mosaic.')
  }

  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity

  for (const tile of tiles) {
    west = Math.min(west, tile.west)
    south = Math.min(south, tile.south)
    east = Math.max(east, tile.east)
    north = Math.max(north, tile.north)
  }

  const lonSpan = east - west
  const latSpan = north - south
  if (!(lonSpan > 0 && latSpan > 0)) {
    throw new Error('Invalid mosaic bounds from GeoTIFF tiles.')
  }

  // Target resolution from the finest source pixel size, capped for browser memory.
  let minPixelLon = Infinity
  let minPixelLat = Infinity
  for (const tile of tiles) {
    minPixelLon = Math.min(minPixelLon, (tile.east - tile.west) / tile.width)
    minPixelLat = Math.min(minPixelLat, (tile.north - tile.south) / tile.height)
  }

  let width = Math.ceil(lonSpan / minPixelLon)
  let height = Math.ceil(latSpan / minPixelLat)
  const scale = Math.max(width / MAX_MOSAIC_DIM, height / MAX_MOSAIC_DIM, 1)
  width = Math.max(2, Math.round(width / scale))
  height = Math.max(2, Math.round(height / scale))

  const heights = new Float32Array(width * height)
  let sum = 0
  let count = 0

  for (let row = 0; row < height; row++) {
    const lat = north - ((row + 0.5) / height) * latSpan
    for (let col = 0; col < width; col++) {
      const lon = west + ((col + 0.5) / width) * lonSpan
      let value: number | null = null
      for (const tile of tiles) {
        value = sampleTile(tile, lon, lat)
        if (value !== null) break
      }
      const idx = row * width + col
      if (value === null) {
        heights[idx] = Number.NaN
      } else {
        heights[idx] = value
        sum += value
        count += 1
      }
    }
  }

  if (count === 0) {
    throw new Error('Mosaic contains no valid elevation samples.')
  }

  const fillHeight = sum / count

  // Fill holes with mean so terrain tiles stay continuous.
  for (let i = 0; i < heights.length; i++) {
    if (!Number.isFinite(heights[i])) {
      heights[i] = fillHeight
    }
  }

  return { west, south, east, north, width, height, heights, fillHeight }
}

export type ModelDemGrid = {
  cols: number
  rows: number
  cellSizeX: number
  cellSizeY: number
  /** Local easting of column 0 (typically centered so origin is mesh mid). */
  originX: number
  /** Local northing of row 0 / south edge (typically centered). */
  originY: number
  /** Row-major, south→north (row 0 = south). */
  elevations: Float32Array
  minElevation: number
  maxElevation: number
}

/**
 * Convert a geographic elevation mosaic into a local-meter DEM grid for
 * Three.js rendering (AOI only — no globe).
 */
export function mosaicToDemGrid(mosaic: ElevationMosaic): ModelDemGrid {
  const { width: srcCols, height: srcRows, west, south, east, north, heights } =
    mosaic
  const lonSpan = east - west
  const latSpan = north - south
  const centerLat = (south + north) / 2
  const metersPerDegLon =
    111_320 * Math.cos((centerLat * Math.PI) / 180)
  const metersPerDegLat = 110_540

  const widthM = lonSpan * metersPerDegLon
  const heightM = latSpan * metersPerDegLat

  // Downsample so the GPU mesh never exceeds MAX_MESH_DIM on either side.
  const scale = Math.max(
    srcCols / MAX_MESH_DIM,
    srcRows / MAX_MESH_DIM,
    1,
  )
  const cols = Math.max(2, Math.round(srcCols / scale))
  const rows = Math.max(2, Math.round(srcRows / scale))
  const cellSizeX = cols > 1 ? widthM / (cols - 1) : widthM
  const cellSizeY = rows > 1 ? heightM / (rows - 1) : heightM

  const elevations = new Float32Array(cols * rows)
  let minElevation = Infinity
  let maxElevation = -Infinity

  for (let row = 0; row < rows; row++) {
    // Mosaic is north-up; DemGrid is south-up (row 0 = south).
    const srcRow = Math.min(
      srcRows - 1,
      Math.floor(((rows - 1 - row) / Math.max(rows - 1, 1)) * (srcRows - 1)),
    )
    for (let col = 0; col < cols; col++) {
      const srcCol = Math.min(
        srcCols - 1,
        Math.floor((col / Math.max(cols - 1, 1)) * (srcCols - 1)),
      )
      // Box-average a small neighborhood when downsampling for smoother mesh.
      const r0 = Math.max(0, srcRow - Math.floor(scale / 2))
      const r1 = Math.min(srcRows - 1, srcRow + Math.floor(scale / 2))
      const c0 = Math.max(0, srcCol - Math.floor(scale / 2))
      const c1 = Math.min(srcCols - 1, srcCol + Math.floor(scale / 2))
      let sum = 0
      let n = 0
      for (let rr = r0; rr <= r1; rr++) {
        for (let cc = c0; cc <= c1; cc++) {
          sum += heights[rr * srcCols + cc]
          n += 1
        }
      }
      const z = n > 0 ? sum / n : heights[srcRow * srcCols + srcCol]
      elevations[row * cols + col] = z
      if (z < minElevation) minElevation = z
      if (z > maxElevation) maxElevation = z
    }
  }

  return {
    cols,
    rows,
    cellSizeX,
    cellSizeY,
    originX: -widthM / 2,
    originY: -heightM / 2,
    elevations,
    minElevation,
    maxElevation,
  }
}
