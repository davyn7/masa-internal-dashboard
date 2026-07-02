'use client'

import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
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

type KpiDualDef = {
  label: string
  icon: LucideIcon
  mrr: number
  arr: number
  change: number
  caption: string
}

function buildKpiDefs(): KpiDualDef[] {
  return [
    {
      label: 'Current MRR & ARR',
      icon: CircleDollarSign,
      mrr: kpis.mrr.value,
      arr: kpis.arr.value,
      change: kpis.mrr.change,
      caption: 'Monthly & annualized recurring revenue',
    },
    {
      label: 'MRR & ARR per Client',
      icon: Users,
      mrr: kpis.perClient.mrr,
      arr: kpis.perClient.arr,
      change: kpis.perClient.change,
      caption: `Across 26 active clients`,
    },
    {
      label: 'MRR & ARR per Unit',
      icon: Truck,
      mrr: kpis.perUnit.mrr,
      arr: kpis.perUnit.arr,
      change: kpis.perUnit.change,
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

function DualKpiCard({
  def,
  currency,
}: {
  def: KpiDualDef
  currency: Currency
}) {
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
      <CardContent className="flex flex-col gap-3">
        {/* MRR row */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              MRR
            </span>
            <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatCompact(def.mrr, currency)}
            </span>
          </div>
          {/* Divider */}
          <div className="h-10 w-px self-center bg-border/50" aria-hidden="true" />
          {/* ARR row */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              ARR
            </span>
            <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatCompact(def.arr, currency)}
            </span>
          </div>
        </div>
        {/* Shared change badge */}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {defs.map((def) => (
          <DualKpiCard key={def.label} def={def} currency={currency} />
        ))}
      </div>
    </section>
  )
}
