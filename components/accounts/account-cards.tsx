'use client'

import Link from 'next/link'
import { Landmark } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  useTreasuryAccountSummaries,
  useTreasuryAccounts,
} from '@/hooks/use-treasury-accounts'
import type { BankAccount } from '@/lib/finance/treasury-accounts'
import { LiquidAssetsCard } from './liquid-assets-card'

const BANK_ACCENT: Record<string, string> = {
  BCA: 'var(--chart-3)',
  'Hana Bank': 'var(--chart-1)',
  DBS: '#ef4444',
}

const ACCOUNT_LAYOUT = [
  'DBS Holding Account',
  'Hana Bank Savings Account',
  'BCA FOREX Savings Account',
  'BCA Revenue Account',
  'BCA Expense Account',
  'BCA Salary Account',
] as const

function formatAmount(amount: number, currency: 'IDR' | 'USD'): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return currency === 'IDR' ? `Rp ${formatted}` : `$${formatted}`
}

function AccountCard({ account }: { account: BankAccount }) {
  const accent = BANK_ACCENT[account.bank] ?? 'var(--chart-4)'
  const totalAmount = account.balances.reduce((s, b) => s + b.amount, 0)

  return (
    <Card className="relative flex h-full cursor-pointer flex-col overflow-hidden border-border/60 bg-card transition-colors hover:bg-muted/40">
      <span
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: accent }}
        aria-hidden="true"
      />

      <CardHeader className="flex flex-col gap-1 pt-5 pb-3">
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

        <p className="text-sm font-medium leading-snug text-foreground">
          {account.accountName}
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pb-5">
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

function EmptyAccountCard({ name }: { name: string }) {
  return (
    <Card className="relative flex min-h-[180px] flex-col items-center justify-center overflow-hidden border-border/60 bg-card p-4">
      <p className="text-center text-sm text-muted-foreground">{name}</p>
      <p className="text-center text-xs text-muted-foreground">No data</p>
    </Card>
  )
}

export function AccountCards() {
  const {
    data: accounts,
    loading: accountsLoading,
    error: accountsError,
  } = useTreasuryAccounts()
  const {
    data: summaries,
    loading: summariesLoading,
    error: summariesError,
  } = useTreasuryAccountSummaries()

  const loading = accountsLoading || summariesLoading
  const error = accountsError ?? summariesError

  if (loading) {
    return (
      <p className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
        Loading accounts…
      </p>
    )
  }

  if (error) {
    return (
      <p className="flex min-h-[240px] items-center justify-center text-sm text-destructive">
        {error}
      </p>
    )
  }

  if (!summaries) {
    return (
      <p className="flex min-h-[240px] items-center justify-center text-sm text-muted-foreground">
        No summary data
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="h-full lg:row-span-2">
        <LiquidAssetsCard assets={summaries} />
      </div>
      {ACCOUNT_LAYOUT.map((name) => {
        const account = accounts.find((a) => a.accountName === name)
        return account ? (
          <Link
            key={account.id}
            href={`/treasury/account-details?account=${account.id}`}
            className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AccountCard account={account} />
          </Link>
        ) : (
          <EmptyAccountCard key={name} name={name} />
        )
      })}
    </div>
  )
}
