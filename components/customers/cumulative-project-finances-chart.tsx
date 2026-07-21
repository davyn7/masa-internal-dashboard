'use client'

import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import type { CumulativeProjectFinances } from '@/lib/customers/individual'
import { formatCompact, formatFull } from '@/lib/finance/shared'

const PROFIT_FILL = 'oklch(0.74 0.16 162)' // --success
const LOSS_FILL = '#7A1F2B'
const REVENUE_STROKE = 'var(--chart-1)'
const EXPENSE_STROKE = 'var(--chart-2)'

const chartConfig = {
  revenueAndReceivables: {
    label: 'Revenue & Receivables',
    color: REVENUE_STROKE,
  },
  expenses: {
    label: 'Expenses (CAPEX + OPEX)',
    color: EXPENSE_STROKE,
  },
  profitBand: {
    label: 'Profitable',
    color: PROFIT_FILL,
  },
  lossBand: {
    label: 'Unprofitable',
    color: LOSS_FILL,
  },
} satisfies ChartConfig

type SourcePoint = {
  label: string
  isProjected: boolean
  revenueAndReceivables: number
  expenses: number
}

type ChartPoint = SourcePoint & {
  revenueActual: number | null
  revenueProjected: number | null
  expensesActual: number | null
  expensesProjected: number | null
  bandBase: number
  profitBand: number
  lossBand: number
}

function buildChartPoints(series: SourcePoint[]): ChartPoint[] {
  const lastActualIdx = series.reduce(
    (acc, d, i) => (!d.isProjected ? i : acc),
    -1,
  )

  return series.map((d, i) => {
    const isAtBoundary = i === lastActualIdx
    const actual = !d.isProjected || isAtBoundary
    const projected = d.isProjected || isAtBoundary
    const revenue = d.revenueAndReceivables
    const expenses = d.expenses
    const lower = Math.min(revenue, expenses)
    const profitable = revenue >= expenses

    return {
      ...d,
      revenueActual: actual ? revenue : null,
      revenueProjected: projected ? revenue : null,
      expensesActual: actual ? expenses : null,
      expensesProjected: projected ? expenses : null,
      bandBase: lower,
      profitBand: profitable ? revenue - expenses : 0,
      lossBand: profitable ? 0 : expenses - revenue,
    }
  })
}

function FinancesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ payload?: ChartPoint }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  const revenue = point.revenueActual ?? point.revenueProjected
  const expenses = point.expensesActual ?? point.expensesProjected
  if (revenue == null || expenses == null) return null

  const delta = revenue - expenses
  const profitable = delta >= 0
  const isProjected = point.isProjected

  return (
    <div className="rounded-lg border border-border/60 bg-background/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur-sm">
      <p
        className={`mb-2 font-semibold ${isProjected ? 'text-muted-foreground' : 'text-foreground'}`}
      >
        {isProjected ? `${label} [Projected]` : label}
      </p>
      <div className="mb-1 flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: REVENUE_STROKE }}
        />
        <span className="flex-1 text-muted-foreground">Rev. & Receivables</span>
        <span className="ml-4 font-mono font-medium tabular-nums text-foreground">
          {formatFull(revenue, 'USD')}
        </span>
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: EXPENSE_STROKE }}
        />
        <span className="flex-1 text-muted-foreground">Expenses</span>
        <span className="ml-4 font-mono font-medium tabular-nums text-foreground">
          {formatFull(expenses, 'USD')}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 border-t border-border/50 pt-2">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: profitable ? PROFIT_FILL : LOSS_FILL }}
        />
        <span className="flex-1 text-muted-foreground">
          {profitable ? 'Surplus' : 'Deficit'}
        </span>
        <span
          className={`ml-4 font-mono font-medium tabular-nums ${profitable ? 'text-success' : 'text-foreground'}`}
          style={profitable ? undefined : { color: LOSS_FILL }}
        >
          {formatFull(Math.abs(delta), 'USD')}
        </span>
      </div>
      {isProjected ? (
        <p className="mt-2 border-t border-border/50 pt-2 text-[10px] text-muted-foreground/70 italic">
          Projected — through contract end
        </p>
      ) : null}
    </div>
  )
}

const LEGEND_ITEMS = [
  {
    label: 'Revenue & Receivables',
    color: REVENUE_STROKE,
    kind: 'line' as const,
  },
  {
    label: 'Expenses (CAPEX + OPEX)',
    color: EXPENSE_STROKE,
    kind: 'line' as const,
  },
  { label: 'Profitable', color: PROFIT_FILL, kind: 'band' as const },
  { label: 'Unprofitable', color: LOSS_FILL, kind: 'band' as const },
]

function ProjectFinancesChartView({
  points,
  stats,
  statsAriaLabel,
  emptyMessage,
}: {
  points: ChartPoint[]
  stats: Array<{ label: string; value: number }>
  statsAriaLabel: string
  emptyMessage: string
}) {
  if (!points.length) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
        <aside
          aria-label={statsAriaLabel}
          className="flex flex-col justify-center gap-4 border-t border-border/40 pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {stat.label}
              </span>
              <span className="font-mono text-lg font-semibold tracking-tight tabular-nums text-foreground">
                {formatFull(stat.value, 'USD')}
              </span>
            </div>
          ))}
        </aside>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <ComposedChart data={points} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={(value: string) => value.replace(' 20', " '")}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => formatCompact(value, 'USD')}
            />
            <Tooltip
              content={<FinancesTooltip />}
              cursor={{
                stroke: 'var(--border)',
                strokeWidth: 1,
                strokeDasharray: '4 3',
              }}
            />

            <Area
              dataKey="bandBase"
              stackId="band"
              type="monotone"
              fill="transparent"
              stroke="none"
              legendType="none"
              isAnimationActive={false}
              activeDot={false}
            />
            <Area
              dataKey="profitBand"
              stackId="band"
              type="monotone"
              fill={PROFIT_FILL}
              fillOpacity={0.28}
              stroke="none"
              legendType="none"
              isAnimationActive={false}
              activeDot={false}
            />
            <Area
              dataKey="lossBand"
              stackId="band"
              type="monotone"
              fill={LOSS_FILL}
              fillOpacity={0.32}
              stroke="none"
              legendType="none"
              isAnimationActive={false}
              activeDot={false}
            />

            <Line
              dataKey="revenueActual"
              type="monotone"
              stroke={REVENUE_STROKE}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              legendType="none"
            />
            <Line
              dataKey="revenueProjected"
              type="monotone"
              stroke={REVENUE_STROKE}
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeOpacity={0.45}
              dot={false}
              activeDot={{ r: 4, fillOpacity: 0.45 }}
              connectNulls={false}
              legendType="none"
            />

            <Line
              dataKey="expensesActual"
              type="monotone"
              stroke={EXPENSE_STROKE}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              legendType="none"
            />
            <Line
              dataKey="expensesProjected"
              type="monotone"
              stroke={EXPENSE_STROKE}
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeOpacity={0.45}
              dot={false}
              activeDot={{ r: 4, fillOpacity: 0.45 }}
              connectNulls={false}
              legendType="none"
            />
          </ComposedChart>
        </ChartContainer>

        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          {LEGEND_ITEMS.map((item) => (
            <li key={item.label} className="inline-flex items-center gap-1.5">
              {item.kind === 'line' ? (
                <span
                  className="h-0.5 w-3.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
              ) : (
                <span
                  className="size-2.5 shrink-0 rounded-[2px] opacity-70"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
              )}
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <aside
        aria-label={statsAriaLabel}
        className="flex flex-col justify-center gap-4 border-t border-border/40 pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {stat.label}
            </span>
            <span className="font-mono text-lg font-semibold tracking-tight tabular-nums text-foreground">
              {formatFull(stat.value, 'USD')}
            </span>
          </div>
        ))}
      </aside>
    </div>
  )
}

export function CumulativeProjectFinancesChart({
  data,
}: {
  data: CumulativeProjectFinances
}) {
  const points = useMemo(
    () =>
      buildChartPoints(
        data.series.map((point) => ({
          label: point.label,
          isProjected: point.isProjected,
          revenueAndReceivables: point.cumulativeRevenueAndReceivables,
          expenses: point.cumulativeExpenses,
        })),
      ),
    [data.series],
  )

  return (
    <ProjectFinancesChartView
      points={points}
      stats={[
        { label: 'Cumulative Revenue', value: data.cumulativeRevenue },
        { label: 'Cumulative Receivables', value: data.cumulativeReceivables },
        { label: 'Cumulative CAPEX', value: data.cumulativeCapex },
        { label: 'Cumulative OPEX', value: data.cumulativeOpex },
      ]}
      statsAriaLabel="Cumulative project finance totals"
      emptyMessage="No contract timeline available"
    />
  )
}

export function MonthlyProjectFinancesChart({
  data,
}: {
  data: CumulativeProjectFinances
}) {
  const points = useMemo(
    () =>
      buildChartPoints(
        data.monthlySeries.map((point) => ({
          label: point.label,
          isProjected: point.isProjected,
          revenueAndReceivables: point.revenueAndReceivables,
          expenses: point.expenses,
        })),
      ),
    [data.monthlySeries],
  )

  return (
    <ProjectFinancesChartView
      points={points}
      stats={[
        { label: 'Monthly Revenue', value: data.monthlyRevenue },
        { label: 'Monthly Receivables', value: data.monthlyReceivables },
        { label: 'Monthly CAPEX', value: data.monthlyCapex },
        { label: 'Monthly OPEX', value: data.monthlyOpex },
      ]}
      statsAriaLabel="Monthly project finance totals"
      emptyMessage="No monthly finance data available"
    />
  )
}
