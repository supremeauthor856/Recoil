import { useState, useEffect, useCallback } from 'react'
import { Character } from '../../../shared/types/database'
import { CharacterRelationship, CreateRelationshipInput } from '../types'
import { getCharacters } from '../../../services/characterService'
import * as relService from '../../../services/relationshipService'

export function useRelationships(verseId: string) {
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!verseId) return
    setLoading(true)
    setError(null)
    try {
      const [charsData, relsData] = await Promise.all([
        getCharacters({ verseId }),
        relService.getRelationships(verseId),
      ])
      setCharacters(charsData || [])
      setRelationships(relsData || [])
    } catch (err: unknown) {
      console.error('Error fetching relationships data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch relationships data')
    } finally {
      setLoading(false)
    }
  }, [verseId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const createRelationship = async (data: CreateRelationshipInput) => {
    try {
      const newRel = await relService.createRelationship(data)
      await fetchData()
      return newRel
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create relationship'
      throw new Error(errMsg)
    }
  }

  const updateRelationship = async (id: string, data: Partial<CharacterRelationship>) => {
    try {
      const updatedRel = await relService.updateRelationship(id, data)
      // Optimistic update or just update local state direct to avoid full flash, but let's do local update then fetch
      setRelationships((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updatedRel } : r))
      )
      return updatedRel
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update relationship'
      throw new Error(errMsg)
    }
  }

  const deleteRelationship = async (id: string) => {
    try {
      const success = await relService.deleteRelationship(id)
      if (success) {
        setRelationships((prev) => prev.filter((r) => r.id !== id))
      }
      return success
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to delete relationship'
      throw new Error(errMsg)
    }
  }

  return {
    relationships,
    characters,
    loading,
    error,
    refetch: fetchData,
    createRelationship,
    updateRelationship,
    deleteRelationship,
  }
}
