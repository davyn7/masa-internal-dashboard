'use client'

import { Banknote } from 'lucide-react'
import { calculateLiquidAssets, FX_RATE } from '@/lib/accounts-data'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function formatAmount(amount: number, currency: 'IDR' | 'USD'): string {
  if (currency === 'IDR') {
    if (amount >= 1_000_000_000) {
      return `Rp ${(amount / 1_000_000_000).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} B`
    }
    if (amount >= 1_000_000) {
      return `Rp ${(amount / 1_000_000).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      })} M`
    }
    return `Rp ${amount.toLocaleString('en-US')}`
  }
  // USD
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} M`
  }
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function LiquidAssetsCard() {
  const assets = calculateLiquidAssets()
  const accentColor = 'var(--chart-2)' // amber accent for summary card

  return (
    <Card className="relative flex flex-col overflow-hidden border-border/60 bg-card">
      {/* top accent bar */}
      <span
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: accentColor }}
        aria-hidden="true"
      />

      <CardHeader className="flex flex-col gap-1 pt-5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Banknote
              className="size-3.5 shrink-0"
              style={{ color: accentColor }}
              aria-hidden="true"
            />
            <span
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              Summary
            </span>
          </div>
        </div>
        <p className="text-sm font-medium leading-snug text-foreground">
          Liquid Assets
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pb-5">
        {/* Balance lines */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">
              Total Cash Balance (IDR)
            </span>
            <span className="font-mono text-sm font-semibold leading-tight tracking-tight text-foreground">
              {formatAmount(assets.totalCashBalanceIdr, 'IDR')}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">
              Total Cash Balance (USD)
            </span>
            <span className="font-mono text-sm font-semibold leading-tight tracking-tight text-foreground">
              {formatAmount(assets.totalCashBalanceUsd, 'USD')}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">
              Total Fixed Deposit (IDR)
            </span>
            <span className="font-mono text-sm font-semibold leading-tight tracking-tight text-foreground">
              {formatAmount(assets.totalFixedDepositIdr, 'IDR')}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">
              Total Fixed Deposit (USD)
            </span>
            <span className="font-mono text-sm font-semibold leading-tight tracking-tight text-foreground">
              {formatAmount(assets.totalFixedDepositUsd, 'USD')}
            </span>
          </div>
        </div>

        {/* Divider + total */}
        <div className="h-px bg-border/60" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">
            Total (USD)
          </span>
          <span
            className="font-mono text-base font-semibold"
            style={{ color: accentColor }}
          >
            {formatAmount(assets.totalInUsd, 'USD')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
