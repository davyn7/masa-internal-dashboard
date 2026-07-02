'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Currency } from '@/lib/finance/shared'

export function CurrencyToggle({
  value,
  onChange,
  className,
}: {
  value: Currency
  onChange: (value: Currency) => void
  className?: string
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        const next = values[0]
        if (next) onChange(next as Currency)
      }}
      variant="outline"
      size="sm"
      className={className}
      aria-label="Currency"
    >
      <ToggleGroupItem value="USD" aria-label="US Dollar" className="px-3">
        USD
      </ToggleGroupItem>
      <ToggleGroupItem value="IDR" aria-label="Indonesian Rupiah" className="px-3">
        IDR
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
