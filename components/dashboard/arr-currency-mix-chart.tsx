'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  type TooltipProps,
} from 'recharts'

import { ChartContainer, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart'
import { filterFromStart, formatCompact, formatFull, type MonthlyRevenue } from '@/lib/revenue-data'
import { ChartShell } from './chart-shell'
import { StartDatePicker } from './start-date-picker'

const chartConfig = {
  arrIdr: { label: 'ARR — IDR contracts (USD)', color: 'var(--chart-3)' },
  arrUsd: { label: 'ARR — USD contracts', color: 'var(--chart-1)' },
} satisfies ChartConfig

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------
function ArrTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  const idrVal = (payload.find((p) => p.dataKey === 'arrIdr')?.value ?? 0) as number
  const usdVal = (payload.find((p) => p.dataKey === 'arrUsd')?.value ?? 0) as number
  const total = idrVal + usdVal
  const usdPct = total > 0 ? ((usdVal / total) * 100).toFixed(1) : '0.0'

  return (
    <div className="rounded-lg border border-border/60 bg-background/95 px-3 py-2.5 shadow-xl backdrop-blur-sm text-xs">
      <p className="mb-2 font-semibold text-foreground">{label}</p>

      {/* USD contracts row */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: 'var(--chart-1)' }}
        />
        <span className="text-muted-foreground flex-1">ARR — USD contracts</span>
        <span className="ml-4 font-mono font-medium tabular-nums text-foreground">
          {formatFull(usdVal, 'USD')}
        </span>
      </div>

      {/* IDR contracts row */}
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: 'var(--chart-3)' }}
        />
        <span className="text-muted-foreground flex-1">ARR — IDR contracts</span>
        <span className="ml-4 font-mono font-medium tabular-nums text-foreground">
          {formatFull(idrVal, 'USD')}
        </span>
      </div>

      {/* Divider + USD % */}
      <div className="border-t border-border/50 pt-2 flex items-center justify-between">
        <span className="text-muted-foreground">USD contracts share</span>
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {usdPct}%
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------
export function ArrCurrencyMixChart() {
  const [month, setMonth] = useState(0)
  const [year, setYear] = useState(2024)

  const data = useMemo<MonthlyRevenue[]>(
    () => filterFromStart(year, month),
    [year, month],
  )

  return (
    <ChartShell
      title="ARR by Contract Currency"
      description="Stacked ARR split between USD-denominated and IDR-denominated contracts (all values in USD)"
      controls={
        <StartDatePicker
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
      }
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
          <defs>
            <linearGradient id="fillIdr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillUsd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.08} />
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
            tickFormatter={(v: number) => formatCompact(v, 'USD')}
          />

          <Tooltip
            content={<ArrTooltip />}
            cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 3' }}
          />

          <ChartLegend content={<ChartLegendContent />} />

          {/* IDR layer — rendered first so it sits at the bottom of the stack */}
          <Area
            dataKey="arrIdr"
            type="monotone"
            stackId="arr"
            stroke="var(--color-arrIdr)"
            strokeWidth={2}
            fill="url(#fillIdr)"
          />

          {/* USD layer — stacked on top */}
          <Area
            dataKey="arrUsd"
            type="monotone"
            stackId="arr"
            stroke="var(--color-arrUsd)"
            strokeWidth={2}
            fill="url(#fillUsd)"
          />
        </AreaChart>
      </ChartContainer>
    </ChartShell>
  )
}
