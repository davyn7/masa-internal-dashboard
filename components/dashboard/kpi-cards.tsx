'use client'

import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  TrendingUp,
  Users,
  Truck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  type Currency,
  formatCompact,
  getCurrentKpis,
} from '@/lib/revenue-data'
import { CurrencyToggle } from './currency-toggle'

const kpis = getCurrentKpis()

type KpiDef = {
  label: string
  icon: LucideIcon
  value: number
  change: number
  caption: string
}

function buildKpiDefs(): KpiDef[] {
  return [
    {
      label: 'Current MRR',
      icon: CircleDollarSign,
      value: kpis.mrr.value,
      change: kpis.mrr.change,
      caption: 'Monthly recurring revenue',
    },
    {
      label: 'Current ARR',
      icon: TrendingUp,
      value: kpis.arr.value,
      change: kpis.arr.change,
      caption: 'Annualized run rate',
    },
    {
      label: 'MRR per Client',
      icon: Users,
      value: kpis.revenuePerClient.value,
      change: kpis.revenuePerClient.change,
      caption: 'Across 26 active clients',
    },
    {
      label: 'MRR per Unit',
      icon: Truck,
      value: kpis.revenuePerUnit.value,
      change: kpis.revenuePerUnit.change,
      caption: 'Across 512 monitored units',
    },
  ]
}

function ChangeBadge({ change }: { change: number }) {
  const positive = change >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-medium tabular-nums',
        positive
          ? 'bg-success/15 text-success'
          : 'bg-destructive/15 text-destructive',
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {positive ? '+' : ''}
      {change.toFixed(1)}%
    </span>
  )
}

function KpiCard({ def, currency }: { def: KpiDef; currency: Currency }) {
  const Icon = def.icon
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/80 transition-colors hover:border-primary/40">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      />
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <span className="text-sm font-medium text-muted-foreground">
          {def.label}
        </span>
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {formatCompact(def.value, currency)}
        </div>
        <div className="flex items-center gap-2">
          <ChangeBadge change={def.change} />
          <span className="text-xs text-muted-foreground">vs prev. period</span>
        </div>
        <p className="text-xs text-muted-foreground/80">{def.caption}</p>
      </CardContent>
    </Card>
  )
}

export function KpiCards() {
  const [currency, setCurrency] = useState<Currency>('USD')
  const defs = buildKpiDefs()

  return (
    <section aria-label="Key revenue metrics" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Revenue Overview
        </h2>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {defs.map((def) => (
          <KpiCard key={def.label} def={def} currency={currency} />
        ))}
      </div>
    </section>
  )
}
