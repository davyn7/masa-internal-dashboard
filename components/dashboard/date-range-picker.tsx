'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MONTH_OPTIONS, YEAR_OPTIONS } from '@/lib/revenue-data'

interface DateRangePickerProps {
  fromMonth: number
  fromYear: number
  toMonth: number
  toYear: number
  onFromMonthChange: (v: number) => void
  onFromYearChange: (v: number) => void
  onToMonthChange: (v: number) => void
  onToYearChange: (v: number) => void
}

export function DateRangePicker({
  fromMonth,
  fromYear,
  toMonth,
  toYear,
  onFromMonthChange,
  onFromYearChange,
  onToMonthChange,
  onToYearChange,
}: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* From */}
      <span className="text-xs font-medium text-muted-foreground">From</span>
      <Select
        value={String(fromMonth)}
        onValueChange={(v) => onFromMonthChange(Number(v))}
      >
        <SelectTrigger size="sm" className="w-[88px]" aria-label="From month">
          <SelectValue placeholder="Month">
            {MONTH_OPTIONS[fromMonth]?.label}
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
        value={String(fromYear)}
        onValueChange={(v) => onFromYearChange(Number(v))}
      >
        <SelectTrigger size="sm" className="w-[84px]" aria-label="From year">
          <SelectValue placeholder="Year">{fromYear}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {YEAR_OPTIONS.map((y) => (
            <SelectItem key={y.value} value={String(y.value)}>
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* To */}
      <span className="text-xs font-medium text-muted-foreground">To</span>
      <Select
        value={String(toMonth)}
        onValueChange={(v) => onToMonthChange(Number(v))}
      >
        <SelectTrigger size="sm" className="w-[88px]" aria-label="To month">
          <SelectValue placeholder="Month">
            {MONTH_OPTIONS[toMonth]?.label}
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
        value={String(toYear)}
        onValueChange={(v) => onToYearChange(Number(v))}
      >
        <SelectTrigger size="sm" className="w-[84px]" aria-label="To year">
          <SelectValue placeholder="Year">{toYear}</SelectValue>
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
