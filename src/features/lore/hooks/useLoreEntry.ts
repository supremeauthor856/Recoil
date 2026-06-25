import { useState, useEffect, useRef, useCallback } from 'react'
import { loreService } from '../../../services/loreService'
import { getCharacter } from '../../../services/characterService'
import { LoreEntry } from '../types'
import { Character } from '../../../shared/types/database'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useLoreEntry(id: string | null) {
  const [entry, setEntry] = useState<LoreEntry | null>(null)
  const [linkedCharacters, setLinkedCharacters] = useState<Character[]>([])
  const [linkedLore, setLinkedLore] = useState<LoreEntry[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const entryRef = useRef<LoreEntry | null>(null)
  entryRef.current = entry

  const fetchAllDetails = useCallback(async (currentEntry: LoreEntry) => {
    const charIds = currentEntry.linked_character_ids?.slice(0, 8) ?? []
    if (charIds.length > 0) {
      try {
        const chars = await Promise.all(
          charIds.map(cid => getCharacter(cid).catch(() => null))
        )
        setLinkedCharacters(chars.filter((c): c is Character => c !== null))
      } catch (err) {
        console.error('Failed to fetch linked characters', err)
      }
    } else {
      setLinkedCharacters([])
    }

    const loreIds = currentEntry.linked_lore_ids?.slice(0, 8) ?? []
    if (loreIds.length > 0) {
      try {
        const lores = await Promise.all(
          loreIds.map(lid => loreService.getEntry(lid).catch(() => null))
        )
        setLinkedLore(lores.filter((l): l is LoreEntry => l !== null))
      } catch (err) {
        console.error('Failed to fetch linked lore', err)
      }
    } else {
      setLinkedLore([])
    }
  }, [])

  const fetchEntry = useCallback(async () => {
    if (!id) {
      setEntry(null)
      setLinkedCharacters([])
      setLinkedLore([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await loreService.getEntry(id)
      if (data) {
        setEntry(data)
        await fetchAllDetails(data)
      } else {
        setError('Lore entry not found')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lore entry')
    } finally {
      setLoading(false)
    }
  }, [id, fetchAllDetails])

  useEffect(() => {
    fetchEntry()
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [fetchEntry])

  const saveEntryChanges = useCallback(async (currentId: string, updates: Partial<LoreEntry>) => {
    setSaveStatus('saving')
    try {
      const updated = await loreService.updateEntry(currentId, updates)
      setSaveStatus('saved')
      if (updates.linked_character_ids || updates.linked_lore_ids) {
        await fetchAllDetails(updated)
      }
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to save lore entry changes', err)
      setSaveStatus('error')
    }
  }, [fetchAllDetails])

  const updateField = useCallback((field: keyof LoreEntry, value: any) => {
    if (!id || !entryRef.current) return

    const updatedEntry = { ...entryRef.current, [field]: value } as LoreEntry
    setEntry(updatedEntry)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    setSaveStatus('saving')
    debounceTimerRef.current = setTimeout(() => {
      saveEntryChanges(id, { [field]: value })
    }, 1500)
  }, [id, saveEntryChanges])

  const updateArrayField = useCallback((field: 'tags' | 'linked_character_ids' | 'linked_lore_ids', value: string[]) => {
    updateField(field, value)
  }, [updateField])

  return {
    entry,
    linkedCharacters,
    linkedLore,
    loading,
    saveStatus,
    error,
    updateField,
    updateArrayField,
    refetch: fetchEntry,
  }
}
