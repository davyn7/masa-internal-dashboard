'use client'

import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  GizmoHelper,
  GizmoViewport,
  Line,
  OrbitControls,
  Text,
} from '@react-three/drei'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

import {
  densifyLocalRing,
  POLYGON_STYLES,
  type ModelPolygonOverlay,
} from '@/lib/rd/model-polygons'
import {
  lonLatToLocal,
  sampleModelElevation,
  type ModelDemGrid,
} from '@/lib/rd/model-terrain'

const V_EXAG = 1.4
/** Lift draped overlays slightly above the terrain mesh (orthometric meters). */
const POLY_OFFSET_M = 1.5

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
    minDistance: span * 0.08,
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
    <mesh geometry={geometry as THREE.BufferGeometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.92}
        metalness={0.02}
        side={THREE.DoubleSide}
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

function buildDrapedFillGeometry(
  dem: ModelDemGrid,
  ring: { x: number; y: number }[],
): THREE.BufferGeometry | null {
  if (ring.length < 3) return null

  const contour = ring.map((p) => new THREE.Vector2(p.x, p.y))
  let faces: number[][]
  try {
    faces = THREE.ShapeUtils.triangulateShape(contour, [])
  } catch {
    return null
  }
  if (faces.length === 0) return null

  const positions = new Float32Array(ring.length * 3)
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const elev = sampleModelElevation(dem, p.x, p.y) + POLY_OFFSET_M
    const [wx, wy, wz] = worldPos(p.x, elev, p.y)
    positions[i * 3] = wx
    positions[i * 3 + 1] = wy
    positions[i * 3 + 2] = wz
  }

  const indices = new Uint32Array(faces.length * 3)
  let iIdx = 0
  for (const face of faces) {
    indices[iIdx++] = face[0]
    indices[iIdx++] = face[1]
    indices[iIdx++] = face[2]
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.computeVertexNormals()
  return geometry
}

function TerrainPolygon({
  dem,
  overlay,
}: {
  dem: ModelDemGrid
  overlay: ModelPolygonOverlay
}) {
  const style = POLYGON_STYLES[overlay.type]
  const step = densifyStepForDem(dem)

  const localRings = useMemo(
    () =>
      overlay.rings.map((ring) =>
        densifyLocalRing(
          ring.map(([lon, lat]) => lonLatToLocal(dem, lon, lat)),
          step,
        ),
      ),
    [dem, overlay.rings, step],
  )

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
    if (!style.fill) return [] as THREE.BufferGeometry[]
    return localRings
      .map((ring) => buildDrapedFillGeometry(dem, ring))
      .filter((g): g is THREE.BufferGeometry => g !== null)
  }, [dem, localRings, style.fill])

  useLayoutEffect(() => {
    return () => {
      for (const g of fillGeometries) g.dispose()
    }
  }, [fillGeometries])

  return (
    <group>
      {linePointSets.map((points, i) =>
        points.length >= 2 ? (
          <Line
            key={`${overlay.id}-line-${i}`}
            points={points}
            color={style.boundary}
            lineWidth={2}
            depthTest
            renderOrder={2}
          />
        ) : null,
      )}
      {fillGeometries.map((geometry, i) => (
        <mesh
          key={`${overlay.id}-fill-${i}`}
          geometry={geometry as THREE.BufferGeometry}
          renderOrder={1}
        >
          <meshBasicMaterial
            color={style.fill!}
            transparent
            opacity={style.fillOpacity}
            depthWrite={false}
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
}: {
  dem: ModelDemGrid
  overlays: ModelPolygonOverlay[]
}) {
  if (overlays.length === 0) return null
  return (
    <group>
      {overlays.map((overlay) => (
        <TerrainPolygon key={overlay.id} dem={dem} overlay={overlay} />
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
}: {
  dem: ModelDemGrid
  overlays: ModelPolygonOverlay[]
}) {
  const frame = useMemo(() => frameFromDem(dem), [dem])
  const roseRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  function resetView() {
    const controls = controlsRef.current
    if (!controls) return
    const cam = controls.object
    cam.position.set(frame.camera[0], frame.camera[1], frame.camera[2])
    controls.target.set(frame.target[0], frame.target[1], frame.target[2])
    controls.update()
  }

  return (
    <div className="absolute inset-0">
      <div className="pointer-events-none absolute top-3 left-3 z-10">
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
        gl={{ antialias: true }}
        resize={{ debounce: 0, scroll: false }}
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
        <TerrainPolygons dem={dem} overlays={overlays} />
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
