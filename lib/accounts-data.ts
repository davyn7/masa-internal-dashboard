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

export const MATURITY_INSTRUCTIONS = [
  'Withdraw Principal + Interest',
  'Renew Principal & Withdraw Interest',
  'Renew Principal + Interest',
] as const

export type MaturityInstruction = (typeof MATURITY_INSTRUCTIONS)[number]

export type InterestBasis = 'net' | 'gross'

export type FixedDeposit = {
  id: string
  accountId: string
  accountName: string
  depositDate: string
  maturityDate: string
  tenorMonths: number
  interestRate: number
  interestBasis: InterestBasis
  currency: 'IDR' | 'USD'
  principalAmount: number
  interestAmount: number
  totalAmount: number
  maturityInstruction: MaturityInstruction
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

export const FIXED_DEPOSITS: FixedDeposit[] = [
  {
    id: 'fd-001',
    accountId: '1',
    accountName: 'Hana Bank Savings Account',
    depositDate: '2025-08-11',
    maturityDate: '2026-08-11',
    tenorMonths: 12,
    interestRate: 5.25,
    interestBasis: 'gross',
    currency: 'IDR',
    principalAmount: 5_000_000_000,
    interestAmount: 262_500_000,
    totalAmount: 5_262_500_000,
    maturityInstruction: 'Renew Principal + Interest',
  },
  {
    id: 'fd-002',
    accountId: '2',
    accountName: 'BCA FOREX Savings Account',
    depositDate: '2025-11-15',
    maturityDate: '2026-05-15',
    tenorMonths: 6,
    interestRate: 4.1,
    interestBasis: 'net',
    currency: 'USD',
    principalAmount: 250_000,
    interestAmount: 5_125,
    totalAmount: 255_125,
    maturityInstruction: 'Withdraw Principal + Interest',
  },
  {
    id: 'fd-003',
    accountId: '3',
    accountName: 'DBS Holding Account',
    depositDate: '2026-02-01',
    maturityDate: '2026-08-01',
    tenorMonths: 6,
    interestRate: 4.75,
    interestBasis: 'gross',
    currency: 'USD',
    principalAmount: 500_000,
    interestAmount: 11_875,
    totalAmount: 511_875,
    maturityInstruction: 'Renew Principal & Withdraw Interest',
  },
  {
    id: 'fd-004',
    accountId: '4',
    accountName: 'BCA Revenue Account',
    depositDate: '2026-03-01',
    maturityDate: '2026-09-01',
    tenorMonths: 6,
    interestRate: 5.0,
    interestBasis: 'net',
    currency: 'IDR',
    principalAmount: 2_000_000_000,
    interestAmount: 50_000_000,
    totalAmount: 2_050_000_000,
    maturityInstruction: 'Renew Principal + Interest',
  },
  {
    id: 'fd-005',
    accountId: '5',
    accountName: 'Hana Bank Savings Account',
    depositDate: '2026-05-20',
    maturityDate: '2026-11-20',
    tenorMonths: 6,
    interestRate: 5.5,
    interestBasis: 'gross',
    currency: 'IDR',
    principalAmount: 1_500_000_000,
    interestAmount: 41_250_000,
    totalAmount: 1_541_250_000,
    maturityInstruction: 'Withdraw Principal + Interest',
  },
  {
    id: 'fd-006',
    accountId: '3',
    accountName: 'DBS Holding Account',
    depositDate: '2026-06-15',
    maturityDate: '2027-06-15',
    tenorMonths: 12,
    interestRate: 4.9,
    interestBasis: 'net',
    currency: 'USD',
    principalAmount: 100_000,
    interestAmount: 4_900,
    totalAmount: 104_900,
    maturityInstruction: 'Renew Principal & Withdraw Interest',
  },
]
