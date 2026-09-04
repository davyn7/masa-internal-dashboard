'use client'

import dynamic from 'next/dynamic'

import { Skeleton } from '@/components/ui/skeleton'
import type { DigitalTwinSceneProps } from '@/lib/rd/digital-twin-dummy'

const DigitalTwinScene = dynamic(
  () =>
    import('@/components/rd/digital-twin-scene').then(
      (mod) => mod.DigitalTwinScene,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-none" />,
  },
)

export function DigitalTwinCanvas(props: DigitalTwinSceneProps) {
  return (
    <div className="absolute inset-0">
      <DigitalTwinScene {...props} />
    </div>
  )
}
