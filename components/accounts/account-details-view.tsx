'use client'

import { useRouter } from 'next/navigation'
import { Landmark } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTreasuryAccounts } from '@/hooks/use-treasury-accounts'
import type { BankAccount } from '@/lib/finance/treasury-accounts'

const BANK_ACCENT: Record<string, string> = {
  BCA: 'var(--chart-3)',
  'Hana Bank': 'var(--chart-1)',
  DBS: '#ef4444',
}

function formatAmount(amount: number, currency: 'IDR' | 'USD'): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return currency === 'IDR' ? `Rp ${formatted}` : `$${formatted}`
}

function HeaderField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

function AccountHeader({ account }: { account: BankAccount }) {
  const accent = BANK_ACCENT[account.bank] ?? 'var(--chart-4)'

  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
        <div className="flex shrink-0 items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {account.accountName}
          </h2>
          <span
            className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: accent }}
          >
            {account.bank}
          </span>
        </div>
        <dl className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2">
          <HeaderField label="Currency" value={account.currency} />
          {account.accountNumber ? (
            <HeaderField label="Account No." value={account.accountNumber} />
          ) : null}
          {account.country ? (
            <HeaderField label="Country" value={account.country} />
          ) : null}
          {account.swiftCode ? (
            <HeaderField label="SWIFT" value={account.swiftCode} />
          ) : null}
          {account.balances.map((balance) => (
            <HeaderField
              key={balance.label}
              label={balance.label}
              value={formatAmount(balance.amount, account.currency)}
            />
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

export function AccountDetailsView({
  selectedId,
}: {
  selectedId: string | null
}) {
  const router = useRouter()
  const { data: accounts, loading, error } = useTreasuryAccounts()

  const account =
    selectedId != null
      ? (accounts.find((item) => item.id === selectedId) ?? null)
      : null

  function onSelectAccount(id: string | null) {
    if (!id) {
      router.push('/treasury/account-details')
      return
    }
    router.push(`/treasury/account-details?account=${id}`)
  }

  const selectedLabel = account
    ? `${account.accountName} · ${account.bank}`
    : 'Select an account'

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Landmark className="size-4 text-primary" aria-hidden="true" />
          <span>Account</span>
        </div>
        <Select
          value={account?.id ?? null}
          onValueChange={(value) => onSelectAccount(value)}
        >
          <SelectTrigger className="w-full sm:w-[320px]" aria-label="Select account">
            <SelectValue placeholder="Select an account">
              {selectedLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {accounts.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.accountName}
                <span className="text-muted-foreground">
                  {' '}
                  · {option.bank}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!account ? (
        <Card className="border-border/60 bg-card/80">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Landmark
              className="size-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground">
              Select an account to view details
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Choose from the list above, or open an account from the Accounts
              page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AccountHeader account={account} />
      )}
    </div>
  )
}
