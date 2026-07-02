'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartShell } from '@/components/charts/chart-shell'
import { CurrencyToggle } from '@/components/charts/currency-toggle'
import { StartDatePicker } from '@/components/charts/start-date-picker'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  type Currency,
  formatCompact,
  formatFull,
} from '@/lib/finance/shared'
import { filterFromStart } from '@/lib/finance/unit-economics'

const chartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
  receivables: { label: 'Receivables', color: 'var(--chart-5)' },
} satisfies ChartConfig

export function RevenueReceivablesChart() {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [month, setMonth] = useState(0)
  const [year, setYear] = useState(2026)

  const data = useMemo(
    () =>
      filterFromStart(year, month).map((d) => ({
        ...d,
        total: d.revenue + d.receivables,
      })),
    [year, month],
  )

  return (
    <ChartShell
      title="Revenue & Receivables"
      description="Billed revenue and outstanding receivables per month"
      controls={
        <>
          <StartDatePicker
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </>
      }
    >
      <ChartContainer config={chartConfig} className="h-[320px] w-full">
        <BarChart data={data} margin={{ left: 4, right: 4, top: 28 }}>
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
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {chartConfig[name as keyof typeof chartConfig]?.label}
                    </span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {formatFull(value as number, currency)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="revenue"
            stackId="rev"
            fill="var(--color-revenue)"
            radius={[0, 0, 4, 4]}
            maxBarSize={48}
          >
            <LabelList
              dataKey="revenue"
              position="center"
              className="fill-background"
              fontSize={10}
              formatter={(value: number) => formatCompact(value, currency)}
            />
          </Bar>
          <Bar
            dataKey="receivables"
            stackId="rev"
            fill="var(--color-receivables)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          >
            <LabelList
              dataKey="receivables"
              position="center"
              className="fill-background"
              fontSize={10}
              formatter={(value: number) => formatCompact(value, currency)}
            />
            <LabelList
              dataKey="total"
              position="top"
              className="fill-foreground"
              fontSize={11}
              fontWeight={600}
              offset={8}
              formatter={(value: number) => formatCompact(value, currency)}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartShell>
  )
}
