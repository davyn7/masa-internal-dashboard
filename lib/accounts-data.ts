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
