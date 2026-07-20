'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  type TooltipProps,
} from 'recharts'

import { ChartShell } from '@/components/charts/chart-shell'
import { DateRangePicker } from '@/components/charts/date-range-picker'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useMrrArrMonthly } from '@/hooks/use-mrr-arr-monthly'
import {
  filterMrrArrRange,
  getDefaultDateRange,
  getYearOptionsFromSeries,
  type MrrArrMonthlyPoint,
} from '@/lib/finance/mrr-arr-monthly'
import {
  formatCompactNative,
  formatFullNative,
  TODAY,
} from '@/lib/finance/shared'

const chartConfig = {
  arrIdr: { label: 'ARR — IDR contracts (USD)', color: 'var(--chart-3)' },
  arrUsd: { label: 'ARR — USD contracts', color: 'var(--chart-1)' },
} satisfies ChartConfig

type MixPoint = {
  label: string
  arrTotalUsd: number
  arrUsdPercentage: number
  arrIdrActual: number | null
  arrIdrProjected: number | null
  arrUsdActual: number | null
  arrUsdProjected: number | null
}

function buildChartPoints(
  data: Array<
    MrrArrMonthlyPoint & {
      /** `arr_usd_original` */
      arrUsd: number
      /** `arr_total_usd - arr_usd_original` */
      arrIdr: number
    }
  >,
): MixPoint[] {
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
      arrTotalUsd: d.arrTotalUsd,
      arrUsdPercentage: d.arrUsdPercentage,
      arrIdrActual: actual ? d.arrIdr : null,
      arrIdrProjected: projected ? d.arrIdr : null,
      arrUsdActual: actual ? d.arrUsd : null,
      arrUsdProjected: projected ? d.arrUsd : null,
    }
  })
}

function ArrTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  const idrVal = (payload.find((p) => p.dataKey === 'arrIdrActual')?.value ??
    payload.find((p) => p.dataKey === 'arrIdrProjected')?.value ??
    0) as number
  const usdVal = (payload.find((p) => p.dataKey === 'arrUsdActual')?.value ??
    payload.find((p) => p.dataKey === 'arrUsdProjected')?.value ??
    0) as number

  const point = payload[0]?.payload as MixPoint | undefined
  const usdPct = point?.arrUsdPercentage ?? 0

  const isProjected =
    payload.some((p) => p.dataKey === 'arrIdrProjected' && p.value != null) &&
    !payload.some((p) => p.dataKey === 'arrIdrActual' && p.value != null)

  const displayLabel = isProjected ? `${label} [Projected]` : label

  return (
    <div className="rounded-lg border border-border/60 bg-background/95 px-3 py-2.5 shadow-xl backdrop-blur-sm text-xs">
      <p className={`mb-2 font-semibold ${isProjected ? 'text-muted-foreground' : 'text-foreground'}`}>
        {displayLabel}
      </p>

      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: 'var(--chart-1)', opacity: isProjected ? 0.5 : 1 }}
        />
        <span className="text-muted-foreground flex-1">ARR — USD contracts</span>
        <span className="ml-4 font-mono font-medium tabular-nums text-foreground">
          {formatFullNative(usdVal, 'USD')}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: 'var(--chart-3)', opacity: isProjected ? 0.5 : 1 }}
        />
        <span className="text-muted-foreground flex-1">ARR — IDR contracts</span>
        <span className="ml-4 font-mono font-medium tabular-nums text-foreground">
          {formatFullNative(idrVal, 'USD')}
        </span>
      </div>

      <div className="border-t border-border/50 pt-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total ARR (USD)</span>
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {formatFullNative(idrVal + usdVal, 'USD')}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">USD contracts share</span>
          <span className="font-mono font-semibold tabular-nums text-foreground">
            {usdPct.toFixed(1)}%
          </span>
        </div>
      </div>

      {isProjected && (
        <p className="mt-2 border-t border-border/50 pt-2 text-[10px] text-muted-foreground/70 italic">
          Projected — beyond current month
        </p>
      )}
    </div>
  )
}

export function ArrCurrencyMixChart() {
  const { data: series, loading, error } = useMrrArrMonthly()
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

  const data = useMemo<MixPoint[]>(() => {
    const filtered = filterMrrArrRange(series, fromYear, fromMonth, toYear, toMonth)
    const mapped = filtered.map((point) => ({
      ...point,
      arrUsd: point.arrUsdOriginal,
      arrIdr: point.arrTotalUsd - point.arrUsdOriginal,
    }))
    return buildChartPoints(mapped)
  }, [series, fromYear, fromMonth, toYear, toMonth])

  return (
    <ChartShell
      title="ARR by Contract Currency"
      description="Stacked ARR split between USD-denominated and IDR-denominated contracts (all values in USD)"
      controls={
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
          <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
            <defs>
              <linearGradient id="fillIdrActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillUsdActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="fillIdrProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillUsdProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(v: string) => v.replace(' 20', " '")}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(v: number) => formatCompactNative(v, 'USD')}
            />

            <Tooltip
              content={<ArrTooltip />}
              cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 3' }}
            />

            <ChartLegend content={<ChartLegendContent />} />

            <Area
              dataKey="arrIdrActual"
              name="arrIdr"
              type="monotone"
              stackId="actual"
              stroke="var(--color-arrIdr)"
              strokeWidth={2}
              fill="url(#fillIdrActual)"
              connectNulls={false}
              legendType="none"
            />
            <Area
              dataKey="arrUsdActual"
              name="arrUsd"
              type="monotone"
              stackId="actual"
              stroke="var(--color-arrUsd)"
              strokeWidth={2}
              fill="url(#fillUsdActual)"
              connectNulls={false}
              legendType="none"
            />

            <Area
              dataKey="arrIdrProjected"
              name="arrIdr"
              type="monotone"
              stackId="projected"
              stroke="var(--color-arrIdr)"
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeOpacity={0.4}
              fill="url(#fillIdrProjected)"
              connectNulls={false}
              legendType="none"
            />
            <Area
              dataKey="arrUsdProjected"
              name="arrUsd"
              type="monotone"
              stackId="projected"
              stroke="var(--color-arrUsd)"
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeOpacity={0.4}
              fill="url(#fillUsdProjected)"
              connectNulls={false}
              legendType="none"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </ChartShell>
  )
}
