import { useState, useEffect, useRef, useCallback } from 'react'
import type { VerseFullStats } from '../types'
import { statisticsService } from '../../../services/statisticsService'
import * as characterService from '../../../services/characterService'

interface UseVerseStatisticsResult {
  stats: VerseFullStats | null
  loading: boolean
  error: string | null
  lastRefreshed: number | null
  refetch: () => Promise<void>
}

const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export function useVerseStatistics(verseId: string | null | undefined): UseVerseStatisticsResult {
  const [stats, setStats] = useState<VerseFullStats | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null)

  const cacheRef = useRef<Record<string, { stats: VerseFullStats; timestamp: number }>>({})

  const fetchStats = useCallback(
    async (force = false) => {
      if (!verseId) {
        setStats(null)
        setLoading(false)
        setError(null)
        return
      }

      // Check cache unless forcing refresh
      const cached = cacheRef.current[verseId]
      const now = Date.now()
      if (!force && cached && now - cached.timestamp < CACHE_DURATION_MS) {
        setStats(cached.stats)
        setError(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Fetch full stats from back-end D1 endpoint
        const rawStats = await statisticsService.getFullStats(verseId)
        if (!rawStats) {
          throw new Error('No statistics payload returned from server')
        }

        // Fetch characters to calculate tag frequency client-side
        const charactersData = await characterService.getCharacters({ verseId })

        // Extract and deserialize tags safely from character entities
        const characterTagLists: string[][] = charactersData.map((c: any) => {
          if (!c.tags) return []
          if (Array.isArray(c.tags)) return c.tags as string[]
          if (typeof c.tags === 'string') {
            try {
              return JSON.parse(c.tags) as string[]
            } catch {
              // Try comma separation fallback if it isn't JSON
              if (c.tags.includes(',')) {
                return c.tags.split(',').map((t: string) => t.trim())
              }
              return [c.tags.trim()]
            }
          }
          return []
        })

        // Compute tag frequency
        const tagFreq = statisticsService.computeTagFrequency(characterTagLists)

        // Merge tags into the stats payload
        const mergedStats: VerseFullStats = {
          ...rawStats,
          tags: tagFreq,
        }

        // Store to cache
        cacheRef.current[verseId] = {
          stats: mergedStats,
          timestamp: Date.now(),
        }

        setStats(mergedStats)
        setLastRefreshed(Date.now())
      } catch (err: any) {
        console.error('Failed to load verse statistics:', err)
        setError(err.message || String(err))
      } finally {
        setLoading(false)
      }
    },
    [verseId]
  )

  useEffect(() => {
    fetchStats(false)
  }, [fetchStats])

  const refetch = useCallback(async () => {
    await fetchStats(true)
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    lastRefreshed,
    refetch,
  }
}
