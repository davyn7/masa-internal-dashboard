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
    ],
  },
  {
    id: 'bca-expense',
    bank: 'BCA',
    accountName: 'Expense Account',
    currency: 'IDR',
    balances: [
      { label: 'Cash Balance', amount: 1_254_750_000 },
    ],
  },
  {
    id: 'bca-forex',
    bank: 'BCA',
    accountName: 'FOREX Savings Account',
    currency: 'USD',
    balances: [
      { label: 'Cash Balance', amount: 198_400 },
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
