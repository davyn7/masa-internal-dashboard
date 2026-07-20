'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  type TooltipProps,
  Tooltip,
} from 'recharts'

import { ChartShell } from '@/components/charts/chart-shell'
import { CurrencyToggle } from '@/components/charts/currency-toggle'
import { DateRangePicker } from '@/components/charts/date-range-picker'
import { ChartContainer, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart'
import { useMrrArrMonthly } from '@/hooks/use-mrr-arr-monthly'
import {
  filterMrrArrRange,
  getDefaultDateRange,
  getYearOptionsFromSeries,
  type MrrArrMonthlyPoint,
} from '@/lib/finance/mrr-arr-monthly'
import {
  type Currency,
  formatCompactNative,
  formatFullNative,
  TODAY,
} from '@/lib/finance/shared'

const chartConfig = {
  mrr: { label: 'MRR', color: 'var(--chart-1)' },
  arr: { label: 'ARR', color: 'var(--chart-2)' },
} satisfies ChartConfig

type TrendPoint = {
  label: string
  mrrActual: number | null
  mrrProjected: number | null
  arrActual: number | null
  arrProjected: number | null
}

function buildChartPoints(data: Array<MrrArrMonthlyPoint & { mrr: number; arr: number }>): TrendPoint[] {
  const lastActualIdx = data.reduce(
    (acc, d, i) => (!d.isProjected ? i : acc),
    -1,
  )

  return data.map((d, i) => {
    const isAtBoundary = i === lastActualIdx
    const actual = !d.isProjected || isAtBoundary
    const projected = d.isProjected || isAtBoundary

    return {
      label: d.label,
      mrrActual: actual ? d.mrr : null,
      mrrProjected: projected ? d.mrr : null,
      arrActual: actual ? d.arr : null,
      arrProjected: projected ? d.arr : null,
    }
  })
}

function MrrArrTooltip({
  active,
  payload,
  label,
  currency,
}: TooltipProps<number, string> & { currency: Currency }) {
  if (!active || !payload?.length) return null

  const mrrVal =
    (payload.find((p) => p.dataKey === 'mrrActual')?.value ??
      payload.find((p) => p.dataKey === 'mrrProjected')?.value ??
      null) as number | null
  const arrVal =
    (payload.find((p) => p.dataKey === 'arrActual')?.value ??
      payload.find((p) => p.dataKey === 'arrProjected')?.value ??
      null) as number | null

  const isProjected = payload.some(
    (p) => p.dataKey === 'mrrProjected' && p.value != null,
  ) && !payload.some((p) => p.dataKey === 'mrrActual' && p.value != null)

  const displayLabel = isProjected ? `${label} [Projected]` : label

  return (
    <div className="rounded-lg border border-border/60 bg-background/95 px-3 py-2.5 shadow-xl backdrop-blur-sm text-xs">
      <p className={`mb-2 font-semibold ${isProjected ? 'text-muted-foreground' : 'text-foreground'}`}>
        {displayLabel}
      </p>
      {mrrVal != null && (
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: 'var(--chart-1)' }} />
          <span className="text-muted-foreground flex-1">MRR</span>
          <span className="ml-4 font-mono font-medium tabular-nums text-foreground">
            {formatFullNative(mrrVal, currency)}
          </span>
        </div>
      )}
      {arrVal != null && (
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: 'var(--chart-2)' }} />
          <span className="text-muted-foreground flex-1">ARR</span>
          <span className="ml-4 font-mono font-medium tabular-nums text-foreground">
            {formatFullNative(arrVal, currency)}
          </span>
        </div>
      )}
      {isProjected && (
        <p className="mt-2 border-t border-border/50 pt-2 text-[10px] text-muted-foreground/70 italic">
          Projected — beyond current month
        </p>
      )}
    </div>
  )
}

export function MrrArrChart() {
  const { data: series, loading, error } = useMrrArrMonthly()
  const [currency, setCurrency] = useState<Currency>('USD')
  const [fromMonth, setFromMonth] = useState(0)
  const [fromYear, setFromYear] = useState(2024)
  const [toMonth, setToMonth] = useState(TODAY.month)
  const [toYear, setToYear] = useState(TODAY.year)
  const [rangeInitialized, setRangeInitialized] = useState(false)

  useEffect(() => {
    if (!series.length || rangeInitialized) return
    const defaults = getDefaultDateRange(series)
    setFromYear(defaults.fromYear)
    setFromMonth(defaults.fromMonth)
    setToYear(defaults.toYear)
    setToMonth(defaults.toMonth)
    setRangeInitialized(true)
  }, [series, rangeInitialized])

  const yearOptions = useMemo(() => getYearOptionsFromSeries(series), [series])

  const data = useMemo<TrendPoint[]>(() => {
    const filtered = filterMrrArrRange(series, fromYear, fromMonth, toYear, toMonth)
    const mapped = filtered.map((point) => ({
      ...point,
      mrr: currency === 'USD' ? point.mrrTotalUsd : point.mrrTotalIdr,
      arr: currency === 'USD' ? point.arrTotalUsd : point.arrTotalIdr,
    }))
    return buildChartPoints(mapped)
  }, [series, fromYear, fromMonth, toYear, toMonth, currency])

  return (
    <ChartShell
      title="MRR & ARR Trend"
      description="Monthly recurring vs. annualized run rate"
      controls={
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            fromMonth={fromMonth}
            fromYear={fromYear}
            toMonth={toMonth}
            toYear={toYear}
            onFromMonthChange={setFromMonth}
            onFromYearChange={setFromYear}
            onToMonthChange={setToMonth}
            onToYearChange={setToYear}
            yearOptions={yearOptions}
          />
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>
      }
    >
      {loading ? (
        <p className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          Loading chart data…
        </p>
      ) : error ? (
        <p className="flex h-[300px] items-center justify-center text-sm text-destructive">
          {error}
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value: string) => value.replace(' 20', " '")}
            />
            <YAxis
              yAxisId="mrr"
              orientation="left"
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => formatCompactNative(value, currency)}
            />
            <YAxis
              yAxisId="arr"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => formatCompactNative(value, currency)}
            />
            <Tooltip
              content={<MrrArrTooltip currency={currency} />}
              cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 3' }}
            />
            <ChartLegend
              content={<ChartLegendContent />}
              payload={[
                { value: 'MRR', type: 'line', color: 'var(--chart-1)' },
                { value: 'ARR', type: 'line', color: 'var(--chart-2)' },
              ]}
            />

            <Line
              yAxisId="mrr"
              dataKey="mrrActual"
              name="mrr"
              type="monotone"
              stroke="var(--color-mrr)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              legendType="none"
            />
            <Line
              yAxisId="mrr"
              dataKey="mrrProjected"
              name="mrr"
              type="monotone"
              stroke="var(--color-mrr)"
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeOpacity={0.4}
              dot={false}
              activeDot={{ r: 4, fillOpacity: 0.4 }}
              connectNulls={false}
              legendType="none"
            />

            <Line
              yAxisId="arr"
              dataKey="arrActual"
              name="arr"
              type="monotone"
              stroke="var(--color-arr)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              legendType="none"
            />
            <Line
              yAxisId="arr"
              dataKey="arrProjected"
              name="arr"
              type="monotone"
              stroke="var(--color-arr)"
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeOpacity={0.35}
              dot={false}
              activeDot={{ r: 4, fillOpacity: 0.35 }}
              connectNulls={false}
              legendType="none"
            />
          </LineChart>
        </ChartContainer>
      )}
    </ChartShell>
  )
}
