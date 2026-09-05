'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

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

/**
 * Mount WebGL only once the host is visible and has a real layout size.
 * Tab panels often report 0×0 on the first paint after activation.
 */
function useVisibleSizeReady(active: boolean, minSize = 4) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!active) {
      setReady(false)
      return
    }

    const el = ref.current
    if (!el) return

    let cancelled = false
    let raf = 0
    let frames = 0

    const isSized = () => {
      const { width, height } = el.getBoundingClientRect()
      return width >= minSize && height >= minSize
    }

    const markReady = () => {
      if (cancelled || !isSized()) return false
      setReady(true)
      return true
    }

    // Fresh activation: force a new readiness cycle.
    setReady(false)

    const tick = () => {
      if (cancelled) return
      if (markReady()) return
      frames += 1
      if (frames < 90) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)

    const ro = new ResizeObserver(() => {
      markReady()
    })
    ro.observe(el)

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((e) => e.isIntersecting)) markReady()
            },
            { threshold: 0.01 },
          )
        : null
    io?.observe(el)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io?.disconnect()
    }
  }, [active, minSize])

  return { ref, ready: active && ready }
}

export function ModelTerrainCanvas({
  dem,
  overlays,
  active,
  sceneKey,
}: {
  dem: ModelDemGrid
  overlays: ModelPolygonOverlay[]
  /** False while the Rendering tab is hidden — tears down WebGL cleanly. */
  active: boolean
  /** Bumps on each Render so the scene remounts with a fresh GL context. */
  sceneKey: string | number
}) {
  const { ref, ready } = useVisibleSizeReady(active)

  return (
    <div ref={ref} className="absolute inset-0 min-h-[min(70vh,720px)] w-full">
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
