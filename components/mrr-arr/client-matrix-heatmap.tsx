'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ChartShell } from '@/components/charts/chart-shell'
import { CurrencyToggle } from '@/components/charts/currency-toggle'
import {
  EXPIRY_LEGEND,
  getExpiryColor,
  getExpiryTextColor,
} from '@/lib/charts/contract-expiry-color'
import { layoutTreemap } from '@/lib/charts/treemap-layout'
import {
  formatExpiryLabel,
  getClientMatrixGroups,
  type ClientSiteRecord,
  type SiteGroup,
} from '@/lib/finance/client-matrix'
import { type Currency, formatCompact } from '@/lib/finance/shared'
import { cn } from '@/lib/utils'

const CANVAS_HEIGHT = 360
const SITE_HEADER_HEIGHT = 22
const SITE_GAP = 2
const TILE_GAP = 1
const MIN_TILE_W = 44
const MIN_TILE_H = 32

type HoverState =
  | { type: 'site'; group: SiteGroup; x: number; y: number }
  | { type: 'client'; client: ClientSiteRecord; x: number; y: number }
  | null

function MineralBadge({ mineral }: { mineral: string }) {
  return (
    <span className="rounded-sm bg-background/20 px-1 py-px text-[9px] font-medium uppercase tracking-wide">
      {mineral}
    </span>
  )
}

function HoverPanel({
  hover,
  currency,
}: {
  hover: NonNullable<HoverState>
  currency: Currency
}) {
  if (hover.type === 'site') {
    const { group } = hover
    return (
      <div className="pointer-events-none w-56 rounded-md bg-foreground px-3 py-2 text-background shadow-lg">
        <p className="text-xs font-semibold">
          {group.siteName}{' '}
          <span className="font-normal text-background/70">· {group.mineral}</span>
        </p>
        <div className="mt-2 flex flex-col gap-1.5">
          {group.clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between gap-2 border-t border-background/15 pt-1.5 first:border-0 first:pt-0"
            >
              <span className="truncate text-[11px]">{client.companyName}</span>
              <div className="shrink-0 text-right font-mono text-[10px] tabular-nums">
                <div>{formatCompact(client.mrr, currency)} MRR</div>
                <div className="text-background/70">
                  {formatCompact(client.arr, currency)} ARR
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const { client } = hover
  return (
    <div className="pointer-events-none w-48 rounded-md bg-foreground px-3 py-2 text-background shadow-lg">
      <p className="text-xs font-semibold">{client.companyName}</p>
      <p className="text-[10px] text-background/70">
        {client.siteName} · {client.mineral}
      </p>
      <dl className="mt-2 space-y-1 font-mono text-[11px] tabular-nums">
        <div className="flex justify-between gap-4">
          <dt className="text-background/70">MRR</dt>
          <dd>{formatCompact(client.mrr, currency)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-background/70">ARR</dt>
          <dd>{formatCompact(client.arr, currency)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-background/70">Units</dt>
          <dd>{client.unitsInstalled}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-background/70">Contract</dt>
          <dd>{formatExpiryLabel(client.monthsUntilExpiry)} left</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-background/70">MRR change</dt>
          <dd>
            {client.mrrChange >= 0 ? '+' : ''}
            {client.mrrChange.toFixed(1)}%
          </dd>
        </div>
      </dl>
    </div>
  )
}

function ExpiryLegend() {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-[10px] text-muted-foreground">Contract runway</span>
      <div
        className="h-2 flex-1 rounded-sm"
        style={{
          background: `linear-gradient(to right, ${getExpiryColor(EXPIRY_LEGEND.red)}, ${getExpiryColor(EXPIRY_LEGEND.neutral)}, ${getExpiryColor(EXPIRY_LEGEND.green)})`,
        }}
      />
      <div className="flex gap-3 font-mono text-[10px] tabular-nums text-muted-foreground">
        <span>0 mo</span>
        <span>9 mo</span>
        <span>18+ mo</span>
      </div>
    </div>
  )
}

function ClientTile({
  client,
  rect,
  onHover,
  onLeave,
}: {
  client: ClientSiteRecord
  rect: { x: number; y: number; w: number; h: number }
  onHover: (client: ClientSiteRecord, x: number, y: number) => void
  onLeave: () => void
}) {
  const showLabel = rect.w >= MIN_TILE_W && rect.h >= MIN_TILE_H
  const bg = getExpiryColor(client.monthsUntilExpiry)
  const color = getExpiryTextColor(client.monthsUntilExpiry)

  return (
    <div
      className="absolute overflow-hidden rounded-[2px] transition-opacity hover:opacity-90"
      style={{
        left: rect.x + TILE_GAP / 2,
        top: rect.y + TILE_GAP / 2,
        width: Math.max(0, rect.w - TILE_GAP),
        height: Math.max(0, rect.h - TILE_GAP),
        backgroundColor: bg,
        color,
      }}
      onMouseEnter={(e) => {
        e.stopPropagation()
        onHover(client, e.clientX, e.clientY)
      }}
      onMouseMove={(e) => {
        e.stopPropagation()
        onHover(client, e.clientX, e.clientY)
      }}
      onMouseLeave={(e) => {
        e.stopPropagation()
        onLeave()
      }}
    >
      {showLabel ? (
        <div className="flex h-full flex-col justify-center px-1 py-0.5">
          <span className="truncate text-[10px] font-medium leading-tight">
            {client.companyName}
          </span>
          <span className="font-mono text-[9px] tabular-nums opacity-90">
            {formatExpiryLabel(client.monthsUntilExpiry)}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function SiteGroupBlock({
  group,
  rect,
  onSiteHover,
  onClientHover,
  onLeave,
}: {
  group: SiteGroup
  rect: { x: number; y: number; w: number; h: number }
  onSiteHover: (group: SiteGroup, x: number, y: number) => void
  onClientHover: (client: ClientSiteRecord, x: number, y: number) => void
  onLeave: () => void
}) {
  const innerHeight = Math.max(0, rect.h - SITE_HEADER_HEIGHT)
  const clientRects = useMemo(
    () =>
      layoutTreemap(
        group.clients.map((c) => ({ value: c.mrr, data: c })),
        rect.w,
        innerHeight,
      ),
    [group.clients, rect.w, innerHeight],
  )

  return (
    <div
      className="absolute overflow-hidden rounded-sm border border-border/40 bg-muted/30"
      style={{
        left: rect.x + SITE_GAP / 2,
        top: rect.y + SITE_GAP / 2,
        width: Math.max(0, rect.w - SITE_GAP),
        height: Math.max(0, rect.h - SITE_GAP),
      }}
      onMouseEnter={(e) => onSiteHover(group, e.clientX, e.clientY)}
      onMouseMove={(e) => onSiteHover(group, e.clientX, e.clientY)}
      onMouseLeave={onLeave}
    >
      <div className="flex h-[22px] items-center gap-1.5 truncate px-1.5 text-[10px] font-medium text-foreground">
        <span className="truncate">{group.siteName}</span>
        <MineralBadge mineral={group.mineral} />
      </div>
      <div
        className="relative"
        style={{ height: innerHeight, width: rect.w }}
      >
        {clientRects.map((cr) => (
          <ClientTile
            key={cr.data.id}
            client={cr.data}
            rect={cr}
            onHover={onClientHover}
            onLeave={onLeave}
          />
        ))}
      </div>
    </div>
  )
}

export function ClientMatrixHeatmap() {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [hover, setHover] = useState<HoverState>(null)
  const [width, setWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const groups = useMemo(() => getClientMatrixGroups(), [])

  const siteRects = useMemo(() => {
    if (width <= 0) return []
    return layoutTreemap(
      groups.map((g) => ({ value: g.totalMrr, data: g })),
      width,
      CANVAS_HEIGHT,
    )
  }, [groups, width])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    setWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])

  const handleSiteHover = useCallback(
    (group: SiteGroup, x: number, y: number) => {
      setHover({ type: 'site', group, x, y })
    },
    [],
  )

  const handleClientHover = useCallback(
    (client: ClientSiteRecord, x: number, y: number) => {
      setHover({ type: 'client', client, x, y })
    },
    [],
  )

  const handleLeave = useCallback(() => setHover(null), [])

  return (
    <ChartShell
      title="Client Revenue Matrix"
      description="MRR & ARR by client and site; color shows contract runway"
      controls={
        <CurrencyToggle value={currency} onChange={setCurrency} />
      }
      className="xl:col-span-1"
    >
      <div className="flex flex-col gap-0">
        <div
          ref={containerRef}
          className={cn('relative w-full', width > 0 ? '' : 'min-h-[360px]')}
          style={{ height: CANVAS_HEIGHT }}
          onMouseLeave={handleLeave}
        >
          {siteRects.map((sr) => (
            <SiteGroupBlock
              key={sr.data.siteId}
              group={sr.data}
              rect={sr}
              onSiteHover={handleSiteHover}
              onClientHover={handleClientHover}
              onLeave={handleLeave}
            />
          ))}
        </div>

        <ExpiryLegend />

        {hover ? (
          <div
            className="pointer-events-none fixed z-50"
            style={{
              left: hover.x + 12,
              top: hover.y + 12,
            }}
            role="tooltip"
          >
            <HoverPanel hover={hover} currency={currency} />
          </div>
        ) : null}
      </div>
    </ChartShell>
  )
}
