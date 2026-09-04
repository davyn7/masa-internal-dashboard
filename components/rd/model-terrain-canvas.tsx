'use client'

import dynamic from 'next/dynamic'

import { Skeleton } from '@/components/ui/skeleton'
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

export function ModelTerrainCanvas({ dem }: { dem: ModelDemGrid }) {
  return (
    <div className="absolute inset-0">
      <ModelTerrainScene dem={dem} />
    </div>
  )
}
