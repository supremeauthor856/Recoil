import { useState, useEffect, useCallback } from 'react'
import { Verse, CreateVerseInput } from '../types'
import * as verseService from '../../../services/verseService'

export function useVerses() {
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await verseService.getVerses()
      setVerses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch verses')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const createVerse = useCallback(async (input: CreateVerseInput) => {
    try {
      const newVerse = await verseService.createVerse(input)
      await refetch()
      return newVerse
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create verse')
    }
  }, [refetch])

  const deleteVerse = useCallback(async (id: string) => {
    try {
      await verseService.deleteVerse(id)
      await refetch()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete verse')
    }
  }, [refetch])

  return {
    verses,
    loading,
    error,
    refetch,
    createVerse,
    deleteVerse,
  }
}
