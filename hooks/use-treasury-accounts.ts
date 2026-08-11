'use client'

import { useEffect, useState } from 'react'

import {
  fetchTreasuryAccountSummaries,
  fetchTreasuryAccounts,
  type BankAccount,
  type LiquidAssets,
} from '@/lib/finance/treasury-accounts'

let cachedAccountsRequest: Promise<BankAccount[]> | null = null
let cachedSummariesRequest: Promise<LiquidAssets> | null = null

function loadTreasuryAccounts(): Promise<BankAccount[]> {
  if (!cachedAccountsRequest) {
    cachedAccountsRequest = fetchTreasuryAccounts().catch((error) => {
      cachedAccountsRequest = null
      throw error
    })
  }
  return cachedAccountsRequest
}

function loadTreasuryAccountSummaries(): Promise<LiquidAssets> {
  if (!cachedSummariesRequest) {
    cachedSummariesRequest = fetchTreasuryAccountSummaries().catch((error) => {
      cachedSummariesRequest = null
      throw error
    })
  }
  return cachedSummariesRequest
}

export function useTreasuryAccounts() {
  const [data, setData] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadTreasuryAccounts()
      .then((accounts) => {
        if (!cancelled) setData(accounts)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load accounts',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}

export function useTreasuryAccountSummaries() {
  const [data, setData] = useState<LiquidAssets | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadTreasuryAccountSummaries()
      .then((summaries) => {
        if (!cancelled) setData(summaries)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load account summaries',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}
