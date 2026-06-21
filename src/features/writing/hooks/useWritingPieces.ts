import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { WritingPiece, WritingFilters, WRITING_TYPES } from '../types'
import * as writingService from '../../../services/writingService'

export function useWritingPieces(verseId: string) {
  const [pieces, setPieces] = useState<WritingPiece[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchParams] = useSearchParams()
  const urlTypeParam = searchParams.get('type')
  const initialType = urlTypeParam && WRITING_TYPES.includes(urlTypeParam as any) ? (urlTypeParam as any) : 'all'

  const [filters, setFilters] = useState<WritingFilters>({
    type: initialType,
    status: 'all',
    subSeriesId: 'all',
    search: '',
    sortBy: 'updated',
    pinned: false,
  })

  // Keep type filter in sync with search params updates
  useEffect(() => {
    const freshType = searchParams.get('type')
    if (freshType && WRITING_TYPES.includes(freshType as any)) {
      setFilters((prev) => ({ ...prev, type: freshType as any }))
    } else if (!freshType) {
      setFilters((prev) => ({ ...prev, type: 'all' }))
    }
  }, [searchParams])

  const fetchPieces = useCallback(async () => {
    if (!verseId) return
    setLoading(true)
    setError(null)
    try {
      const data = await writingService.getWritingPieces(verseId)
      setPieces(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch writing pieces')
    } finally {
      setLoading(false)
    }
  }, [verseId])

  useEffect(() => {
    fetchPieces()
  }, [fetchPieces])

  const filteredPieces = useMemo(() => {
    let result = [...pieces]

    if (filters.pinned) {
      result = result.filter((p) => p.is_pinned)
    }

    if (filters.type !== 'all') {
      result = result.filter((p) => p.type === filters.type)
    }

    if (filters.status !== 'all') {
      result = result.filter((p) => p.status === filters.status)
    }

    if (filters.subSeriesId !== 'all') {
      result = result.filter((p) => p.sub_series_id === filters.subSeriesId)
    }

    if (filters.search.trim()) {
      const query = filters.search.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          (p.summary && p.summary.toLowerCase().includes(query)) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Sorting
    result.sort((a, b) => {
      // Pinned always on top if not specifically sorting by something overriding it
      if (filters.sortBy !== 'title' && filters.sortBy !== 'reading-order') {
        const pinA = a.is_pinned ? 1 : 0
        const pinB = b.is_pinned ? 1 : 0
        if (pinA !== pinB) {
          return pinB - pinA
        }
      }

      if (filters.sortBy === 'title') {
        return a.title.localeCompare(b.title)
      } else if (filters.sortBy === 'word-count') {
        return b.word_count - a.word_count
      } else if (filters.sortBy === 'status') {
        return a.status.localeCompare(b.status)
      } else if (filters.sortBy === 'reading-order') {
        const orderA = a.reading_order ?? Infinity
        const orderB = b.reading_order ?? Infinity
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return b.updated_at - a.updated_at
      } else {
        // default 'updated'
        return b.updated_at - a.updated_at
      }
    })

    return result
  }, [pieces, filters])

  return {
    pieces,
    filteredPieces,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchPieces,
  }
}
