'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import type { ModelPolygonOverlay } from '@/lib/rd/model-polygons'
import type { ModelDemGrid } from '@/lib/rd/model-terrain'

const ModelTerrainScene = dynamic(
  () =>
    import('@/components/rd/model-terrain-scene').then(
      (mod) => mod.ModelTerrainScene,
    ),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
    ),
  },
)

export function ModelTerrainCanvas({
  dem,
  overlays,
  sceneKey,
}: {
  dem: ModelDemGrid
  overlays: ModelPolygonOverlay[]
  /** Bumps on each Render so the scene remounts with a fresh GL context. */
  sceneKey: string | number
}) {
  // Defer one paint so the host flex panel has a real size before WebGL init.
  // (Avoid mounting inside Base UI `hidden` tab panels — that causes blank canvases.)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setReady(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [sceneKey])

  return (
    <div className="absolute inset-0 h-full min-h-[min(70vh,720px)] w-full">
      {ready ? (
        <ModelTerrainScene
          key={sceneKey}
          dem={dem}
          overlays={overlays}
        />
      ) : (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}
    </div>
  )
}
