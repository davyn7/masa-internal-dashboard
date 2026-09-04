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
import * as THREE from 'three'

import type { ModelDemGrid } from '@/lib/rd/model-terrain'

const V_EXAG = 1.4

const AXIS_X = '#c45c4a'
const AXIS_Y = '#6aa88a'
const AXIS_Z = '#5aa7c4'

function elevY(z: number) {
  return z * V_EXAG
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
      const y = originY + r * cellSizeY
      const z = elevations[i]
      positions[i * 3] = x
      positions[i * 3 + 1] = elevY(z)
      positions[i * 3 + 2] = y
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
  const z0 = dem.originY
  const x1 = dem.originX + (dem.cols - 1) * dem.cellSizeX
  const z1 = dem.originY + (dem.rows - 1) * dem.cellSizeY
  const y0 = elevY(dem.minElevation)
  const y1 = elevY(dem.maxElevation)
  const widthM = x1 - x0
  const depthM = z1 - z0
  const heightM = Math.max(y1 - y0, 1)
  const stepX = niceStep(widthM, 5)
  const stepZ = niceStep(depthM, 5)
  const stepY = niceStep(heightM / V_EXAG, 5)
  const tickLen = Math.max(Math.min(widthM, depthM) * 0.02, 2)

  const xTicks: AxisPlan['ticks'] = []
  for (let x = 0; x <= widthM + stepX * 0.01; x += stepX) {
    const wx = x0 + x
    xTicks.push({
      points: [
        [wx, y0, z0],
        [wx, y0, z0 - tickLen],
      ],
      label: formatTick(x, stepX),
      labelPos: [wx, y0 - labelSize * 0.4, z0 - tickLen * 2.2],
    })
  }

  const zTicks: AxisPlan['ticks'] = []
  for (let z = 0; z <= depthM + stepZ * 0.01; z += stepZ) {
    const wz = z0 + z
    zTicks.push({
      points: [
        [x0, y0, wz],
        [x0 - tickLen, y0, wz],
      ],
      label: formatTick(z, stepZ),
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
        [x0, wy, z0],
        [x0 - tickLen, wy, z0],
      ],
      label: formatTick(elev, stepY),
      labelPos: [x0 - tickLen * 2.4, wy, z0],
    })
  }

  return [
    {
      axisPoints: [
        [x0, y0, z0],
        [x1, y0, z0],
      ],
      ticks: xTicks,
      endLabel: 'X (E)',
      endPos: [x1 + labelSize * 1.2, y0, z0],
      color: AXIS_X,
    },
    {
      axisPoints: [
        [x0, y0, z0],
        [x0, y1, z0],
      ],
      ticks: yTicks,
      endLabel: 'Y (elev)',
      endPos: [x0, y1 + labelSize * 1.2, z0],
      color: AXIS_Y,
    },
    {
      axisPoints: [
        [x0, y0, z0],
        [x0, y0, z1],
      ],
      ticks: zTicks,
      endLabel: 'Z (N)',
      endPos: [x0, y0, z1 + labelSize * 1.2],
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
    // +Z is north, +X is east — yaw of view direction on the ground plane
    const yawDeg = THREE.MathUtils.radToDeg(
      Math.atan2(dir.current.x, dir.current.z),
    )
    // Rotate rose opposite to camera yaw so N stays toward world +Z
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

export function ModelTerrainScene({ dem }: { dem: ModelDemGrid }) {
  const frame = useMemo(() => frameFromDem(dem), [dem])
  const roseRef = useRef<HTMLDivElement>(null)

  return (
    <div className="absolute inset-0">
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
      >
        <color attach="background" args={['#10161c']} />
        <fog attach="fog" args={['#10161c', frame.fogNear, frame.fogFar]} />
        <hemisphereLight args={['#c8d6dc', '#1c2228', 0.85]} />
        <directionalLight position={[600, 900, 280]} intensity={1.15} />
        <directionalLight position={[-420, 280, -520]} intensity={0.28} />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          target={frame.target}
          minDistance={frame.minDistance}
          maxDistance={frame.maxDistance}
          maxPolarAngle={Math.PI / 2.02}
        />

        <TerrainMesh dem={dem} />
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
