'use client'

import { Landmark } from 'lucide-react'
import { BANK_ACCOUNTS, type BankAccount } from '@/lib/accounts-data'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LiquidAssetsCard } from './liquid-assets-card'

const BANK_ACCENT: Record<string, string> = {
  BCA:       'var(--chart-3)',   // blue (was DBS)
  'Hana Bank': 'var(--chart-1)', // cyan (was BCA)
  DBS:       '#ef4444',          // red
}

function formatAmount(amount: number, currency: 'IDR' | 'USD'): string {
  if (currency === 'IDR') {
    // Compact IDR: show as "Rp 4.82 B" or "Rp 821 M"
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

function AccountCard({ account }: { account: BankAccount }) {
  const accent = BANK_ACCENT[account.bank] ?? 'var(--chart-4)'
  const totalAmount = account.balances.reduce((s, b) => s + b.amount, 0)

  return (
    <Card className="relative flex flex-col overflow-hidden border-border/60 bg-card">
      {/* top accent bar */}
      <span
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: accent }}
        aria-hidden="true"
      />

      <CardHeader className="flex flex-col gap-1 pt-5 pb-3">
        {/* Bank badge + currency pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Landmark
              className="size-3.5 shrink-0"
              style={{ color: accent }}
              aria-hidden="true"
            />
            <span
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: accent }}
            >
              {account.bank}
            </span>
          </div>
          <span className="rounded-full border border-border/60 bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {account.currency}
          </span>
        </div>

        {/* Account name */}
        <p className="text-sm font-medium leading-snug text-foreground">
          {account.accountName}
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pb-5">
        {/* Balance lines */}
        <div className="flex flex-col gap-2">
          {account.balances.map((bal) => (
            <div key={bal.label} className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">
                {bal.label}
              </span>
              <span className="font-mono text-lg font-semibold leading-tight tracking-tight text-foreground">
                {formatAmount(bal.amount, account.currency)}
              </span>
            </div>
          ))}
        </div>

        {/* Divider + total if multi-balance */}
        {account.balances.length > 1 && (
          <>
            <div className="h-px bg-border/60" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Total</span>
              <span
                className="font-mono text-sm font-semibold"
                style={{ color: accent }}
              >
                {formatAmount(totalAmount, account.currency)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function getAccount(id: string): BankAccount {
  const account = BANK_ACCOUNTS.find((a) => a.id === id)
  if (!account) throw new Error(`Unknown account: ${id}`)
  return account
}

export function AccountCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="h-full lg:row-span-2">
        <LiquidAssetsCard />
      </div>
      <AccountCard account={getAccount('dbs-holding')} />
      <AccountCard account={getAccount('hana-savings')} />
      <AccountCard account={getAccount('bca-forex')} />
      <AccountCard account={getAccount('bca-revenue')} />
      <AccountCard account={getAccount('bca-expense')} />
      <AccountCard account={getAccount('bca-salary')} />
    </div>
  )
}
