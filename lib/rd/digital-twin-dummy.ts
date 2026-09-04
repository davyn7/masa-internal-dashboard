export type Vec2 = {
  x: number
  y: number
}

export type TwinEquipmentType =
  | 'dt'
  | 'exca'
  | 'lv'
  | 'dozer'
  | 'grader'
  | 'wt'
  | 'ft'
  | 'mh'

export type DigitalTwinSite = {
  id: string
  name: string
  mineral: string
  originLat: number
  originLng: number
}

export type DemGrid = {
  originX: number
  originY: number
  cellSize: number
  cols: number
  rows: number
  elevations: Float32Array
  minElevation: number
  maxElevation: number
}

export type MinePolygon = {
  vertices: Vec2[]
}

export type EquipmentSnapshot = {
  id: string
  type: TwinEquipmentType
  x: number
  y: number
  headingDeg: number
}

export type DrillInterval = {
  fromM: number
  toM: number
  gradeNi: number
}

export type DrillHole = {
  id: string
  x: number
  y: number
  azimuthDeg: number
  dipDeg: number
  depthM: number
  intervals: DrillInterval[]
}

export type BlockVoxel = {
  x: number
  y: number
  z: number
  dx: number
  dy: number
  dz: number
  gradeNi: number
}

export type DigitalTwinSnapshot = {
  site: DigitalTwinSite
  polygon: MinePolygon
  dem: DemGrid
  equipment: EquipmentSnapshot[]
  drillHoles: DrillHole[]
}

export type DigitalTwinSceneProps = {
  snapshot: DigitalTwinSnapshot
  showEquipment: boolean
  showBlockModel: boolean
  showDrillHoles: boolean
  blockSize: { x: number; y: number; z: number }
}

export type TwinLayerId = 'equipment' | 'blockModel' | 'drillHoles'

export const TWIN_LAYERS: { id: TwinLayerId; label: string }[] = [
  { id: 'equipment', label: 'Equipment' },
  { id: 'blockModel', label: 'Block model' },
  { id: 'drillHoles', label: 'Drill holes' },
]

export const DEFAULT_TWIN_LAYERS: TwinLayerId[] = [
  'equipment',
  'blockModel',
  'drillHoles',
]

export const BLOCK_SIZE_XY_OPTIONS = [10, 25, 50] as const
export const BLOCK_SIZE_Z_OPTIONS = [5, 10, 15] as const

export const DEFAULT_BLOCK_SIZE = {
  x: 25,
  y: 25,
  z: 10,
}

const SITE: DigitalTwinSite = {
  id: 'sorowako-pit-a',
  name: 'Sorowako Pit A',
  mineral: 'Nickel',
  originLat: -2.52,
  originLng: 121.35,
}

const LEASE_POLYGON: Vec2[] = [
  { x: -680, y: -220 },
  { x: -620, y: -510 },
  { x: -280, y: -640 },
  { x: 160, y: -610 },
  { x: 540, y: -470 },
  { x: 720, y: -140 },
  { x: 690, y: 260 },
  { x: 480, y: 560 },
  { x: 40, y: 660 },
  { x: -360, y: 590 },
  { x: -640, y: 320 },
  { x: -740, y: 40 },
]

const PIT_RX = 560
const PIT_RY = 440

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return s - Math.floor(s)
}

function haulXY(s: number): Vec2 {
  const t = Math.min(1, Math.max(0, s))
  const ang = t * 5.2
  const r = 0.12 + t * 0.86
  return { x: Math.cos(ang) * r * PIT_RX, y: Math.sin(ang) * r * PIT_RY }
}

function haulHeading(s: number): number {
  const a = haulXY(s)
  const b = haulXY(Math.min(1, s + 0.012))
  return (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI
}

export function pointInPolygon(x: number, y: number, vertices: readonly Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x
    const yi = vertices[i].y
    const xj = vertices[j].x
    const yj = vertices[j].y
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function pitElevation(x: number, y: number): number {
  const nx = x / PIT_RX
  const ny = y / PIT_RY
  const r = Math.hypot(nx, ny)

  const hill =
    18 * Math.sin(x * 0.0065) * Math.cos(y * 0.0058) +
    11 * Math.sin((x + 220) * 0.012) +
    7 * Math.cos((y - 80) * 0.014)

  const rim = 218 + hill * 0.45
  const floor = 96

  if (r >= 1.04) {
    return rim + Math.max(0, hill)
  }

  const ang = Math.atan2(ny, nx)
  let wrapped = ang - r * 5.2
  wrapped = ((wrapped + Math.PI * 3) % (Math.PI * 2)) - Math.PI
  const rampDist = Math.min(Math.abs(wrapped), Math.PI * 2 - Math.abs(wrapped))
  const onRamp = rampDist < 0.28 && r > 0.1 && r < 0.98

  const t = Math.min(1, r)
  const radial = t < 0.12 ? 0 : (t - 0.12) / 0.88
  let z = floor + (rim - floor) * radial

  if (!onRamp && t >= 0.12) {
    const benchH = 10
    z = Math.floor(z / benchH) * benchH + 1.5
  }

  return z
}

function buildDem(): DemGrid {
  const xs = LEASE_POLYGON.map((v) => v.x)
  const ys = LEASE_POLYGON.map((v) => v.y)
  const pad = 90
  const minX = Math.min(...xs) - pad
  const maxX = Math.max(...xs) + pad
  const minY = Math.min(...ys) - pad
  const maxY = Math.max(...ys) + pad
  const cols = 129
  const rows = 129
  const cellSize = Math.max((maxX - minX) / (cols - 1), (maxY - minY) / (rows - 1))
  const elevations = new Float32Array(cols * rows)
  let minElevation = Infinity
  let maxElevation = -Infinity

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = minX + c * cellSize
      const y = minY + r * cellSize
      const z = pitElevation(x, y)
      elevations[r * cols + c] = z
      if (z < minElevation) minElevation = z
      if (z > maxElevation) maxElevation = z
    }
  }

  return {
    originX: minX,
    originY: minY,
    cellSize,
    cols,
    rows,
    elevations,
    minElevation,
    maxElevation,
  }
}

export function sampleElevation(dem: DemGrid, x: number, y: number): number {
  const fx = (x - dem.originX) / dem.cellSize
  const fy = (y - dem.originY) / dem.cellSize
  const c0 = Math.floor(fx)
  const r0 = Math.floor(fy)
  const tx = fx - c0
  const ty = fy - r0

  const at = (c: number, r: number) => {
    const cc = Math.min(dem.cols - 1, Math.max(0, c))
    const rr = Math.min(dem.rows - 1, Math.max(0, r))
    return dem.elevations[rr * dem.cols + cc]
  }

  return (
    at(c0, r0) * (1 - tx) * (1 - ty) +
    at(c0 + 1, r0) * tx * (1 - ty) +
    at(c0, r0 + 1) * (1 - tx) * ty +
    at(c0 + 1, r0 + 1) * tx * ty
  )
}

export function gradeAt(x: number, y: number, z: number): number {
  const a = Math.exp(
    -((x - 120) ** 2 + (y + 40) ** 2) / 180 ** 2 - (z - 150) ** 2 / 42 ** 2,
  )
  const b = Math.exp(
    -((x + 90) ** 2 + (y - 110) ** 2) / 150 ** 2 - (z - 165) ** 2 / 34 ** 2,
  )
  const blanket = Math.max(0, 1 - Math.abs(z - 175) / 40) * 0.35
  return 0.38 + 2.15 * a + 1.55 * b + blanket + (hash2(x, y) - 0.5) * 0.12
}

function buildEquipment(): EquipmentSnapshot[] {
  const units: EquipmentSnapshot[] = []
  const truckStops = [0.12, 0.2, 0.28, 0.36, 0.44, 0.52, 0.6, 0.68, 0.76, 0.84]
  truckStops.forEach((s, i) => {
    const p = haulXY(s)
    units.push({
      id: `DT-${String(i + 1).padStart(2, '0')}`,
      type: 'dt',
      x: p.x,
      y: p.y,
      headingDeg: haulHeading(s),
    })
  })

  const excavators: { id: string; x: number; y: number; headingDeg: number }[] = [
    { id: 'EX-01', x: 210, y: 40, headingDeg: 250 },
    { id: 'EX-02', x: -160, y: 180, headingDeg: 110 },
    { id: 'EX-03', x: 40, y: -260, headingDeg: 20 },
    { id: 'EX-04', x: -280, y: -60, headingDeg: 70 },
  ]
  excavators.forEach((ex) => units.push({ ...ex, type: 'exca' }))

  units.push(
    { id: 'DZ-01', type: 'dozer', x: 30, y: -20, headingDeg: 95 },
    { id: 'DZ-02', type: 'dozer', x: -50, y: 70, headingDeg: 200 },
    { id: 'GD-01', type: 'grader', x: haulXY(0.5).x, y: haulXY(0.5).y + 18, headingDeg: haulHeading(0.5) },
    { id: 'WT-01', type: 'wt', x: haulXY(0.72).x - 16, y: haulXY(0.72).y, headingDeg: haulHeading(0.72) },
    { id: 'FT-01', type: 'ft', x: 430, y: 210, headingDeg: 310 },
    { id: 'MH-01', type: 'mh', x: 480, y: -40, headingDeg: 175 },
    { id: 'LV-01', type: 'lv', x: 510, y: 80, headingDeg: 40 },
    { id: 'LV-02', type: 'lv', x: -470, y: 240, headingDeg: 130 },
    { id: 'LV-03', type: 'lv', x: 90, y: 470, headingDeg: 220 },
    { id: 'LV-04', type: 'lv', x: haulXY(0.9).x, y: haulXY(0.9).y, headingDeg: haulHeading(0.9) },
  )

  return units
}

function buildDrillHoles(): DrillHole[] {
  const holes: DrillHole[] = []
  let n = 1
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 5; j++) {
      const jitterX = (hash2(i + 2.1, j + 0.4) - 0.5) * 70
      const jitterY = (hash2(j + 5.2, i + 1.7) - 0.5) * 60
      const x = -450 + i * 180 + jitterX
      const y = -360 + j * 170 + jitterY
      if (!pointInPolygon(x, y, LEASE_POLYGON)) continue
      if (hash2(i, j) < 0.12) continue

      const depthM = 42 + hash2(x, y) * 48
      const dipDeg = hash2(x + 1, y) > 0.78 ? 72 + hash2(x, y + 3) * 10 : 86 + hash2(x, y) * 4
      const azimuthDeg = dipDeg < 84 ? hash2(x - 2, y) * 360 : 0
      const step = 6
      const intervals: DrillInterval[] = []
      for (let d = 0; d < depthM; d += step) {
        const toM = Math.min(depthM, d + step)
        const mid = (d + toM) / 2
        const z = pitElevation(x, y) - mid
        intervals.push({
          fromM: d,
          toM,
          gradeNi: gradeAt(x, y, z),
        })
      }

      holes.push({
        id: `DH-${String(n).padStart(3, '0')}`,
        x,
        y,
        azimuthDeg,
        dipDeg,
        depthM,
        intervals,
      })
      n += 1
    }
  }
  return holes
}

let cached: DigitalTwinSnapshot | null = null

export function loadDummyDigitalTwin(): DigitalTwinSnapshot {
  if (cached) return cached
  cached = {
    site: SITE,
    polygon: { vertices: LEASE_POLYGON },
    dem: buildDem(),
    equipment: buildEquipment(),
    drillHoles: buildDrillHoles(),
  }
  return cached
}

export function connectDummyDigitalTwin(
  delayMs = 480,
): Promise<DigitalTwinSnapshot> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(loadDummyDigitalTwin()), delayMs)
  })
}

export function generateBlockModel(
  snapshot: DigitalTwinSnapshot,
  dx: number,
  dy: number,
  dz: number,
): BlockVoxel[] {
  const { polygon, dem } = snapshot
  const xs = polygon.vertices.map((v) => v.x)
  const ys = polygon.vertices.map((v) => v.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const blocks: BlockVoxel[] = []

  for (let x = minX + dx / 2; x <= maxX; x += dx) {
    for (let y = minY + dy / 2; y <= maxY; y += dy) {
      if (!pointInPolygon(x, y, polygon.vertices)) continue
      const topo = sampleElevation(dem, x, y)
      const thickness = 10 + hash2(x, y) * 28
      const bottom = topo - thickness
      const z0 = Math.floor(bottom / dz) * dz + dz / 2
      for (let z = z0; z < topo - dz * 0.2; z += dz) {
        blocks.push({
          x,
          y,
          z,
          dx,
          dy,
          dz,
          gradeNi: gradeAt(x, y, z),
        })
      }
    }
  }

  return blocks
}

export function densifyRing(vertices: readonly Vec2[], step: number): Vec2[] {
  const out: Vec2[] = []
  const n = vertices.length
  for (let i = 0; i < n; i++) {
    const a = vertices[i]
    const b = vertices[(i + 1) % n]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    const segs = Math.max(1, Math.ceil(len / step))
    for (let s = 0; s < segs; s++) {
      const t = s / segs
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  return out
}

export function holePointAt(
  hole: DrillHole,
  distanceM: number,
  collarZ: number,
): { x: number; y: number; z: number } {
  const dipRad = (hole.dipDeg * Math.PI) / 180
  const azRad = (hole.azimuthDeg * Math.PI) / 180
  const horiz = Math.cos(dipRad) * distanceM
  return {
    x: hole.x + Math.sin(azRad) * horiz,
    y: hole.y + Math.cos(azRad) * horiz,
    z: collarZ - Math.sin(dipRad) * distanceM,
  }
}
