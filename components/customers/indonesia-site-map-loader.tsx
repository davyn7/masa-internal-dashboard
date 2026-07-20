'use client'

import dynamic from 'next/dynamic'

import { Skeleton } from '@/components/ui/skeleton'
import type { CustomerSiteOverview } from '@/lib/customers/sites'

const IndonesiaSiteMap = dynamic(
  () =>
    import('./indonesia-site-map').then((mod) => mod.IndonesiaSiteMap),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[min(52vh,560px)] min-h-[480px] w-full" />
    ),
  },
)

export function IndonesiaSiteMapLoader({
  sites,
}: {
  sites: CustomerSiteOverview[]
}) {
  return <IndonesiaSiteMap sites={sites} />
}
