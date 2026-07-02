'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { BreakdownView } from '@/lib/finance/arr-breakdown'

export function BreakdownToggle({
  value,
  onChange,
  className,
}: {
  value: BreakdownView
  onChange: (value: BreakdownView) => void
  className?: string
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        const next = values[0]
        if (next) onChange(next as BreakdownView)
      }}
      variant="outline"
      size="sm"
      className={className}
      aria-label="Breakdown view"
    >
      <ToggleGroupItem value="client" aria-label="By client" className="px-3">
        By Client
      </ToggleGroupItem>
      <ToggleGroupItem value="site" aria-label="By site" className="px-3">
        By Site
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
