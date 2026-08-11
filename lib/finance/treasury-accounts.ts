import { apiGet } from '@/lib/api/client'

export type TreasuryAccountApiRecord = {
  id: number
  created_at?: string
  name: string
  country?: string
  currency: string
  bank_name: string
  bank_address?: string
  account_number?: string
  routing_number?: string
  swift_code?: string
  cash_balance: number | string
  fixed_deposit_balance: number | string
  other_balance?: number | string
}

export type TreasuryAccountSummariesApiRecord = {
  cash_balance_idr: number | string
  cash_balance_usd: number | string
  fixed_deposit_idr: number | string
  fixed_deposit_usd: number | string
  total: number | string
}

export type BalanceLine = {
  label: string
  amount: number
}

export type BankAccount = {
  id: string
  bank: string
  accountName: string
  currency: 'IDR' | 'USD'
  balances: BalanceLine[]
}

export type LiquidAssets = {
  totalCashBalanceIdr: number
  totalCashBalanceUsd: number
  totalFixedDepositIdr: number
  totalFixedDepositUsd: number
  totalInUsd: number
}

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number.parseFloat(value)
}

function toCurrency(value: string): 'IDR' | 'USD' {
  return value.toUpperCase() === 'USD' ? 'USD' : 'IDR'
}

export function mapAccountRecord(record: TreasuryAccountApiRecord): BankAccount {
  return {
    id: String(record.id),
    bank: record.bank_name,
    accountName: record.name,
    currency: toCurrency(record.currency),
    balances: [
      { label: 'Cash Balance', amount: toNumber(record.cash_balance) },
      {
        label: 'Fixed Deposit',
        amount: toNumber(record.fixed_deposit_balance),
      },
    ],
  }
}

export function mapSummariesRecord(
  record: TreasuryAccountSummariesApiRecord,
): LiquidAssets {
  return {
    totalCashBalanceIdr: toNumber(record.cash_balance_idr),
    totalCashBalanceUsd: toNumber(record.cash_balance_usd),
    totalFixedDepositIdr: toNumber(record.fixed_deposit_idr),
    totalFixedDepositUsd: toNumber(record.fixed_deposit_usd),
    totalInUsd: toNumber(record.total),
  }
}

export async function fetchTreasuryAccounts(): Promise<BankAccount[]> {
  const records = await apiGet<TreasuryAccountApiRecord[]>('/treasury/accounts')
  return records.map(mapAccountRecord)
}

export async function fetchTreasuryAccountSummaries(): Promise<LiquidAssets> {
  const record = await apiGet<TreasuryAccountSummariesApiRecord>(
    '/treasury/accounts/summaries',
  )
  return mapSummariesRecord(record)
}
