import { useState, useEffect, useMemo, useCallback } from 'react'
import { loreService } from '../../../services/loreService'
import { LoreEntry, LoreCategory, LoreFilters, LORE_CATEGORIES } from '../types'

export function useLoreEntries(
  verseId: string | null,
  initialCategory: LoreCategory | 'all' = 'all'
) {
  const [entries, setEntries] = useState<LoreEntry[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  const [filters, setFilters] = useState<LoreFilters>({
    category: initialCategory,
    subSeriesId: 'all',
    search: '',
    pinned: false,
    sortBy: 'sort-order',
  })

  const fetchEntries = useCallback(async () => {
    if (!verseId) {
      setEntries([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await loreService.getEntries(verseId)
      setEntries(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lore entries')
    } finally {
      setLoading(false)
    }
  }, [verseId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const filteredEntries = useMemo(() => {
    let list = [...entries]

    // 1. If filters.pinned: only pinned entries
    if (filters.pinned) {
      list = list.filter(e => e.is_pinned)
    }

    // 2. If filters.category !== 'all': filter by category
    if (filters.category !== 'all') {
      list = list.filter(e => e.category === filters.category)
    }

    // 3. If filters.subSeriesId !== 'all': filter by sub_series_id
    if (filters.subSeriesId !== 'all') {
      list = list.filter(e => e.sub_series_id === filters.subSeriesId)
    }

    // 4. If filters.search: case-insensitive filter by title and summary
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase().trim()
      list = list.filter(
        e =>
          (e.title && e.title.toLowerCase().includes(query)) ||
          (e.summary && e.summary.toLowerCase().includes(query))
      )
    }

    // 5. Sort by filters.sortBy
    list.sort((a, b) => {
      // 6. Pinned entries always sorted before unpinned within any sort mode
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1

      if (filters.sortBy === 'updated') {
        return b.updated_at - a.updated_at
      }
      if (filters.sortBy === 'alpha') {
        return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
      }
      if (filters.sortBy === 'category') {
        const catA = LORE_CATEGORIES.indexOf(a.category)
        const catB = LORE_CATEGORIES.indexOf(b.category)
        if (catA !== catB) return catA - catB
        return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
      }
      if (filters.sortBy === 'sort-order') {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order
        }
        return b.updated_at - a.updated_at
      }
      return 0
    })

    return list
  }, [entries, filters])

  const createEntry = useCallback(
    async (data: { title: string; category: LoreCategory; sub_series_id?: string | null; summary?: string; content?: string }) => {
      if (!verseId) throw new Error('No active verse')
      const newEntry = await loreService.createEntry({ ...data, verse_id: verseId })
      setEntries(prev => [newEntry, ...prev])
      fetchEntries()
      return newEntry
    },
    [verseId, fetchEntries]
  )

  const updateEntry = useCallback(
    async (id: string, updates: Partial<LoreEntry>) => {
      setEntries(prev =>
        prev.map(e => (e.id === id ? { ...e, ...updates } as LoreEntry : e))
      )
      const updated = await loreService.updateEntry(id, updates)
      setEntries(prev => prev.map(e => (e.id === id ? updated : e)))
      return updated
    },
    []
  )

  const deleteEntry = useCallback(
    async (id: string) => {
      const success = await loreService.deleteEntry(id)
      if (success) {
        setEntries(prev => prev.filter(e => e.id !== id))
      }
      return success
    },
    []
  )

  const togglePin = useCallback(
    async (id: string, isPinned: boolean) => {
      setEntries(prev =>
        prev.map(e => (e.id === id ? { ...e, is_pinned: isPinned } as LoreEntry : e))
      )
      const updated = await loreService.togglePin(id, isPinned)
      setEntries(prev => prev.map(e => (e.id === id ? updated : e)))
      return updated
    },
    []
  )

  return {
    entries,
    filteredEntries,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    togglePin,
  }
}
