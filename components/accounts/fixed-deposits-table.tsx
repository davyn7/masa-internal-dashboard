'use client'

import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import {
  FIXED_DEPOSITS,
  MATURITY_INSTRUCTIONS,
  type FixedDeposit,
  type InterestBasis,
  type MaturityInstruction,
} from '@/lib/accounts-data'
import { calculateFixedDeposit } from '@/lib/finance/treasury-accounts'
import { useTreasuryAccounts } from '@/hooks/use-treasury-accounts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CURRENCY_FORMAT = {
  IDR: new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }),
}

type Currency = 'IDR' | 'USD'

type FixedDepositFormState = {
  accountId: string
  depositDate: string
  interestRate: string
  principalAmount: string
  tenorMonths: string
  maturityInstruction: MaturityInstruction | ''
}

type CalculatedFields = {
  interestAmount: number
  totalAmount: number
  maturityDate: string
  interestBasis: InterestBasis
}

const EMPTY_FORM: FixedDepositFormState = {
  accountId: '',
  depositDate: '',
  interestRate: '',
  principalAmount: '',
  tenorMonths: '',
  maturityInstruction: '',
}

const PRINCIPAL_FORMAT = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

function formatCurrency(amount: number, currency: Currency): string {
  return CURRENCY_FORMAT[currency].format(amount)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr.slice(0, 10) + 'T00:00:00Z')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
}

function daysUntilMaturity(maturityDate: string, now = new Date()): number {
  const maturity = startOfUtcDay(
    new Date(maturityDate.slice(0, 10) + 'T00:00:00Z'),
  )
  const today = startOfUtcDay(now)
  return Math.round(
    (maturity.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )
}

function formatTimeToMaturity(days: number): string {
  if (days === 0) return 'Matures today'
  if (days === 1) return '1 day'
  if (days < 30) return `${days} days`

  const months = Math.floor(days / 30)
  const remainingDays = days % 30
  if (remainingDays === 0) {
    return months === 1 ? '1 month' : `${months} months`
  }
  const monthLabel = months === 1 ? '1 month' : `${months} months`
  const dayLabel = remainingDays === 1 ? '1 day' : `${remainingDays} days`
  return `${monthLabel}, ${dayLabel}`
}

function isMatured(deposit: FixedDeposit, now = new Date()): boolean {
  return daysUntilMaturity(deposit.maturityDate, now) <= 0
}

function parseAmount(value: string): number {
  return Number(value.replace(/,/g, ''))
}

function formatPrincipalInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return PRINCIPAL_FORMAT.format(Number(digits))
}

function sanitizeInterestRateInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (!cleaned) return ''

  const firstDot = cleaned.indexOf('.')
  const normalized =
    firstDot === -1
      ? cleaned
      : `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, '')}`

  const [integerPart = '', decimalPart = ''] = normalized.split('.')
  if (!normalized.includes('.')) return integerPart
  return `${integerPart}.${decimalPart.slice(0, 2)}`
}

function finalizeInterestRateInput(value: string): string {
  if (!value) return ''
  const amount = Number(value)
  if (!Number.isFinite(amount)) return value
  return amount.toFixed(2)
}

function InterestBasisTag({ basis }: { basis: InterestBasis }) {
  const isGross = basis === 'gross'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        isGross
          ? 'bg-muted text-muted-foreground'
          : 'bg-success/15 text-success'
      }`}
    >
      {isGross ? 'Gross' : 'Net'}
    </span>
  )
}

function TimeToMaturityCell({ deposit }: { deposit: FixedDeposit }) {
  const days = daysUntilMaturity(deposit.maturityDate)

  if (days <= 0) {
    return (
      <Button variant="outline" size="xs">
        Execute Instruction
      </Button>
    )
  }

  return (
    <span className="text-xs tabular-nums text-foreground">
      {formatTimeToMaturity(days)}
    </span>
  )
}

export function FixedDepositsTable() {
  const {
    data: accounts,
    loading: accountsLoading,
    error: accountsError,
  } = useTreasuryAccounts()
  const [deposits, setDeposits] = useState<FixedDeposit[]>(FIXED_DEPOSITS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FixedDepositFormState>(EMPTY_FORM)
  const [calculated, setCalculated] = useState<CalculatedFields | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [calculateError, setCalculateError] = useState<string | null>(null)

  const selectedAccount = accounts.find((account) => account.id === form.accountId)

  function openCreateDialog() {
    setForm(EMPTY_FORM)
    setCalculated(null)
    setCalculateError(null)
    setDialogOpen(true)
  }

  function updateFormField<K extends keyof FixedDepositFormState>(
    field: K,
    value: FixedDepositFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setCalculated(null)
    setCalculateError(null)
  }

  async function handleCalculate() {
    const interestRate = Number(form.interestRate)
    const principalAmount = parseAmount(form.principalAmount)
    const tenor = Number(form.tenorMonths)

    if (
      !form.accountId ||
      !form.depositDate ||
      !Number.isFinite(interestRate) ||
      !Number.isFinite(principalAmount) ||
      !Number.isFinite(tenor) ||
      tenor <= 0
    ) {
      setCalculateError(
        'Fill in account, deposit date, interest rate, principal, and tenor first.',
      )
      return
    }

    setCalculating(true)
    setCalculateError(null)

    try {
      const result = await calculateFixedDeposit({
        accountId: form.accountId,
        principalAmount,
        interestRate,
        tenor,
        depositDate: form.depositDate,
      })
      setCalculated(result)
    } catch (error) {
      setCalculated(null)
      setCalculateError(
        error instanceof Error
          ? error.message
          : 'Failed to calculate fixed deposit',
      )
    } finally {
      setCalculating(false)
    }
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedAccount || !calculated || !form.maturityInstruction) return

    const interestRate = Number(form.interestRate)
    const principalAmount = parseAmount(form.principalAmount)
    const tenorMonths = Number(form.tenorMonths)

    if (
      !Number.isFinite(interestRate) ||
      !Number.isFinite(principalAmount) ||
      !Number.isFinite(tenorMonths)
    ) {
      return
    }

    const deposit: FixedDeposit = {
      id: `fd-${Date.now()}`,
      accountId: selectedAccount.id,
      accountName: selectedAccount.accountName,
      depositDate: form.depositDate,
      maturityDate: calculated.maturityDate.slice(0, 10),
      tenorMonths,
      interestRate,
      interestBasis: calculated.interestBasis,
      currency: selectedAccount.currency,
      principalAmount,
      interestAmount: calculated.interestAmount,
      totalAmount: calculated.totalAmount,
      maturityInstruction: form.maturityInstruction,
    }

    setDeposits((prev) => [deposit, ...prev])
    setDialogOpen(false)
    setForm(EMPTY_FORM)
    setCalculated(null)
    setCalculateError(null)
  }

  return (
    <>
      <Card className="flex min-w-0 flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Fixed Deposits</CardTitle>
          <CardAction>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus data-icon="inline-start" />
              Create Fixed Deposit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="min-w-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Account Name
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Deposit Date
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Maturity Date
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">
                  Tenor
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">
                  Interest Rate
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Net / Gross
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Currency
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">
                  Principal Amount
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">
                  Interest Amount
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">
                  Total Amount
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Maturity Instruction
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Time to Maturity
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((deposit) => (
                <TableRow
                  key={deposit.id}
                  className={`border-border/40 ${isMatured(deposit) ? 'bg-muted/30' : ''}`}
                >
                  <TableCell className="max-w-[140px] whitespace-normal text-xs font-medium text-foreground">
                    {deposit.accountName}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(deposit.depositDate)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(deposit.maturityDate)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-foreground">
                    {deposit.tenorMonths} mo
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-foreground">
                    {deposit.interestRate.toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <InterestBasisTag basis={deposit.interestBasis} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {deposit.currency}
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums text-foreground">
                    {formatCurrency(deposit.principalAmount, deposit.currency)}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-foreground">
                    {formatCurrency(deposit.interestAmount, deposit.currency)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium tabular-nums text-foreground">
                    {formatCurrency(deposit.totalAmount, deposit.currency)}
                  </TableCell>
                  <TableCell className="max-w-[160px] whitespace-normal text-xs text-muted-foreground">
                    {deposit.maturityInstruction}
                  </TableCell>
                  <TableCell>
                    <TimeToMaturityCell deposit={deposit} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Fixed Deposit</DialogTitle>
            <DialogDescription>
              Enter deposit details, then calculate maturity and interest from
              the treasury API.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fd-account">Account</Label>
              <Select
                value={form.accountId}
                onValueChange={(value) => {
                  if (!value) return
                  updateFormField('accountId', value)
                }}
                disabled={accountsLoading || Boolean(accountsError)}
              >
                <SelectTrigger
                  id="fd-account"
                  className="w-full"
                  aria-label="Account"
                >
                  <SelectValue placeholder="Select account">
                    {selectedAccount
                      ? `${selectedAccount.accountName} (${selectedAccount.currency})`
                      : accountsLoading
                        ? 'Loading accounts…'
                        : 'Select account'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} ({account.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {accountsError ? (
                <p className="text-xs text-destructive">{accountsError}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fd-deposit-date">Deposit Date</Label>
                <Input
                  id="fd-deposit-date"
                  type="date"
                  value={form.depositDate}
                  onChange={(event) =>
                    updateFormField('depositDate', event.target.value)
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fd-tenor">Tenor (months)</Label>
                <Input
                  id="fd-tenor"
                  type="number"
                  min="1"
                  step="1"
                  value={form.tenorMonths}
                  onChange={(event) =>
                    updateFormField('tenorMonths', event.target.value)
                  }
                  placeholder="6"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fd-interest-rate">Interest Rate (%)</Label>
              <Input
                id="fd-interest-rate"
                type="text"
                inputMode="decimal"
                value={form.interestRate}
                onChange={(event) => {
                  const sanitized = sanitizeInterestRateInput(event.target.value)
                  if (!sanitized) {
                    updateFormField('interestRate', '')
                    return
                  }
                  if (sanitized.endsWith('.')) {
                    updateFormField('interestRate', sanitized)
                    return
                  }
                  const decimalPart = sanitized.split('.')[1] ?? ''
                  if (sanitized.includes('.') && decimalPart.length < 2) {
                    updateFormField('interestRate', sanitized)
                    return
                  }
                  updateFormField(
                    'interestRate',
                    finalizeInterestRateInput(sanitized),
                  )
                }}
                onBlur={() => {
                  if (!form.interestRate) return
                  updateFormField(
                    'interestRate',
                    finalizeInterestRateInput(form.interestRate),
                  )
                }}
                placeholder="0.00"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fd-principal">Principal Amount</Label>
              <Input
                id="fd-principal"
                type="text"
                inputMode="numeric"
                value={form.principalAmount}
                onChange={(event) =>
                  updateFormField(
                    'principalAmount',
                    formatPrincipalInput(event.target.value),
                  )
                }
                placeholder="1,000,000"
                required
              />
              {selectedAccount ? (
                <p className="text-xs text-muted-foreground">
                  Currency: {selectedAccount.currency}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fd-maturity-instruction">
                Maturity Instruction
              </Label>
              <Select
                value={form.maturityInstruction}
                onValueChange={(value) => {
                  if (
                    !value ||
                    !MATURITY_INSTRUCTIONS.includes(
                      value as MaturityInstruction,
                    )
                  ) {
                    return
                  }
                  updateFormField(
                    'maturityInstruction',
                    value as MaturityInstruction,
                  )
                }}
              >
                <SelectTrigger
                  id="fd-maturity-instruction"
                  className="w-full"
                  aria-label="Maturity instruction"
                >
                  <SelectValue placeholder="Select instruction">
                    {form.maturityInstruction || 'Select instruction'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MATURITY_INSTRUCTIONS.map((instruction) => (
                    <SelectItem key={instruction} value={instruction}>
                      {instruction}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCalculate}
              disabled={calculating || accountsLoading}
            >
              {calculating ? 'Calculating…' : 'Calculate'}
            </Button>

            {calculateError ? (
              <p className="text-xs text-destructive">{calculateError}</p>
            ) : null}

            {calculated ? (
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 sm:grid-cols-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    Maturity Date
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {formatDate(calculated.maturityDate)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    Net / Gross
                  </span>
                  <div>
                    <InterestBasisTag basis={calculated.interestBasis} />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    Interest Amount
                  </span>
                  <span className="text-xs font-medium tabular-nums text-foreground">
                    {selectedAccount
                      ? formatCurrency(
                          calculated.interestAmount,
                          selectedAccount.currency,
                        )
                      : calculated.interestAmount}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    Total Amount
                  </span>
                  <span className="text-xs font-medium tabular-nums text-foreground">
                    {selectedAccount
                      ? formatCurrency(
                          calculated.totalAmount,
                          selectedAccount.currency,
                        )
                      : calculated.totalAmount}
                  </span>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !calculated || !selectedAccount || !form.maturityInstruction
                }
              >
                Create Fixed Deposit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
