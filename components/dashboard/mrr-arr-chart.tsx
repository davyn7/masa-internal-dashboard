'use client'

import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'

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
  filterFromStart,
  formatCompact,
  formatFull,
} from '@/lib/revenue-data'
import { ChartShell } from './chart-shell'
import { CurrencyToggle } from './currency-toggle'
import { StartDatePicker } from './start-date-picker'

const chartConfig = {
  mrr: { label: 'MRR', color: 'var(--chart-1)' },
  arr: { label: 'ARR', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function MrrArrChart() {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [month, setMonth] = useState(0)
  const [year, setYear] = useState(2024)

  const data = useMemo(() => filterFromStart(year, month), [year, month])

  return (
    <ChartShell
      title="MRR & ARR Trend"
      description="Monthly recurring vs. annualized run rate"
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
          <Line
            yAxisId="mrr"
            dataKey="mrr"
            type="monotone"
            stroke="var(--color-mrr)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="arr"
            dataKey="arr"
            type="monotone"
            stroke="var(--color-arr)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ChartContainer>
    </ChartShell>
  )
}
