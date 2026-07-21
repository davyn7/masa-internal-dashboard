import type { ReactNode } from 'react'
import {
  FileSignature,
  MapPin,
  PiggyBank,
  Receipt,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import {
  CumulativeProjectFinancesChart,
  MonthlyProjectFinancesChart,
} from '@/components/customers/cumulative-project-finances-chart'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { CustomerIndividualDetail } from '@/lib/customers/individual'
import { formatCompact, formatFull, TODAY } from '@/lib/finance/shared'
import { cn } from '@/lib/utils'

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function toUtcMs(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getTime()
}

function todayIso(): string {
  // Live dashboard month (see TODAY); mid-month keeps the pin readable on the bar.
  const month = String(TODAY.month + 1).padStart(2, '0')
  return `${TODAY.year}-${month}-15`
}

function MetricCard({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string
  icon: LucideIcon
  children: ReactNode
  className?: string
}) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden border-border/60 bg-card/80 transition-colors hover:border-primary/40',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      />
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function RevenueProgress({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const remaining = Math.max(0, 100 - clamped)

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-2 min-w-0 flex-1 overflow-hidden rounded-sm bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Potential revenue fulfilled ${Math.round(clamped)} percent`}
      >
        <div className="h-full bg-primary" style={{ width: `${clamped}%` }} />
        <div
          className="h-full bg-primary/25"
          style={{ width: `${remaining}%` }}
        />
      </div>
      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
        {Math.round(clamped)}%
      </span>
    </div>
  )
}

function ContractValueBreakdown({
  tcv,
  realizedRevenue,
  receivables,
  overdueReceivables,
  remainder,
}: {
  tcv: number
  realizedRevenue: number
  receivables: number
  overdueReceivables: number
  remainder: number
}) {
  const segments = [
    {
      key: 'realized',
      label: 'Realized Revenue',
      value: realizedRevenue,
      className: 'bg-emerald-500',
      swatchClassName: 'bg-emerald-500',
    },
    {
      key: 'receivables',
      label: 'Receivables',
      value: receivables,
      className: 'bg-[var(--chart-2)]',
      swatchClassName: 'bg-[var(--chart-2)]',
    },
    {
      key: 'overdue',
      label: 'Overdue Receivables',
      value: overdueReceivables,
      className: 'bg-[#7A1F2B]',
      swatchClassName: 'bg-[#7A1F2B]',
    },
    {
      key: 'remainder',
      label: 'Remainder',
      value: remainder,
      className: 'bg-teal-500',
      swatchClassName: 'bg-teal-500',
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
          Total Contract Value
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {formatFull(tcv, 'USD')}
        </span>
      </div>

      <div
        className="flex h-3 overflow-hidden rounded-sm bg-muted"
        role="img"
        aria-label={`Contract value breakdown totaling ${formatFull(tcv, 'USD')}`}
      >
        {segments.map((segment) => {
          const widthPct = tcv > 0 ? (segment.value / tcv) * 100 : 0
          if (widthPct <= 0) return null
          return (
            <div
              key={segment.key}
              className={cn('h-full min-w-0', segment.className)}
              style={{ width: `${widthPct}%` }}
              title={`${segment.label}: ${formatFull(segment.value, 'USD')}`}
            />
          )
        })}
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {segments.map((segment) => (
          <li
            key={segment.key}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <span
                className={cn(
                  'size-2 shrink-0 rounded-sm',
                  segment.swatchClassName,
                )}
                aria-hidden="true"
              />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="shrink-0 font-mono font-medium tabular-nums text-foreground">
              {formatFull(segment.value, 'USD')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ContractTimeline({
  startDate,
  endDate,
}: {
  startDate: string
  endDate: string
}) {
  const startMs = toUtcMs(startDate)
  const endMs = toUtcMs(endDate)
  const todayMs = toUtcMs(todayIso())
  const span = Math.max(endMs - startMs, 1)
  const rawProgress = ((todayMs - startMs) / span) * 100
  const pinPct = Math.min(100, Math.max(0, rawProgress))
  const elapsedPct = Math.min(100, Math.max(0, rawProgress))
  const remainingPct = Math.max(0, 100 - elapsedPct)
  const beforeStart = todayMs < startMs
  const afterEnd = todayMs > endMs

  return (
    <div className="flex flex-col gap-2">
      <div className="relative pt-5 pb-1">
        {/* Pin */}
        <div
          className="absolute top-0 z-10 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${pinPct}%` }}
        >
          <MapPin
            className={cn(
              'size-4 fill-current drop-shadow-sm',
              beforeStart || afterEnd
                ? 'text-muted-foreground'
                : 'text-foreground',
            )}
            aria-hidden="true"
          />
          <span className="sr-only">
            Today {formatDate(todayIso())}
            {beforeStart
              ? ', before contract start'
              : afterEnd
                ? ', after contract end'
                : ''}
          </span>
        </div>

        {/* Bar */}
        <div
          className="flex h-2.5 overflow-hidden rounded-sm"
          role="img"
          aria-label={`Contract timeline from ${formatDate(startDate)} to ${formatDate(endDate)}`}
        >
          <div
            className="h-full bg-[#7A1F2B]"
            style={{ width: `${elapsedPct}%` }}
            title="Elapsed"
          />
          <div
            className="h-full bg-teal-500"
            style={{ width: `${remainingPct}%` }}
            title="Time left"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Start
          </span>
          <span className="font-medium tabular-nums text-foreground">
            {formatDate(startDate)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-sm bg-[#7A1F2B]" aria-hidden="true" />
            Elapsed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-sm bg-teal-500" aria-hidden="true" />
            Time left
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            End
          </span>
          <span className="font-medium tabular-nums text-foreground">
            {formatDate(endDate)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function CustomerFinancialMetrics({
  customer,
}: {
  customer: CustomerIndividualDetail
}) {
  const profitPositive = customer.profitability >= 0
  const revenuePct =
    customer.potentialArr > 0
      ? (customer.currentArr / customer.potentialArr) * 100
      : 0

  // Dummy placeholders until unit economics are wired from billing.
  const productionInstalled = 18
  const productionTotal = 24
  const nonProductionInstalled = 7
  const nonProductionTotal = 12
  const arrPerUnit = 42_500

  return (
    <section aria-label="Financial metrics" className="flex flex-col gap-4">
      <MetricCard label="Current Contract" icon={FileSignature}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="flex flex-col gap-4 xl:col-span-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  MRR
                </span>
                <span className="font-mono text-xl font-semibold tracking-tight tabular-nums text-foreground sm:text-2xl">
                  {formatCompact(customer.mrr, 'USD')}
                </span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  of {formatCompact(customer.potentialMrr, 'USD')} potential
                </span>
              </div>
              <div
                className="h-12 w-px self-center bg-border/50"
                aria-hidden="true"
              />
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  ARR
                </span>
                <span className="font-mono text-xl font-semibold tracking-tight tabular-nums text-foreground sm:text-2xl">
                  {formatCompact(customer.currentArr, 'USD')}
                </span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  of {formatCompact(customer.potentialArr, 'USD')} potential
                </span>
              </div>
            </div>
            <RevenueProgress pct={revenuePct} />
            <div className="flex items-baseline justify-between gap-2 border-t border-border/40 pt-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Units installed
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {productionInstalled}/{productionTotal}{' '}
                  <span className="font-sans text-xs font-normal text-muted-foreground">
                    production
                  </span>
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {nonProductionInstalled}/{nonProductionTotal}{' '}
                  <span className="font-sans text-xs font-normal text-muted-foreground">
                    non-production
                  </span>
                </span>
              </div>
              <div
                className="h-12 w-px self-center bg-border/50"
                aria-hidden="true"
              />
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  ARR per unit
                </span>
                <span className="font-mono text-xl font-semibold tracking-tight tabular-nums text-foreground sm:text-2xl">
                  {formatCompact(arrPerUnit, 'USD')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 xl:col-span-2">
            <ContractValueBreakdown
              tcv={customer.tcv}
              realizedRevenue={customer.realizedRevenue}
              receivables={customer.receivables}
              overdueReceivables={customer.overdueReceivables}
              remainder={customer.remainder}
            />
            <ContractTimeline
              startDate={customer.contractStartDate}
              endDate={customer.contractEndDate}
            />
          </div>
        </div>
      </MetricCard>

      <MetricCard label="Cumulative Project Finances" icon={TrendingUp}>
        <div className="flex flex-col gap-8">
          <CumulativeProjectFinancesChart
            data={customer.cumulativeProjectFinances}
          />

          <div className="border-t border-border/40 pt-8">
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              Monthly Project Finances
            </p>
            <MonthlyProjectFinancesChart
              data={customer.cumulativeProjectFinances}
            />
          </div>
        </div>
      </MetricCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard label="Total Expenses" icon={Receipt}>
          <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground">
            {formatFull(customer.totalExpenses, 'USD')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Operating & delivery costs (USD)
          </p>
        </MetricCard>

        <MetricCard label="Profitability" icon={PiggyBank}>
          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                'font-mono text-2xl font-semibold tracking-tight tabular-nums',
                profitPositive ? 'text-success' : 'text-destructive',
              )}
            >
              {formatFull(customer.profitability, 'USD')}
            </p>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 font-mono text-xs font-medium tabular-nums',
                profitPositive
                  ? 'bg-success/15 text-success'
                  : 'bg-destructive/15 text-destructive',
              )}
            >
              {customer.profitabilityMargin >= 0 ? '+' : ''}
              {customer.profitabilityMargin.toFixed(1)}%
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            TCV minus total expenses
          </p>
        </MetricCard>
      </div>
    </section>
  )
}

