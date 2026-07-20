'use client'

import { useEffect, useState } from 'react'

import {
  fetchMrrArrMonthly,
  type MrrArrMonthlyPoint,
} from '@/lib/finance/mrr-arr-monthly'

let cachedRequest: Promise<MrrArrMonthlyPoint[]> | null = null

function loadMrrArrMonthly(): Promise<MrrArrMonthlyPoint[]> {
  if (!cachedRequest) {
    cachedRequest = fetchMrrArrMonthly().catch((error) => {
      cachedRequest = null
      throw error
    })
  }
  return cachedRequest
}

export function useMrrArrMonthly() {
  const [data, setData] = useState<MrrArrMonthlyPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadMrrArrMonthly()
      .then((series) => {
        if (!cancelled) setData(series)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load MRR & ARR data')
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
