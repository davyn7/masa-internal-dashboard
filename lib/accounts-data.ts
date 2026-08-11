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

export const BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bca-revenue',
    bank: 'BCA',
    accountName: 'Revenue Account',
    currency: 'IDR',
    balances: [
      { label: 'Cash Balance', amount: 4_820_500_000 },
      { label: 'Fixed Deposit', amount: 0 },
    ],
  },
  {
    id: 'bca-expense',
    bank: 'BCA',
    accountName: 'Expense Account',
    currency: 'IDR',
    balances: [
      { label: 'Cash Balance', amount: 1_254_750_000 },
      { label: 'Fixed Deposit', amount: 0 },
    ],
  },
  {
    id: 'bca-forex',
    bank: 'BCA',
    accountName: 'FOREX Savings Account',
    currency: 'USD',
    balances: [
      { label: 'Cash Balance', amount: 198_400 },
      { label: 'Fixed Deposit', amount: 0 },
    ],
  },
  {
    id: 'bca-salary',
    bank: 'BCA',
    accountName: 'Salary Account',
    currency: 'IDR',
    balances: [
      { label: 'Cash Balance', amount: 1_100_000_000 },
      { label: 'Fixed Deposit', amount: 0 },
    ],
  },
  {
    id: 'hana-savings',
    bank: 'Hana Bank',
    accountName: 'Savings Account',
    currency: 'IDR',
    balances: [
      { label: 'Cash Balance', amount: 3_100_000_000 },
      { label: 'Fixed Deposit', amount: 10_000_000_000 },
    ],
  },
  {
    id: 'dbs-holding',
    bank: 'DBS',
    accountName: 'Holding Account',
    currency: 'USD',
    balances: [
      { label: 'Cash Balance', amount: 512_000 },
      { label: 'Fixed Deposit', amount: 1_500_000 },
    ],
  },
]

export type InternalTransaction = {
  id: string
  date: string
  from: string
  to: string
  amount: number
  currency: 'IDR' | 'USD'
  description: string
}

export type ExternalTransaction = {
  id: string
  date: string
  account: string
  direction: 'in' | 'out'
  externalParty: string
  amount: number
  currency: 'IDR' | 'USD'
  description: string
}

export const INTERNAL_TRANSACTIONS: InternalTransaction[] = [
  {
    id: 'int-001',
    date: '2026-07-15',
    from: 'BCA Revenue Account',
    to: 'BCA Expense Account',
    amount: 250_000_000,
    currency: 'IDR',
    description: 'Monthly operational fund transfer',
  },
  {
    id: 'int-002',
    date: '2026-07-12',
    from: 'Hana Bank Savings Account',
    to: 'DBS Holding Account',
    amount: 50_000,
    currency: 'USD',
    description: 'Fund consolidation',
  },
  {
    id: 'int-003',
    date: '2026-07-10',
    from: 'BCA FOREX Savings Account',
    to: 'DBS Holding Account',
    amount: 25_000,
    currency: 'USD',
    description: 'Currency transfer',
  },
  {
    id: 'int-004',
    date: '2026-07-08',
    from: 'BCA Revenue Account',
    to: 'Hana Bank Savings Account',
    amount: 1_500_000_000,
    currency: 'IDR',
    description: 'Savings deposit',
  },
  {
    id: 'int-005',
    date: '2026-07-05',
    from: 'BCA Expense Account',
    to: 'BCA Revenue Account',
    amount: 500_000_000,
    currency: 'IDR',
    description: 'Account reconciliation',
  },
]

export const EXTERNAL_TRANSACTIONS: ExternalTransaction[] = [
  {
    id: 'ext-001',
    date: '2026-07-14',
    account: 'BCA Revenue Account',
    direction: 'in',
    externalParty: 'Client Alpha Logistics',
    amount: 2_400_000_000,
    currency: 'IDR',
    description: 'Monthly subscription payment',
  },
  {
    id: 'ext-002',
    date: '2026-07-13',
    account: 'BCA Expense Account',
    direction: 'out',
    externalParty: 'AWS Cloud Services',
    amount: 45_000_000,
    currency: 'IDR',
    description: 'Cloud infrastructure bill',
  },
  {
    id: 'ext-003',
    date: '2026-07-11',
    account: 'BCA FOREX Savings Account',
    direction: 'in',
    externalParty: 'DBS Bank Forex Exchange',
    amount: 15_000,
    currency: 'USD',
    description: 'Currency exchange commission return',
  },
  {
    id: 'ext-004',
    date: '2026-07-09',
    account: 'DBS Holding Account',
    direction: 'in',
    externalParty: 'Global Tech Ventures',
    amount: 500_000,
    currency: 'USD',
    description: 'Investment return',
  },
  {
    id: 'ext-005',
    date: '2026-07-06',
    account: 'Hana Bank Savings Account',
    direction: 'out',
    externalParty: 'Jakarta Equipment Rental',
    amount: 250_000_000,
    currency: 'IDR',
    description: 'Equipment lease payment',
  },
  {
    id: 'ext-006',
    date: '2026-07-02',
    account: 'BCA Revenue Account',
    direction: 'in',
    externalParty: 'Client Beta Mining',
    amount: 1_800_000_000,
    currency: 'IDR',
    description: 'Monthly subscription payment',
  },
]

export const FX_RATE = 16_250 // IDR per USD

export type LiquidAssets = {
  totalCashBalanceIdr: number
  totalCashBalanceUsd: number
  totalFixedDepositIdr: number
  totalFixedDepositUsd: number
  totalInUsd: number
}

export function calculateLiquidAssets(): LiquidAssets {
  let totalCashBalanceIdr = 0
  let totalCashBalanceUsd = 0
  let totalFixedDepositIdr = 0
  let totalFixedDepositUsd = 0

  BANK_ACCOUNTS.forEach((account) => {
    account.balances.forEach((balance) => {
      if (balance.label === 'Cash Balance') {
        if (account.currency === 'IDR') {
          totalCashBalanceIdr += balance.amount
        } else {
          totalCashBalanceUsd += balance.amount
        }
      } else if (balance.label === 'Fixed Deposit') {
        if (account.currency === 'IDR') {
          totalFixedDepositIdr += balance.amount
        } else {
          totalFixedDepositUsd += balance.amount
        }
      }
    })
  })

  // Convert all to USD for the total
  const totalInUsd =
    totalCashBalanceIdr / FX_RATE +
    totalCashBalanceUsd +
    totalFixedDepositIdr / FX_RATE +
    totalFixedDepositUsd

  return {
    totalCashBalanceIdr,
    totalCashBalanceUsd,
    totalFixedDepositIdr,
    totalFixedDepositUsd,
    totalInUsd,
  }
}
