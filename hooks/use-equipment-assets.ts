'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  fetchEquipmentAssets,
  type EquipmentMake,
  type EquipmentModel,
} from '@/lib/assets/equipment-api'

export function useEquipmentAssets() {
  const [makes, setMakes] = useState<EquipmentMake[]>([])
  const [models, setModels] = useState<EquipmentModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    const data = await fetchEquipmentAssets()
    setMakes(data.makes)
    setModels(data.models)
    return data
  }, [])

  useEffect(() => {
    let cancelled = false

    reload()
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load equipment data')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reload])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load equipment data')
      throw err
    } finally {
      setLoading(false)
    }
  }, [reload])

  return { makes, models, loading, error, refresh }
}
