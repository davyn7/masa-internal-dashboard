'use client'

import { useMemo, useState } from 'react'
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
import { filterRange } from '@/lib/finance/mrr-arr'
import {
  type Currency,
  type MonthlyRevenue,
  formatCompact,
  formatFull,
  TODAY,
} from '@/lib/finance/shared'

const chartConfig = {
  mrr: { label: 'MRR', color: 'var(--chart-1)' },
  arr: { label: 'ARR', color: 'var(--chart-2)' },
} satisfies ChartConfig

// ---------------------------------------------------------------------------
// Types for the split actual / projected data points
// ---------------------------------------------------------------------------
type ChartPoint = MonthlyRevenue & {
  mrrActual: number | null
  mrrProjected: number | null
  arrActual: number | null
  arrProjected: number | null
}

function buildChartPoints(data: MonthlyRevenue[]): ChartPoint[] {
  // Find the index of the last actual point so we can create a one-point
  // overlap at the boundary (keeps the projected line visually connected).
  const lastActualIdx = data.reduce(
    (acc, d, i) => (!d.isProjected ? i : acc),
    -1,
  )

  return data.map((d, i) => {
    const isAtBoundary = i === lastActualIdx
    const actual = !d.isProjected || isAtBoundary
    const projected = d.isProjected || isAtBoundary

    return {
      ...d,
      mrrActual: actual ? d.mrr : null,
      mrrProjected: projected ? d.mrr : null,
      arrActual: actual ? d.arr : null,
      arrProjected: projected ? d.arr : null,
    }
  })
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------
function MrrArrTooltip({
  active,
  payload,
  label,
  currency,
}: TooltipProps<number, string> & { currency: Currency }) {
  if (!active || !payload?.length) return null

  // Prefer actual values; fall back to projected
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
            {formatFull(mrrVal, currency)}
          </span>
        </div>
      )}
      {arrVal != null && (
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: 'var(--chart-2)' }} />
          <span className="text-muted-foreground flex-1">ARR</span>
          <span className="ml-4 font-mono font-medium tabular-nums text-foreground">
            {formatFull(arrVal, currency)}
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

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------
export function MrrArrChart() {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [fromMonth, setFromMonth] = useState(0)
  const [fromYear, setFromYear] = useState(2024)
  const [toMonth, setToMonth] = useState(TODAY.month)
  const [toYear, setToYear] = useState(TODAY.year + 1) // show a bit of projection by default

  const data = useMemo<ChartPoint[]>(
    () => buildChartPoints(filterRange(fromYear, fromMonth, toYear, toMonth)),
    [fromYear, fromMonth, toYear, toMonth],
  )

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
          />
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>
      }
    >
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
            tickFormatter={(value: number) => formatCompact(value, currency)}
          />
          <YAxis
            yAxisId="arr"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => formatCompact(value, currency)}
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

          {/* ---- MRR actual (solid) ---- */}
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
          {/* ---- MRR projected (muted + dashed) ---- */}
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

          {/* ---- ARR actual (solid) ---- */}
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
          {/* ---- ARR projected (muted + dashed + more opacity reduction) ---- */}
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
    </ChartShell>
  )
}
