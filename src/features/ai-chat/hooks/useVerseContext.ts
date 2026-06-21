import { useState, useEffect, useCallback } from 'react'
import { getVerse } from '../../../services/verseService'
import { getCharacters } from '../../../services/characterService'
import { getRelationships } from '../../../services/relationshipService'
import type { VerseContextPackage } from '../types'

export function useVerseContext(verseId: string | null, previousSummariesArray: string[] = []) {
  const [contextPackage, setContextPackage] = useState<VerseContextPackage | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const previousSummariesStr = JSON.stringify(previousSummariesArray)

  const loadContext = useCallback(async () => {
    if (!verseId) {
      setContextPackage(null)
      return
    }
    setIsLoading(true)
    try {
      const [verse, characters, relationships] = await Promise.all([
        getVerse(verseId),
        getCharacters({ verseId }),
        getRelationships(verseId),
      ])

      const verseOverview = verse
        ? `VERSE IDENTITY:\nName: ${verse.name}\nDescription: ${verse.description || 'No description provided'}`
        : 'No verse overview active.'

      const characterSummaries = characters.length > 0
        ? characters
            .map(
              (c) =>
                `- ${c.name}: ${c.role || 'Supporting Character'}${
                  c.description ? ` (${c.description})` : ''
                }`
            )
            .join('\n')
        : 'No characters registered yet.'

      const detailedProfiles = characters.length > 0
        ? characters
            .map((c) => {
              return `CHARACTER PROFILE: ${c.name}\nRole: ${c.role || ''}\nDescription: ${
                c.description || ''
              }\nSpecies: ${c.species || ''}\nAge: ${c.age || ''}`
            })
            .join('\n\n')
        : 'No detailed character profiles.'

      // Build character ID to name map
      const charMap = new Map(characters.map((c) => [c.id, c.name]))
      const relationshipSummary = relationships.length > 0
        ? relationships
            .map((r) => {
              const nameA = charMap.get(r.character_a_id) || `Unknown (${r.character_a_id})`
              const nameB = charMap.get(r.character_b_id) || `Unknown (${r.character_b_id})`
              const tags = Array.isArray(r.tags) ? r.tags.join(', ') : ''
              return `- ${nameA} & ${nameB}: Connection: ${r.relationship_type || ''}${
                tags ? ` [Tags: ${tags}]` : ''
              } (Closeness: ${r.emotional_closeness}, Conflict: ${r.conflict_level}, Trust: ${r.trust})`
            })
            .join('\n')
        : 'No character relationships mapped.'

      const parsedSummaries = JSON.parse(previousSummariesStr) as string[]
      const previousSummaries = parsedSummaries.length > 0
        ? parsedSummaries
            .map((s, idx) => `SUMMARY OF LOGS SEGMENT ${idx + 1}:\n${s}`)
            .join('\n\n')
        : 'No historical context summaries available.'

      const fullString = [
        verseOverview,
        characterSummaries,
        detailedProfiles,
        relationshipSummary,
        previousSummaries,
      ].join('\n\n')

      setContextPackage({
        verseOverview,
        characterSummaries,
        detailedProfiles,
        relationshipSummary,
        previousSummaries,
        totalEstimatedChars: fullString.length,
      })
    } catch (err) {
      console.error('Failed to aggregate verse context:', err)
    } finally {
      setIsLoading(false)
    }
  }, [verseId, previousSummariesStr])

  useEffect(() => {
    loadContext()
  }, [loadContext])

  return {
    contextPackage,
    isLoading,
    refreshContext: loadContext,
  }
}
