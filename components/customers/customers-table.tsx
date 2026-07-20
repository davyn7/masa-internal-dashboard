'use client'

import { useMemo, useState } from 'react'

import { MineralBadge } from '@/components/customers/mineral-badge'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Mineral } from '@/lib/finance/client-matrix'
import { formatCompact } from '@/lib/finance/shared'
import {
  CUSTOMER_STATUSES,
  type CustomerOverviewRow,
  type CustomerStatus,
} from '@/lib/customers/sites'
import { cn } from '@/lib/utils'

const ALL = 'all'

const STATUS_STYLES: Record<CustomerStatus, string> = {
  Pitch: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  Trial: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Commercial: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Churned: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

function StatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span
      className={cn(
        'rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  )
}

function ArrProgress({
  currentArr,
  potentialArr,
}: {
  currentArr: number
  potentialArr: number
}) {
  const pct =
    potentialArr > 0 ? Math.min(100, (currentArr / potentialArr) * 100) : 0
  const remainingPct = Math.max(0, 100 - pct)
  const currentLabel = formatCompact(currentArr, 'USD')
  const potentialLabel = formatCompact(potentialArr, 'USD')

  return (
    <div className="flex min-w-[200px] items-center gap-3">
      <div
        className="flex h-2 w-28 shrink-0 overflow-hidden rounded-sm bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`ARR ${currentLabel} of ${potentialLabel}`}
      >
        <div
          className="h-full bg-primary"
          style={{ width: `${pct}%` }}
          title={`Current ${currentLabel}`}
        />
        <div
          className="h-full bg-primary/25"
          style={{ width: `${remainingPct}%` }}
          title={`Potential ${potentialLabel}`}
        />
      </div>
      <div className="text-xs tabular-nums text-muted-foreground">
        <span className="font-medium text-foreground">{currentLabel}</span>
        <span className="mx-1">/</span>
        <span>{potentialLabel}</span>
        <span className="ml-1.5 text-foreground">({Math.round(pct)}%)</span>
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  allLabel: string
}) {
  const selectedLabel =
    value === ALL
      ? allLabel
      : (options.find((o) => o.value === value)?.label ?? allLabel)

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v ?? ALL)}>
        <SelectTrigger size="sm" className="w-[140px]" aria-label={label}>
          <SelectValue placeholder={allLabel}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function CustomersTable({
  customers,
}: {
  customers: CustomerOverviewRow[]
}) {
  const [siteFilter, setSiteFilter] = useState(ALL)
  const [materialFilter, setMaterialFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState(ALL)

  const siteOptions = useMemo(() => {
    const names = new Map<string, string>()
    for (const row of customers) {
      names.set(row.siteId, row.siteName)
    }
    return Array.from(names.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [customers])

  const materialOptions = useMemo(() => {
    const minerals = new Set<Mineral>()
    for (const row of customers) minerals.add(row.mineral)
    return Array.from(minerals)
      .sort()
      .map((mineral) => ({ value: mineral, label: mineral }))
  }, [customers])

  const statusOptions = CUSTOMER_STATUSES.map((status) => ({
    value: status,
    label: status,
  }))

  const filtered = useMemo(() => {
    return customers.filter((row) => {
      if (siteFilter !== ALL && row.siteId !== siteFilter) return false
      if (materialFilter !== ALL && row.mineral !== materialFilter) return false
      if (statusFilter !== ALL && row.status !== statusFilter) return false
      return true
    })
  }, [customers, siteFilter, materialFilter, statusFilter])

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Customers</CardTitle>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <FilterSelect
              label="Site"
              value={siteFilter}
              onChange={setSiteFilter}
              options={siteOptions}
              allLabel="All sites"
            />
            <FilterSelect
              label="Material"
              value={materialFilter}
              onChange={setMaterialFilter}
              options={materialOptions}
              allLabel="All materials"
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              allLabel="All statuses"
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead
                rowSpan={2}
                className="text-xs font-medium text-muted-foreground"
              >
                Customer
              </TableHead>
              <TableHead
                rowSpan={2}
                className="text-xs font-medium text-muted-foreground"
              >
                Site
              </TableHead>
              <TableHead
                rowSpan={2}
                className="text-xs font-medium text-muted-foreground"
              >
                Material
              </TableHead>
              <TableHead
                rowSpan={2}
                className="text-xs font-medium text-muted-foreground"
              >
                Province
              </TableHead>
              <TableHead
                rowSpan={2}
                className="text-xs font-medium text-muted-foreground"
              >
                City
              </TableHead>
              <TableHead
                colSpan={2}
                className="border-b-0 text-center text-xs font-medium text-muted-foreground"
              >
                Production Units
              </TableHead>
              <TableHead
                colSpan={2}
                className="border-b-0 text-center text-xs font-medium text-muted-foreground"
              >
                Support Units
              </TableHead>
              <TableHead
                rowSpan={2}
                className="text-xs font-medium text-muted-foreground"
              >
                Status
              </TableHead>
              <TableHead
                rowSpan={2}
                className="text-xs font-medium text-muted-foreground"
              >
                ARR
              </TableHead>
            </TableRow>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="h-8 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </TableHead>
              <TableHead className="h-8 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Installed
              </TableHead>
              <TableHead className="h-8 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </TableHead>
              <TableHead className="h-8 text-right text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Installed
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border/40">
                <TableCell
                  colSpan={11}
                  className="py-8 text-center text-xs text-muted-foreground"
                >
                  No customers match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id} className="border-border/40">
                  <TableCell className="text-xs font-medium text-foreground">
                    {row.companyName}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.siteName}
                  </TableCell>
                  <TableCell>
                    <MineralBadge mineral={row.mineral} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.province}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.city}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-foreground">
                    {row.productionUnitsTotal}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-foreground">
                    {row.productionUnitsInstalled}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-foreground">
                    {row.supportUnitsTotal}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-foreground">
                    {row.supportUnitsInstalled}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    <ArrProgress
                      currentArr={row.currentArr}
                      potentialArr={row.potentialArr}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
