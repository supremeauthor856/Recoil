import { useState, useEffect, useCallback } from 'react'
import { Verse, SubSeries, VerseStats, RecentActivityItem } from '../types'
import * as verseService from '../../../services/verseService'

export function useVerse(verseId: string | null) {
  const [verse, setVerse] = useState<Verse | null>(null)
  const [stats, setStats] = useState<VerseStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [subSeries, setSubSeries] = useState<SubSeries[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const refetchSubSeries = useCallback(async () => {
    if (!verseId) return
    try {
      const subData = await verseService.getSubSeries(verseId)
      setSubSeries(subData)
    } catch (err) {
      console.error('Failed to refetch sub-series:', err)
    }
  }, [verseId])

  const refetch = useCallback(async () => {
    if (!verseId) {
      setVerse(null)
      setStats(null)
      setRecentActivity([])
      setSubSeries([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [verseData, statsData, recentData, subData] = await Promise.all([
        verseService.getVerse(verseId),
        verseService.getVerseStats(verseId).catch(() => ({
          characterCount: 0,
          loreCount: 0,
          writingCount: 0,
          subSeriesCount: 0,
          conversationCount: 0,
          totalWordCount: 0,
        })),
        verseService.getRecentActivity(verseId).catch(() => []),
        verseService.getSubSeries(verseId).catch(() => []),
      ])

      if (!verseData) {
        setError('Verse not found')
        setVerse(null)
      } else {
        setVerse(verseData)
        setStats(statsData)
        setRecentActivity(recentData)
        setSubSeries(subData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch verse details')
    } finally {
      setLoading(false)
    }
  }, [verseId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    verse,
    stats,
    recentActivity,
    subSeries,
    loading,
    error,
    refetch,
    refetchSubSeries,
  }
}
