'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  type LabelProps,
} from 'recharts'

import { BreakdownToggle } from '@/components/charts/breakdown-toggle'
import { ChartShell } from '@/components/charts/chart-shell'
import { CurrencyToggle } from '@/components/charts/currency-toggle'
import { DateRangePicker } from '@/components/charts/date-range-picker'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import {
  buildMonthlyBreakdown,
  flattenBreakdownForChart,
  getBreakdownEntities,
  getDrilldown,
  getTotalBreakdown,
  type BreakdownEntity,
  type BreakdownView,
  type ChartBreakdownRow,
  type MonthlyBreakdownPoint,
} from '@/lib/finance/arr-breakdown'
import { filterRange } from '@/lib/finance/mrr-arr'
import {
  type Currency,
  formatCompact,
  TODAY,
} from '@/lib/finance/shared'

type HoverState = {
  type: 'segment' | 'total'
  monthKey: string
  segmentId?: string
  x: number
  y: number
}

function buildChartConfig(view: BreakdownView): ChartConfig {
  return Object.fromEntries(
    getBreakdownEntities(view).map((entity) => [
      entity.id,
      { label: entity.label, color: entity.color },
    ]),
  )
}

function BreakdownTooltipPanel({
  title,
  subtitle,
  rows,
  currency,
  projected,
}: {
  title: string
  subtitle?: string
  rows: Array<{ id: string; label: string; subtitle?: string; mrr: number; arr: number }>
  currency: Currency
  projected?: boolean
}) {
  return (
    <div className="w-56 rounded-md bg-foreground px-3 py-2 text-background shadow-lg">
      <p className="text-xs font-semibold">
        {title}
        {projected ? (
          <span className="ml-1 font-normal text-background/70">[Projected]</span>
        ) : null}
      </p>
      {subtitle ? (
        <p className="text-[10px] text-background/70">{subtitle}</p>
      ) : null}
      <div className="mt-2 max-h-52 overflow-y-auto overscroll-contain pr-1">
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-2 border-t border-background/15 pt-1.5 first:border-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px]">{row.label}</p>
                {row.subtitle ? (
                  <p className="truncate text-[10px] text-background/60">
                    {row.subtitle}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right font-mono text-[10px] tabular-nums">
                <div>{formatCompact(row.mrr, currency)} MRR</div>
                <div className="text-background/70">
                  {formatCompact(row.arr, currency)} ARR
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TotalLabel({
  x,
  y,
  width,
  value,
  index,
  currency,
  rows,
  onHover,
  onMove,
  onLeave,
}: LabelProps & {
  currency: Currency
  rows: ChartBreakdownRow[]
  onHover: (key: string, x: number, y: number) => void
  onMove: (key: string, x: number, y: number) => void
  onLeave: () => void
}) {
  if (
    x == null ||
    y == null ||
    width == null ||
    value == null ||
    index == null
  ) {
    return null
  }

  const point = rows[index]
  if (!point) return null

  const labelX = Number(x) + Number(width) / 2
  const labelY = Number(y) - 8

  return (
    <text
      x={labelX}
      y={labelY}
      textAnchor="middle"
      className="fill-foreground text-[11px] font-semibold"
      onMouseEnter={(event) => onHover(point.key, event.clientX, event.clientY)}
      onMouseMove={(event) => onMove(point.key, event.clientX, event.clientY)}
      onMouseLeave={onLeave}
    >
      {formatCompact(Number(value), currency)}
    </text>
  )
}

function BreakdownLegend({ entities }: { entities: BreakdownEntity[] }) {
  return (
    <div className="mt-2 max-h-28 overflow-y-auto border-t border-border/50 pt-3">
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 px-1">
        {entities.map((entity) => (
          <div
            key={entity.id}
            className="flex min-w-0 max-w-full items-center gap-1.5"
          >
            <span
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: entity.color }}
              aria-hidden="true"
            />
            <span className="truncate text-[11px] text-muted-foreground">
              {entity.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ArrBreakdownChart() {
  const [view, setView] = useState<BreakdownView>('client')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [fromMonth, setFromMonth] = useState(0)
  const [fromYear, setFromYear] = useState(2024)
  const [toMonth, setToMonth] = useState(TODAY.month)
  const [toYear, setToYear] = useState(TODAY.year + 1)
  const [hover, setHover] = useState<HoverState | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filteredMonths = useMemo(
    () => filterRange(fromYear, fromMonth, toYear, toMonth),
    [fromYear, fromMonth, toYear, toMonth],
  )

  const breakdownPoints = useMemo(
    () => buildMonthlyBreakdown(view, filteredMonths),
    [view, filteredMonths],
  )

  const data = useMemo(
    () => flattenBreakdownForChart(breakdownPoints),
    [breakdownPoints],
  )

  const entities = useMemo(() => getBreakdownEntities(view), [view])
  const chartConfig = useMemo(() => buildChartConfig(view), [view])

  const cancelHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const clearHover = useCallback(() => {
    cancelHide()
    setHover(null)
  }, [cancelHide])

  const scheduleHide = useCallback(() => {
    cancelHide()
    hideTimeoutRef.current = setTimeout(() => {
      setHover(null)
      hideTimeoutRef.current = null
    }, 120)
  }, [cancelHide])

  const showTotalHover = useCallback((key: string, x: number, y: number) => {
    cancelHide()
    setHover({ type: 'total', monthKey: key, x, y })
  }, [cancelHide])

  const moveTotalHover = useCallback((key: string, x: number, y: number) => {
    setHover((prev) =>
      prev?.type === 'total' && prev.monthKey === key
        ? { ...prev, x, y }
        : { type: 'total', monthKey: key, x, y },
    )
  }, [])

  const showSegmentHover = useCallback(
    (monthKey: string, segmentId: string, x: number, y: number) => {
      cancelHide()
      setHover({ type: 'segment', monthKey, segmentId, x, y })
    },
    [cancelHide],
  )

  const moveSegmentHover = useCallback((x: number, y: number) => {
    setHover((prev) => (prev ? { ...prev, x, y } : null))
  }, [])

  useEffect(() => {
    clearHover()
    return () => cancelHide()
  }, [view, clearHover, cancelHide])

  const hoveredMonth = hover
    ? breakdownPoints.find((point) => point.key === hover.monthKey)
    : null

  const tooltipContent = useMemo(() => {
    if (!hover || !hoveredMonth) return null

    if (hover.type === 'total') {
      return {
        title: hoveredMonth.label,
        subtitle: 'Total ARR',
        rows: getTotalBreakdown(view, hoveredMonth),
        projected: hoveredMonth.isProjected,
      }
    }

    const drilldown = getDrilldown(view, hover.segmentId ?? '', hoveredMonth)
    return {
      title: drilldown.title,
      subtitle: drilldown.subtitle,
      rows: drilldown.rows,
      projected: hoveredMonth.isProjected,
    }
  }, [hover, hoveredMonth, view])

  return (
    <ChartShell
      title="ARR Breakdown"
      description="Stacked ARR by client or site per month"
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
          <BreakdownToggle value={view} onChange={setView} />
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>
      }
    >
      <div className="relative">
        <ChartContainer key={view} config={chartConfig} className="h-[360px] w-full">
          <BarChart
            key={view}
            data={data}
            margin={{ left: 4, right: 4, top: 28 }}
            onMouseLeave={scheduleHide}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              tickFormatter={(value: string) => value.replace(' 20', " '")}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => formatCompact(value, currency)}
            />
            {entities.map((entity, entityIndex) => (
              <Bar
                key={`${view}-${entity.id}`}
                dataKey={entity.id}
                name={entity.label}
                stackId="arr"
                fill={entity.color}
                maxBarSize={48}
                radius={
                  entityIndex === entities.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
                }
                onMouseEnter={(row, _index, event) => {
                  const point = row as ChartBreakdownRow
                  showSegmentHover(
                    point.key,
                    entity.id,
                    event.clientX,
                    event.clientY,
                  )
                }}
                onMouseMove={(_row, _index, event) => {
                  moveSegmentHover(event.clientX, event.clientY)
                }}
              >
                {data.map((entry) => (
                  <Cell
                    key={`${entity.id}-${entry.key}`}
                    fill={entity.color}
                    fillOpacity={entry.isProjected ? 0.6 : 1}
                  />
                ))}
                {entityIndex === entities.length - 1 ? (
                  <LabelList
                    dataKey="totalArr"
                    content={(props) => (
                      <TotalLabel
                        {...props}
                        currency={currency}
                        rows={data}
                        onHover={showTotalHover}
                        onMove={moveTotalHover}
                        onLeave={scheduleHide}
                      />
                    )}
                  />
                ) : null}
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>

        {hover && tooltipContent ? (
          <div
            className="pointer-events-auto fixed z-50"
            style={{ left: hover.x + 12, top: hover.y + 12 }}
            role="tooltip"
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
          >
            <BreakdownTooltipPanel
              title={tooltipContent.title}
              subtitle={tooltipContent.subtitle}
              rows={tooltipContent.rows}
              currency={currency}
              projected={tooltipContent.projected}
            />
          </div>
        ) : null}
      </div>
      <BreakdownLegend entities={entities} />
    </ChartShell>
  )
}
