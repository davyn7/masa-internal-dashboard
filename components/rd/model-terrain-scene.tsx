'use client'

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  GizmoHelper,
  GizmoViewport,
  Line,
  OrbitControls,
  Text,
  useCursor,
} from '@react-three/drei'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'

import type { ModelOrthophotoOverlay } from '@/lib/rd/model-orthophoto'
import {
  densifyLocalRing,
  localRingArea,
  localRingCentroid,
  pointInLocalPolygon,
  POLYGON_STYLES,
  type LocalVertex,
  type ModelPolygonOverlay,
} from '@/lib/rd/model-polygons'
import {
  lonLatToLocal,
  sampleModelElevation,
  type ModelDemGrid,
} from '@/lib/rd/model-terrain'

const V_EXAG = 1.4
/** Lift draped orthophotos above the terrain mesh (orthometric meters). */
const ORTHO_OFFSET_M = 3
/** Lift draped polygon overlays above orthophotos (orthometric meters). */
const POLY_OFFSET_M = 5
/** Extra lift so nested non-IUP hit meshes win raycasts over the parent IUP. */
const CHILD_HIT_BIAS_M = 0.08

/** renderOrder stack: terrain < orthophoto < polygon fill < polygon line */
const RENDER_ORDER_TERRAIN = 0
const RENDER_ORDER_ORTHO = 1
const RENDER_ORDER_POLY_FILL = 2
const RENDER_ORDER_POLY_LINE = 3

const AXIS_X = '#c45c4a'
const AXIS_Y = '#6aa88a'
const AXIS_Z = '#5aa7c4'

function elevY(z: number) {
  return z * V_EXAG
}

/** Local east/north (m) + orthometric elev → Three.js world (X east, Y up, Z north). */
function worldPos(
  localX: number,
  elevationM: number,
  localNorthing: number,
): [number, number, number] {
  // Negate northing: DEM local +Y was mapping to world +Z as south on screen.
  return [localX, elevY(elevationM), -localNorthing]
}

function terrainColor(
  z: number,
  min: number,
  max: number,
  target: THREE.Color,
) {
  const t = Math.min(1, Math.max(0, (z - min) / Math.max(1, max - min)))
  if (t < 0.28) {
    target.set('#2c2924').lerp(new THREE.Color('#5a4c3a'), t / 0.28)
  } else if (t < 0.52) {
    target.set('#5a4c3a').lerp(new THREE.Color('#6a5d45'), (t - 0.28) / 0.24)
  } else if (t < 0.74) {
    target.set('#6a5d45').lerp(new THREE.Color('#4f5848'), (t - 0.52) / 0.22)
  } else {
    target.set('#4f5848').lerp(new THREE.Color('#6a7364'), (t - 0.74) / 0.26)
  }
  return target
}

function niceStep(span: number, targetTicks = 5): number {
  if (!(span > 0) || !Number.isFinite(span)) return 1
  const raw = span / targetTicks
  const pow = 10 ** Math.floor(Math.log10(raw))
  const n = raw / pow
  const nice = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10
  return nice * pow
}

function formatTick(value: number, step: number): string {
  if (step >= 1000) return `${Math.round(value / 1000)}k`
  if (step >= 1) return String(Math.round(value))
  const digits = Math.min(3, Math.max(0, -Math.floor(Math.log10(step))))
  return value.toFixed(digits)
}

function buildTerrainGeometry(dem: ModelDemGrid) {
  const {
    cols,
    rows,
    cellSizeX,
    cellSizeY,
    originX,
    originY,
    elevations,
    minElevation,
    maxElevation,
  } = dem
  const positions = new Float32Array(cols * rows * 3)
  const colors = new Float32Array(cols * rows * 3)
  const color = new THREE.Color()

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const x = originX + c * cellSizeX
      const northing = originY + r * cellSizeY
      const z = elevations[i]
      const [wx, wy, wz] = worldPos(x, z, northing)
      positions[i * 3] = wx
      positions[i * 3 + 1] = wy
      positions[i * 3 + 2] = wz
      terrainColor(z, minElevation, maxElevation, color)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
  }

  const indices = new Uint32Array((cols - 1) * (rows - 1) * 6)
  let iIdx = 0
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c
      const b = a + 1
      const d = a + cols
      const e = d + 1
      indices[iIdx++] = a
      indices[iIdx++] = d
      indices[iIdx++] = b
      indices[iIdx++] = b
      indices[iIdx++] = d
      indices[iIdx++] = e
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.computeVertexNormals()
  return geometry
}

function frameFromDem(dem: ModelDemGrid) {
  const widthM = (dem.cols - 1) * dem.cellSizeX
  const heightM = (dem.rows - 1) * dem.cellSizeY
  const span = Math.max(widthM, heightM, 1)
  const midElev = elevY((dem.minElevation + dem.maxElevation) / 2)
  const target: [number, number, number] = [0, midElev, 0]
  const distance = span * 1.35
  const camera: [number, number, number] = [
    distance * 0.55,
    midElev + distance * 0.62,
    distance * 0.72,
  ]
  return {
    target,
    camera,
    minDistance: span * 0.02,
    maxDistance: span * 4.5,
    fogNear: span * 2.2,
    fogFar: span * 5.5,
    far: span * 8,
    labelSize: Math.max(span * 0.018, 4),
    tickSize: Math.max(span * 0.012, 3),
  }
}

function TerrainMesh({ dem }: { dem: ModelDemGrid }) {
  const geometry = useMemo(() => buildTerrainGeometry(dem), [dem])

  useLayoutEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <mesh
      geometry={geometry as THREE.BufferGeometry}
      renderOrder={RENDER_ORDER_TERRAIN}
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.92}
        metalness={0.02}
        side={THREE.DoubleSide}
        depthWrite
        depthTest
      />
    </mesh>
  )
}

function densifyStepForDem(dem: ModelDemGrid): number {
  return Math.max(
    Math.min(dem.cellSizeX, dem.cellSizeY) * 0.75,
    2,
  )
}

function elevateLocalPoint(
  dem: ModelDemGrid,
  x: number,
  y: number,
  offsetM: number,
): [number, number, number] {
  const elev = sampleModelElevation(dem, x, y) + offsetM
  return worldPos(x, elev, y)
}

/**
 * Build a textured mesh covering an orthophoto footprint using the exact DEM
 * grid vertices and triangle split as the terrain mesh, so the surfaces stay
 * parallel after a constant vertical offset (no mid-cell topography poke-through).
 */
function buildDrapedOrthophotoGeometry(
  dem: ModelDemGrid,
  southwest: [number, number],
  northeast: [number, number],
  offsetM = ORTHO_OFFSET_M,
): THREE.BufferGeometry | null {
  const [west, south] = southwest
  const [east, north] = northeast
  if (!(east > west && north > south)) return null

  const sw = lonLatToLocal(dem, west, south)
  const ne = lonLatToLocal(dem, east, north)
  const minX = Math.min(sw.x, ne.x)
  const maxX = Math.max(sw.x, ne.x)
  const minY = Math.min(sw.y, ne.y)
  const maxY = Math.max(sw.y, ne.y)

  const c0 = Math.max(0, Math.floor((minX - dem.originX) / dem.cellSizeX))
  const c1 = Math.min(
    dem.cols - 1,
    Math.ceil((maxX - dem.originX) / dem.cellSizeX),
  )
  const r0 = Math.max(0, Math.floor((minY - dem.originY) / dem.cellSizeY))
  const r1 = Math.min(
    dem.rows - 1,
    Math.ceil((maxY - dem.originY) / dem.cellSizeY),
  )
  if (c1 <= c0 || r1 <= r0) return null

  const cols = c1 - c0 + 1
  const rows = r1 - r0 + 1
  const lonSpan = east - west
  const latSpan = north - south
  const positions = new Float32Array(cols * rows * 3)
  const uvs = new Float32Array(cols * rows * 2)

  for (let r = 0; r < rows; r++) {
    const demRow = r0 + r
    const y = dem.originY + demRow * dem.cellSizeY
    const lat = dem.south + (y - dem.originY) / dem.metersPerDegLat
    for (let c = 0; c < cols; c++) {
      const demCol = c0 + c
      const x = dem.originX + demCol * dem.cellSizeX
      const lon = dem.west + (x - dem.originX) / dem.metersPerDegLon
      const elev = dem.elevations[demRow * dem.cols + demCol] + offsetM
      const i = r * cols + c
      const [wx, wy, wz] = worldPos(x, elev, y)
      positions[i * 3] = wx
      positions[i * 3 + 1] = wy
      positions[i * 3 + 2] = wz
      // flipY=true textures: v=0 is image bottom → geographic south.
      uvs[i * 2] = (lon - west) / lonSpan
      uvs[i * 2 + 1] = (lat - south) / latSpan
    }
  }

  // Same diagonal split as buildTerrainGeometry.
  const indices = new Uint32Array((cols - 1) * (rows - 1) * 6)
  let iIdx = 0
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c
      const b = a + 1
      const d = a + cols
      const e = d + 1
      indices[iIdx++] = a
      indices[iIdx++] = d
      indices[iIdx++] = b
      indices[iIdx++] = b
      indices[iIdx++] = d
      indices[iIdx++] = e
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.computeVertexNormals()
  return geometry
}

function TerrainOrthophoto({
  dem,
  overlay,
  visible,
}: {
  dem: ModelDemGrid
  overlay: ModelOrthophotoOverlay
  visible: boolean
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)

  useEffect(() => {
    let cancelled = false
    let owned: THREE.Texture | null = null
    const loader = new THREE.TextureLoader()
    loader.load(
      overlay.imageUrl,
      (loaded) => {
        if (cancelled) {
          loaded.dispose()
          return
        }
        loaded.colorSpace = THREE.SRGBColorSpace
        loaded.anisotropy = 4
        loaded.wrapS = THREE.ClampToEdgeWrapping
        loaded.wrapT = THREE.ClampToEdgeWrapping
        loaded.needsUpdate = true
        owned = loaded
        setTexture(loaded)
      },
      undefined,
      () => {
        // Corrupt / revoked URL — skip this orthophoto instead of crashing.
        if (!cancelled) setTexture(null)
      },
    )
    return () => {
      cancelled = true
      owned?.dispose()
      owned = null
      setTexture(null)
    }
  }, [overlay.imageUrl])

  useLayoutEffect(() => {
    const material = materialRef.current
    if (!material) return
    material.map = texture
    material.needsUpdate = true
  }, [texture])

  const geometry = useMemo(
    () =>
      buildDrapedOrthophotoGeometry(
        dem,
        overlay.southwest,
        overlay.northeast,
      ),
    [dem, overlay.southwest, overlay.northeast],
  )

  useLayoutEffect(() => {
    return () => {
      geometry?.dispose()
    }
  }, [geometry])

  if (!geometry || !texture) return null

  return (
    <mesh
      geometry={geometry as THREE.BufferGeometry}
      renderOrder={RENDER_ORDER_ORTHO}
      visible={visible}
    >
      <meshStandardMaterial
        ref={materialRef}
        roughness={0.95}
        metalness={0}
        side={THREE.DoubleSide}
        depthWrite
        depthTest
      />
    </mesh>
  )
}

function TerrainOrthophotos({
  dem,
  orthophotos,
  visible,
}: {
  dem: ModelDemGrid
  orthophotos: ModelOrthophotoOverlay[]
  visible: boolean
}) {
  if (orthophotos.length === 0) return null
  return (
    <group>
      {orthophotos.map((overlay) => (
        <TerrainOrthophoto
          key={overlay.id}
          dem={dem}
          overlay={overlay}
          visible={visible}
        />
      ))}
    </group>
  )
}

/**
 * Build a fill mesh that follows DEM elevation: tessellate onto DEM cells
 * whose triangle centroids lie inside the ring (with a subdivided boundary
 * triangulation fallback for polygons smaller than one cell).
 */
function buildDrapedFillGeometry(
  dem: ModelDemGrid,
  ring: LocalVertex[],
  offsetM = POLY_OFFSET_M,
): THREE.BufferGeometry | null {
  if (ring.length < 3) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of ring) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }

  const c0 = Math.max(0, Math.floor((minX - dem.originX) / dem.cellSizeX))
  const c1 = Math.min(
    dem.cols - 1,
    Math.ceil((maxX - dem.originX) / dem.cellSizeX),
  )
  const r0 = Math.max(0, Math.floor((minY - dem.originY) / dem.cellSizeY))
  const r1 = Math.min(
    dem.rows - 1,
    Math.ceil((maxY - dem.originY) / dem.cellSizeY),
  )

  const vertIndex = new Map<string, number>()
  const localVerts: LocalVertex[] = []
  const triIndices: number[] = []

  function gridVert(col: number, row: number): number {
    const key = `${col},${row}`
    const existing = vertIndex.get(key)
    if (existing !== undefined) return existing
    const idx = localVerts.length
    localVerts.push({
      x: dem.originX + col * dem.cellSizeX,
      y: dem.originY + row * dem.cellSizeY,
    })
    vertIndex.set(key, idx)
    return idx
  }

  function emitIfInside(i0: number, i1: number, i2: number) {
    const a = localVerts[i0]
    const b = localVerts[i1]
    const c = localVerts[i2]
    const cx = (a.x + b.x + c.x) / 3
    const cy = (a.y + b.y + c.y) / 3
    if (!pointInLocalPolygon(cx, cy, ring)) return
    triIndices.push(i0, i1, i2)
  }

  for (let row = r0; row < r1; row++) {
    for (let col = c0; col < c1; col++) {
      const i00 = gridVert(col, row)
      const i10 = gridVert(col + 1, row)
      const i01 = gridVert(col, row + 1)
      const i11 = gridVert(col + 1, row + 1)
      // Same diagonal split as the terrain mesh.
      emitIfInside(i00, i01, i10)
      emitIfInside(i10, i01, i11)
    }
  }

  if (triIndices.length === 0) {
    // Tiny polygon: subdivide a 2D boundary triangulation until edges match DEM.
    const maxEdge = densifyStepForDem(dem)
    const contour = ring.map((p) => new THREE.Vector2(p.x, p.y))
    let faces: number[][]
    try {
      faces = THREE.ShapeUtils.triangulateShape(contour, [])
    } catch {
      return null
    }
    if (faces.length === 0) return null

    localVerts.length = 0
    for (const p of ring) localVerts.push({ x: p.x, y: p.y })

    const midCache = new Map<string, number>()
    const edgeKey = (i: number, j: number) => (i < j ? `${i}:${j}` : `${j}:${i}`)
    const midpointIndex = (i: number, j: number) => {
      const key = edgeKey(i, j)
      const hit = midCache.get(key)
      if (hit !== undefined) return hit
      const a = localVerts[i]
      const b = localVerts[j]
      const idx = localVerts.length
      localVerts.push({ x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 })
      midCache.set(key, idx)
      return idx
    }

    const queue: [number, number, number][] = faces.map((f) => [
      f[0],
      f[1],
      f[2],
    ])
    const finalFaces: [number, number, number][] = []
    const maxIters = 50_000
    let iters = 0
    while (queue.length > 0 && iters++ < maxIters) {
      const [i0, i1, i2] = queue.pop()!
      const a = localVerts[i0]
      const b = localVerts[i1]
      const c = localVerts[i2]
      const e01 = Math.hypot(b.x - a.x, b.y - a.y)
      const e12 = Math.hypot(c.x - b.x, c.y - b.y)
      const e20 = Math.hypot(a.x - c.x, a.y - c.y)
      const longest = Math.max(e01, e12, e20)
      if (longest <= maxEdge) {
        finalFaces.push([i0, i1, i2])
        continue
      }
      if (e01 >= e12 && e01 >= e20) {
        const m = midpointIndex(i0, i1)
        queue.push([i0, m, i2], [m, i1, i2])
      } else if (e12 >= e20) {
        const m = midpointIndex(i1, i2)
        queue.push([i0, i1, m], [i0, m, i2])
      } else {
        const m = midpointIndex(i2, i0)
        queue.push([i0, i1, m], [m, i1, i2])
      }
    }

    for (const [i0, i1, i2] of finalFaces) {
      triIndices.push(i0, i1, i2)
    }
  }

  if (triIndices.length === 0) return null

  const positions = new Float32Array(localVerts.length * 3)
  for (let i = 0; i < localVerts.length; i++) {
    const p = localVerts[i]
    const [wx, wy, wz] = elevateLocalPoint(dem, p.x, p.y, offsetM)
    positions[i * 3] = wx
    positions[i * 3 + 1] = wy
    positions[i * 3 + 2] = wz
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(triIndices), 1))
  geometry.computeVertexNormals()
  return geometry
}

function overlayLocalRings(
  dem: ModelDemGrid,
  overlay: ModelPolygonOverlay,
  step: number,
): LocalVertex[][] {
  return overlay.rings.map((ring) =>
    densifyLocalRing(
      ring.map(([lon, lat]) => lonLatToLocal(dem, lon, lat)),
      step,
    ),
  )
}

function TerrainPolygon({
  dem,
  overlay,
  localRings,
  hoverEnabled,
  highlighted,
  primaryHovered,
  onHover,
}: {
  dem: ModelDemGrid
  overlay: ModelPolygonOverlay
  localRings: LocalVertex[][]
  hoverEnabled: boolean
  highlighted: boolean
  primaryHovered: boolean
  onHover: (id: string | null) => void
}) {
  const style = POLYGON_STYLES[overlay.type]
  const isIup = overlay.type === 'IUP'
  const fillOffset = isIup ? POLY_OFFSET_M : POLY_OFFSET_M + CHILD_HIT_BIAS_M
  useCursor(hoverEnabled && primaryHovered)

  const linePointSets = useMemo(
    () =>
      localRings.map((ring) => {
        if (ring.length === 0) return [] as [number, number, number][]
        const closed = [...ring, ring[0]]
        return closed.map((p) => {
          const elev = sampleModelElevation(dem, p.x, p.y) + POLY_OFFSET_M
          return worldPos(p.x, elev, p.y)
        })
      }),
    [dem, localRings],
  )

  const fillGeometries = useMemo(() => {
    if (!hoverEnabled) return [] as THREE.BufferGeometry[]
    return localRings
      .map((ring) => buildDrapedFillGeometry(dem, ring, fillOffset))
      .filter((g): g is THREE.BufferGeometry => g !== null)
  }, [dem, localRings, fillOffset, hoverEnabled])

  useLayoutEffect(() => {
    return () => {
      for (const g of fillGeometries) g.dispose()
    }
  }, [fillGeometries])

  return (
    <group
      onPointerOver={
        hoverEnabled
          ? (event) => {
              event.stopPropagation()
              onHover(overlay.id)
            }
          : undefined
      }
      onPointerOut={
        hoverEnabled
          ? (event) => {
              event.stopPropagation()
              onHover(null)
            }
          : undefined
      }
    >
      {linePointSets.map((points, i) =>
        points.length >= 2 ? (
          <Line
            key={`${overlay.id}-line-${i}`}
            points={points}
            color={style.boundary}
            lineWidth={hoverEnabled && primaryHovered ? 3 : 2}
            depthTest
            renderOrder={RENDER_ORDER_POLY_LINE}
          />
        ) : null,
      )}
      {fillGeometries.map((geometry, i) => (
        <mesh
          key={`${overlay.id}-fill-${i}`}
          geometry={geometry as THREE.BufferGeometry}
          renderOrder={
            isIup ? RENDER_ORDER_POLY_FILL : RENDER_ORDER_POLY_FILL + 1
          }
        >
          <meshBasicMaterial
            color={style.fill}
            transparent
            opacity={highlighted ? style.fillOpacity : 0}
            depthWrite={false}
            depthTest
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

function TerrainPolygons({
  dem,
  overlays,
  hoverEnabled,
  onHoveredLabel,
}: {
  dem: ModelDemGrid
  overlays: ModelPolygonOverlay[]
  hoverEnabled: boolean
  onHoveredLabel: (label: string | null) => void
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const step = densifyStepForDem(dem)

  const ringsById = useMemo(() => {
    const map = new Map<string, LocalVertex[][]>()
    for (const overlay of overlays) {
      map.set(overlay.id, overlayLocalRings(dem, overlay, step))
    }
    return map
  }, [dem, overlays, step])

  /** IUP id → contained non-IUP overlay ids (centroid inside any IUP ring). */
  const childrenByIup = useMemo(() => {
    if (!hoverEnabled) return new Map<string, string[]>()
    const map = new Map<string, string[]>()
    const iups = overlays.filter((o) => o.type === 'IUP')
    const children = overlays.filter((o) => o.type !== 'IUP')

    for (const iup of iups) {
      const iupRings = ringsById.get(iup.id) ?? []
      const contained: string[] = []
      for (const child of children) {
        const childRings = ringsById.get(child.id) ?? []
        const ring = childRings[0]
        if (!ring || ring.length === 0) continue
        const c = localRingCentroid(ring)
        if (!c) continue
        const inside = iupRings.some((iupRing) =>
          pointInLocalPolygon(c.x, c.y, iupRing),
        )
        if (inside) contained.push(child.id)
      }
      contained.sort((a, b) => {
        const areaA = localRingArea((ringsById.get(a) ?? [])[0] ?? [])
        const areaB = localRingArea((ringsById.get(b) ?? [])[0] ?? [])
        return areaA - areaB
      })
      map.set(iup.id, contained)
    }
    return map
  }, [overlays, ringsById, hoverEnabled])

  const effectiveHoveredId = hoverEnabled ? hoveredId : null

  const highlightedIds = useMemo(() => {
    const ids = new Set<string>()
    if (!effectiveHoveredId) return ids
    ids.add(effectiveHoveredId)
    const hovered = overlays.find((o) => o.id === effectiveHoveredId)
    if (hovered?.type === 'IUP') {
      for (const childId of childrenByIup.get(effectiveHoveredId) ?? []) {
        ids.add(childId)
      }
    }
    return ids
  }, [effectiveHoveredId, overlays, childrenByIup])

  useLayoutEffect(() => {
    if (!hoverEnabled) {
      setHoveredId(null)
      onHoveredLabel(null)
      return
    }
    if (!hoveredId) {
      onHoveredLabel(null)
      return
    }
    const hovered = overlays.find((o) => o.id === hoveredId)
    if (!hovered) {
      onHoveredLabel(null)
      return
    }
    const name = hovered.name.trim()
    onHoveredLabel(name || hovered.type)
  }, [hoveredId, overlays, onHoveredLabel, hoverEnabled])

  if (overlays.length === 0) return null

  return (
    <group>
      {overlays.map((overlay) => (
        <TerrainPolygon
          key={overlay.id}
          dem={dem}
          overlay={overlay}
          localRings={ringsById.get(overlay.id) ?? []}
          hoverEnabled={hoverEnabled}
          highlighted={highlightedIds.has(overlay.id)}
          primaryHovered={effectiveHoveredId === overlay.id}
          onHover={setHoveredId}
        />
      ))}
    </group>
  )
}

type AxisPlan = {
  axisPoints: [number, number, number][]
  ticks: {
    points: [number, number, number][]
    label: string
    labelPos: [number, number, number]
  }[]
  endLabel: string
  endPos: [number, number, number]
  color: string
}

function buildAxisPlans(dem: ModelDemGrid, labelSize: number): AxisPlan[] {
  const x0 = dem.originX
  const nSouth = dem.originY
  const x1 = dem.originX + (dem.cols - 1) * dem.cellSizeX
  const nNorth = dem.originY + (dem.rows - 1) * dem.cellSizeY
  const zSouth = -nSouth
  const zNorth = -nNorth
  const y0 = elevY(dem.minElevation)
  const y1 = elevY(dem.maxElevation)
  const widthM = x1 - x0
  const depthM = nNorth - nSouth
  const heightM = Math.max(y1 - y0, 1)
  const stepX = niceStep(widthM, 5)
  const stepZ = niceStep(depthM, 5)
  const stepY = niceStep(heightM / V_EXAG, 5)
  const tickLen = Math.max(Math.min(widthM, depthM) * 0.02, 2)
  const zSign = zNorth >= zSouth ? 1 : -1

  const xTicks: AxisPlan['ticks'] = []
  for (let x = 0; x <= widthM + stepX * 0.01; x += stepX) {
    const wx = x0 + x
    xTicks.push({
      points: [
        [wx, y0, zSouth],
        [wx, y0, zSouth - tickLen * zSign],
      ],
      label: formatTick(x, stepX),
      labelPos: [wx, y0 - labelSize * 0.4, zSouth - tickLen * 2.2 * zSign],
    })
  }

  const zTicks: AxisPlan['ticks'] = []
  for (let n = 0; n <= depthM + stepZ * 0.01; n += stepZ) {
    const wz = -(nSouth + n)
    zTicks.push({
      points: [
        [x0, y0, wz],
        [x0 - tickLen, y0, wz],
      ],
      label: formatTick(n, stepZ),
      labelPos: [x0 - tickLen * 2.2, y0 - labelSize * 0.4, wz],
    })
  }

  const yTicks: AxisPlan['ticks'] = []
  for (
    let elev = dem.minElevation;
    elev <= dem.maxElevation + stepY * 0.01;
    elev += stepY
  ) {
    const wy = elevY(elev)
    yTicks.push({
      points: [
        [x0, wy, zSouth],
        [x0 - tickLen, wy, zSouth],
      ],
      label: formatTick(elev, stepY),
      labelPos: [x0 - tickLen * 2.4, wy, zSouth],
    })
  }

  return [
    {
      axisPoints: [
        [x0, y0, zSouth],
        [x1, y0, zSouth],
      ],
      ticks: xTicks,
      endLabel: 'X (E)',
      endPos: [x1 + labelSize * 1.2, y0, zSouth],
      color: AXIS_X,
    },
    {
      axisPoints: [
        [x0, y0, zSouth],
        [x0, y1, zSouth],
      ],
      ticks: yTicks,
      endLabel: 'Y (elev)',
      endPos: [x0, y1 + labelSize * 1.2, zSouth],
      color: AXIS_Y,
    },
    {
      axisPoints: [
        [x0, y0, zSouth],
        [x0, y0, zNorth],
      ],
      ticks: zTicks,
      endLabel: 'Z (N)',
      endPos: [x0, y0, zNorth + zSign * labelSize * 1.2],
      color: AXIS_Z,
    },
  ]
}

function GraduatedAxes({
  dem,
  labelSize,
}: {
  dem: ModelDemGrid
  labelSize: number
}) {
  const plans = useMemo(
    () => buildAxisPlans(dem, labelSize),
    [dem, labelSize],
  )
  const fontSize = labelSize * 0.85

  return (
    <group>
      {plans.map((plan) => (
        <group key={plan.endLabel}>
          <Line points={plan.axisPoints} color={plan.color} lineWidth={2} />
          {plan.ticks.map((tick, i) => (
            <group key={`${plan.endLabel}-${i}`}>
              <Line points={tick.points} color={plan.color} lineWidth={1.25} />
              <Text
                position={tick.labelPos}
                fontSize={fontSize * 0.7}
                color={plan.color}
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#10161c"
              >
                {tick.label}
              </Text>
            </group>
          ))}
          <Text
            position={plan.endPos}
            fontSize={fontSize}
            color={plan.color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#10161c"
          >
            {plan.endLabel}
          </Text>
        </group>
      ))}
    </group>
  )
}

function CompassDriver({
  roseRef,
}: {
  roseRef: RefObject<HTMLDivElement | null>
}) {
  const { camera } = useThree()
  const dir = useRef(new THREE.Vector3())

  useFrame(() => {
    const el = roseRef.current
    if (!el) return
    camera.getWorldDirection(dir.current)
    // After northing negation, geographic north is world -Z.
    const yawDeg = THREE.MathUtils.radToDeg(
      Math.atan2(dir.current.x, -dir.current.z),
    )
    el.style.transform = `rotate(${-yawDeg}deg)`
  })

  return null
}

function CompassOverlay({
  roseRef,
}: {
  roseRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      className="pointer-events-none absolute top-3 right-3 z-10 flex size-16 items-center justify-center rounded-full border border-white/15 bg-[#10161c]/85 shadow-lg backdrop-blur-sm"
      aria-label="Compass"
    >
      <div ref={roseRef} className="relative size-12 will-change-transform">
        <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-[#e8eef2]">
          N
        </span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-white/45">
          S
        </span>
        <span className="absolute top-1/2 left-0 -translate-y-1/2 text-[9px] text-white/45">
          W
        </span>
        <span className="absolute top-1/2 right-0 -translate-y-1/2 text-[9px] text-white/45">
          E
        </span>
        <span className="absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
        <span className="absolute left-1/2 top-[18%] h-[32%] w-0.5 -translate-x-1/2 rounded-full bg-[#c45c4a]" />
      </div>
    </div>
  )
}

export function ModelTerrainScene({
  dem,
  overlays,
  orthophotos,
}: {
  dem: ModelDemGrid
  overlays: ModelPolygonOverlay[]
  orthophotos: ModelOrthophotoOverlay[]
}) {
  const frame = useMemo(() => frameFromDem(dem), [dem])
  const roseRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null)
  const [hoverEnabled, setHoverEnabled] = useState(false)
  const [orthoVisible, setOrthoVisible] = useState(true)
  const [polygonsVisible, setPolygonsVisible] = useState(true)

  function resetView() {
    const controls = controlsRef.current
    if (!controls) return
    const cam = controls.object
    cam.position.set(frame.camera[0], frame.camera[1], frame.camera[2])
    controls.target.set(frame.target[0], frame.target[1], frame.target[2])
    controls.update()
  }

  const toggleClassName =
    'pointer-events-auto border-white/15 bg-[#10161c]/85 text-[#e8eef2] hover:bg-[#10161c] hover:text-[#e8eef2] aria-pressed:bg-[#e8eef2]/15 aria-pressed:text-[#e8eef2]'

  return (
    <div className="absolute inset-0">
      <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-wrap items-start gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="pointer-events-auto gap-1.5 bg-[#10161c]/85 text-[#e8eef2] hover:bg-[#10161c]"
          onClick={resetView}
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset view
        </Button>
        <Toggle
          size="sm"
          variant="outline"
          pressed={orthoVisible}
          onPressedChange={setOrthoVisible}
          disabled={orthophotos.length === 0}
          aria-label="Toggle orthophoto layer"
          className={toggleClassName}
        >
          Ortho
        </Toggle>
        <Toggle
          size="sm"
          variant="outline"
          pressed={polygonsVisible}
          onPressedChange={setPolygonsVisible}
          disabled={overlays.length === 0}
          aria-label="Toggle polygon layer"
          className={toggleClassName}
        >
          Polygons
        </Toggle>
        <Toggle
          size="sm"
          variant="outline"
          pressed={hoverEnabled}
          onPressedChange={setHoverEnabled}
          disabled={!polygonsVisible || overlays.length === 0}
          aria-label="Toggle polygon hover highlights"
          className={toggleClassName}
        >
          Hover
        </Toggle>
        {polygonsVisible && hoverEnabled && hoveredLabel ? (
          <div className="rounded-md bg-card/95 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-card-foreground shadow-sm ring-1 ring-foreground/10">
            {hoveredLabel}
          </div>
        ) : null}
      </div>
      <CompassOverlay roseRef={roseRef} />
      <Canvas
        className="h-full w-full touch-none"
        camera={{
          position: frame.camera,
          fov: 42,
          near: 1,
          far: frame.far,
        }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        resize={{ debounce: 0, scroll: false }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement
          const onLost = (event: Event) => {
            // Allow the browser to restore the context instead of hard-failing.
            event.preventDefault()
          }
          canvas.addEventListener('webglcontextlost', onLost, false)
        }}
      >
        <color attach="background" args={['#10161c']} />
        <fog attach="fog" args={['#10161c', frame.fogNear, frame.fogFar]} />
        <hemisphereLight args={['#c8d6dc', '#1c2228', 0.85]} />
        <directionalLight position={[600, 900, 280]} intensity={1.15} />
        <directionalLight position={[-420, 280, -520]} intensity={0.28} />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          zoomToCursor
          target={frame.target}
          minDistance={frame.minDistance}
          maxDistance={frame.maxDistance}
          minPolarAngle={0.08}
          maxPolarAngle={Math.PI / 2}
        />

        <TerrainMesh dem={dem} />
        <TerrainOrthophotos
          dem={dem}
          orthophotos={orthophotos}
          visible={orthoVisible}
        />
        <group visible={polygonsVisible}>
          <TerrainPolygons
            dem={dem}
            overlays={overlays}
            hoverEnabled={polygonsVisible && hoverEnabled}
            onHoveredLabel={setHoveredLabel}
          />
        </group>
        <GraduatedAxes dem={dem} labelSize={frame.labelSize} />
        <CompassDriver roseRef={roseRef} />

        <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
          <GizmoViewport
            axisColors={[AXIS_X, AXIS_Y, AXIS_Z]}
            labelColor="#e8eef2"
          />
        </GizmoHelper>
      </Canvas>
    </div>
  )
}
