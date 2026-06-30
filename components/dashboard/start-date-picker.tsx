'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MONTH_OPTIONS, YEAR_OPTIONS } from '@/lib/revenue-data'

export function StartDatePicker({
  month,
  year,
  onMonthChange,
  onYearChange,
}: {
  month: number
  year: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">From</span>
      <Select
        value={String(month)}
        onValueChange={(v) => onMonthChange(Number(v))}
      >
        <SelectTrigger size="sm" className="w-[88px]" aria-label="Start month">
          <SelectValue placeholder="Month">
            {MONTH_OPTIONS[month]?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MONTH_OPTIONS.map((m) => (
            <SelectItem key={m.value} value={String(m.value)}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={String(year)}
        onValueChange={(v) => onYearChange(Number(v))}
      >
        <SelectTrigger size="sm" className="w-[84px]" aria-label="Start year">
          <SelectValue placeholder="Year">{year}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {YEAR_OPTIONS.map((y) => (
            <SelectItem key={y.value} value={String(y.value)}>
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
