'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  GizmoHelper,
  GizmoViewport,
  Html,
  Line,
  OrbitControls,
  useCursor,
} from '@react-three/drei'
import * as THREE from 'three'

import {
  densifyRing,
  generateBlockModel,
  holePointAt,
  sampleElevation,
  type BlockVoxel,
  type DemGrid,
  type DigitalTwinSceneProps,
  type DigitalTwinSnapshot,
  type DrillHole,
  type EquipmentSnapshot,
  type TwinEquipmentType,
} from '@/lib/rd/digital-twin-dummy'

const V_EXAG = 1.4
const FENCE_HEIGHT = 16
const EQUIPMENT_LABELS: Record<TwinEquipmentType, string> = {
  dt: 'Dump Truck',
  exca: 'Excavator',
  lv: 'Light Vehicle',
  dozer: 'Dozer',
  grader: 'Grader',
  wt: 'Water Truck',
  ft: 'Fuel Truck',
  mh: 'Man Hauler',
}

const EQUIPMENT_MESH: Record<
  TwinEquipmentType,
  { w: number; h: number; l: number; color: string }
> = {
  dt: { w: 14, h: 12, l: 32, color: '#e8a54b' },
  exca: { w: 16, h: 16, l: 26, color: '#d4c24a' },
  lv: { w: 8, h: 7, l: 12, color: '#e4eef2' },
  dozer: { w: 16, h: 12, l: 22, color: '#8fb56a' },
  grader: { w: 12, h: 10, l: 30, color: '#6aa88a' },
  wt: { w: 13, h: 12, l: 28, color: '#5aa7c4' },
  ft: { w: 13, h: 12, l: 28, color: '#d07a4a' },
  mh: { w: 12, h: 11, l: 24, color: '#7a9eaa' },
}

function elevY(z: number) {
  return z * V_EXAG
}

function gradeToColor(gradeNi: number, target: THREE.Color) {
  const t = Math.min(1, Math.max(0, (gradeNi - 0.3) / 1.9))
  if (t < 0.35) {
    target.set('#6d6458').lerp(new THREE.Color('#c4a056'), t / 0.35)
  } else if (t < 0.65) {
    target.set('#c4a056').lerp(new THREE.Color('#8fb85c'), (t - 0.35) / 0.3)
  } else {
    target.set('#8fb85c').lerp(new THREE.Color('#3ea88e'), (t - 0.65) / 0.35)
  }
  return target
}

function terrainColor(z: number, min: number, max: number, target: THREE.Color) {
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

function buildTerrainGeometry(dem: DemGrid) {
  const { cols, rows, cellSize, originX, originY, elevations, minElevation, maxElevation } =
    dem
  const positions = new Float32Array(cols * rows * 3)
  const colors = new Float32Array(cols * rows * 3)
  const color = new THREE.Color()

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const x = originX + c * cellSize
      const y = originY + r * cellSize
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

  const indices: number[] = []
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c
      const b = a + 1
      const d = a + cols
      const e = d + 1
      indices.push(a, d, b, b, d, e)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function buildFenceGeometry(dem: DemGrid, ring: { x: number; y: number }[]) {
  const n = ring.length
  const positions = new Float32Array(n * 2 * 3)
  for (let i = 0; i < n; i++) {
    const z = sampleElevation(dem, ring[i].x, ring[i].y) + 0.4
    positions[i * 6] = ring[i].x
    positions[i * 6 + 1] = elevY(z)
    positions[i * 6 + 2] = ring[i].y
    positions[i * 6 + 3] = ring[i].x
    positions[i * 6 + 4] = elevY(z + FENCE_HEIGHT)
    positions[i * 6 + 5] = ring[i].y
  }

  const indices: number[] = []
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n
    const b0 = i * 2
    const t0 = b0 + 1
    const b1 = next * 2
    const t1 = b1 + 1
    indices.push(b0, b1, t0, t0, b1, t1)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function DigitalTwinScene({
  snapshot,
  showEquipment,
  showBlockModel,
  showDrillHoles,
  blockSize,
}: DigitalTwinSceneProps) {
  const voxels = useMemo(() => {
    if (!showBlockModel) return [] as BlockVoxel[]
    return generateBlockModel(snapshot, blockSize.x, blockSize.y, blockSize.z)
  }, [snapshot, showBlockModel, blockSize.x, blockSize.y, blockSize.z])

  return (
    <Canvas
      className="h-full w-full touch-none"
      camera={{ position: [980, 740, 1120], fov: 42, near: 2, far: 9000 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#10161c']} />
      <fog attach="fog" args={['#10161c', 2800, 6200]} />
      <hemisphereLight args={['#c8d6dc', '#1c2228', 0.85]} />
      <directionalLight position={[600, 900, 280]} intensity={1.15} />
      <directionalLight position={[-420, 280, -520]} intensity={0.28} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={[0, 210, 0]}
        minDistance={80}
        maxDistance={3200}
        maxPolarAngle={Math.PI / 2.02}
      />

      <TerrainMesh dem={snapshot.dem} faded={showBlockModel} />
      <LeaseBoundary snapshot={snapshot} />
      {showBlockModel ? (
        <BlockModelLayer
          key={`${blockSize.x}x${blockSize.y}x${blockSize.z}`}
          voxels={voxels}
        />
      ) : null}
      {showDrillHoles ? (
        <DrillHolesLayer holes={snapshot.drillHoles} dem={snapshot.dem} />
      ) : null}
      {showEquipment ? (
        <EquipmentLayer units={snapshot.equipment} dem={snapshot.dem} />
      ) : null}

      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport
          axisColors={['#c45c4a', '#6aa88a', '#5aa7c4']}
          labelColor="#e8eef2"
        />
      </GizmoHelper>
    </Canvas>
  )
}

function TerrainMesh({ dem, faded }: { dem: DemGrid; faded: boolean }) {
  const geometry = useMemo(() => buildTerrainGeometry(dem), [dem])

  useLayoutEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        roughness={0.92}
        metalness={0.02}
        side={THREE.DoubleSide}
        transparent={faded}
        opacity={faded ? 0.5 : 1}
      />
    </mesh>
  )
}

function LeaseBoundary({ snapshot }: { snapshot: DigitalTwinSnapshot }) {
  const ring = useMemo(
    () => densifyRing(snapshot.polygon.vertices, 18),
    [snapshot],
  )
  const linePoints = useMemo(
    () =>
      [...ring, ring[0]].map((p) => {
        const z = sampleElevation(snapshot.dem, p.x, p.y) + 1.4
        return [p.x, elevY(z), p.y] as [number, number, number]
      }),
    [ring, snapshot.dem],
  )
  const fence = useMemo(
    () => buildFenceGeometry(snapshot.dem, ring),
    [snapshot.dem, ring],
  )

  useLayoutEffect(() => {
    return () => fence.dispose()
  }, [fence])

  return (
    <group>
      <Line points={linePoints} color="#8fd4dc" lineWidth={2} />
      <mesh geometry={fence}>
        <meshStandardMaterial
          color="#8fd4dc"
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function BlockModelLayer({ voxels }: { voxels: BlockVoxel[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = voxels.length

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh || count === 0) return
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const v = voxels[i]
      dummy.position.set(v.x, elevY(v.z), v.y)
      dummy.scale.set(v.dx * 0.9, v.dz * V_EXAG * 0.9, v.dy * 0.9)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      gradeToColor(v.gradeNi, color)
      mesh.setColorAt(i, color)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [voxels, count])

  if (count === 0) return null

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.78}
        roughness={0.62}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

function EquipmentLayer({
  units,
  dem,
}: {
  units: EquipmentSnapshot[]
  dem: DemGrid
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <group>
      {units.map((unit) => (
        <EquipmentMarker
          key={unit.id}
          unit={unit}
          dem={dem}
          hovered={hoveredId === unit.id}
          onHover={setHoveredId}
        />
      ))}
    </group>
  )
}

function EquipmentMarker({
  unit,
  dem,
  hovered,
  onHover,
}: {
  unit: EquipmentSnapshot
  dem: DemGrid
  hovered: boolean
  onHover: (id: string | null) => void
}) {
  const spec = EQUIPMENT_MESH[unit.type]
  const z = sampleElevation(dem, unit.x, unit.y)
  const heading = -(unit.headingDeg * Math.PI) / 180
  const label = EQUIPMENT_LABELS[unit.type] ?? unit.type
  useCursor(hovered)

  return (
    <group
      position={[unit.x, elevY(z) + spec.h / 2 + 0.4, unit.y]}
      rotation={[0, heading, 0]}
      onPointerOver={(event) => {
        event.stopPropagation()
        onHover(unit.id)
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        onHover(null)
      }}
    >
      <mesh>
        <boxGeometry args={[spec.w, spec.h, spec.l]} />
        <meshStandardMaterial
          color={hovered ? '#f2f6f8' : spec.color}
          roughness={0.45}
          metalness={0.12}
        />
      </mesh>
      {unit.type === 'exca' ? (
        <mesh position={[0, spec.h * 0.22, spec.l * 0.38]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[spec.w * 0.28, spec.h * 0.22, spec.l * 0.7]} />
          <meshStandardMaterial color={spec.color} roughness={0.5} />
        </mesh>
      ) : null}
      {hovered ? (
        <Html
          sprite
          position={[0, spec.h * 0.7, 0]}
          distanceFactor={90}
          style={{ pointerEvents: 'none' }}
        >
          <div className="rounded-md bg-card/95 px-2 py-1 text-xs whitespace-nowrap text-card-foreground ring-1 ring-foreground/10">
            {unit.id}
            <span className="text-muted-foreground"> · {label}</span>
          </div>
        </Html>
      ) : null}
    </group>
  )
}

function DrillHolesLayer({
  holes,
  dem,
}: {
  holes: DrillHole[]
  dem: DemGrid
}) {
  return (
    <group>
      {holes.map((hole) => (
        <DrillHoleMesh key={hole.id} hole={hole} dem={dem} />
      ))}
    </group>
  )
}

function DrillHoleMesh({ hole, dem }: { hole: DrillHole; dem: DemGrid }) {
  const { collar, points, colors } = useMemo(() => {
    const collarZ = sampleElevation(dem, hole.x, hole.y)
    const color = new THREE.Color()
    const nextPoints: [number, number, number][] = []
    const nextColors: THREE.Color[] = []
    const nextCollar = holePointAt(hole, 0, collarZ)
    nextPoints.push([nextCollar.x, elevY(nextCollar.z) + 1, nextCollar.y])
    nextColors.push(new THREE.Color('#dce8ee'))
    for (const interval of hole.intervals) {
      const end = holePointAt(hole, interval.toM, collarZ)
      gradeToColor(interval.gradeNi, color)
      nextPoints.push([end.x, elevY(end.z), end.y])
      nextColors.push(color.clone())
    }
    return { collar: nextCollar, points: nextPoints, colors: nextColors }
  }, [hole, dem])

  return (
    <group>
      <mesh position={[collar.x, elevY(collar.z) + 2.5, collar.y]}>
        <sphereGeometry args={[3.2, 10, 10]} />
        <meshStandardMaterial color="#dce8ee" roughness={0.35} />
      </mesh>
      <Line points={points} vertexColors={colors} lineWidth={3} />
    </group>
  )
}
