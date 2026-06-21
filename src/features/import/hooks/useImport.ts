import { useState, useEffect, useCallback } from 'react'
import { api } from '../../../services/api'
import { requestAI } from '../../../services/aiService'
import * as characterService from '../../../services/characterService'
import * as relationshipService from '../../../services/relationshipService'
import * as writingService from '../../../services/writingService'
import { Character } from '../../../shared/types/database'
import {
  ImportStatus,
  ImportFileType,
  ExtractionResult,
  ImportSummary,
  ExtractedCharacter,
  ExtractedLoreEntry,
  ExtractedRelationship,
  ExtractedWritingPiece,
  ItemInclusionStatus,
  RecoilBackupFile,
  isRecoilBackup,
} from '../types'

const EXTRACTION_SYSTEM_PROMPT = `You are a data extraction engine for a creative writing tool. Your ONLY job is to analyze the provided text and extract structured data about fictional characters, world lore, relationships, and story content.

You MUST respond with ONLY a valid JSON object. No text before or after. No markdown code fences. No explanation. Just raw JSON.

Extract every character, every piece of lore, every relationship between characters, and every story or scene you can identify. Be thorough. Include information that is implied as well as explicitly stated. If a field cannot be determined, omit it entirely from the JSON (never include null, "unknown", or empty string values).

The JSON must follow this exact structure:
{
  "characters": [
    {
      "name": "...",
      "full_name": "...",
      "pronouns": "...",
      "age": "...",
      "species": "...",
      "nationality": "...",
      "occupation": "...",
      "height": "...",
      "weight": "...",
      "hair_color": "...",
      "hair_style": "...",
      "eye_color": "...",
      "skin_tone": "...",
      "body_type": "...",
      "distinguishing_features": "...",
      "style_and_fashion": "...",
      "appearance_notes": "...",
      "personality_summary": "...",
      "personality_traits": ["..."],
      "likes": ["..."],
      "dislikes": ["..."],
      "fears": ["..."],
      "desires": ["..."],
      "habits": ["..."],
      "quirks": ["..."],
      "core_wound": "...",
      "love_language": "...",
      "deepest_desire": "...",
      "biggest_fear": "...",
      "power_origin": "...",
      "power_origin_details": "...",
      "alignment": "...",
      "backstory": "...",
      "early_life": "...",
      "defining_moments": "...",
      "narrative_role": "...",
      "character_arc_stage": "...",
      "aesthetic_vibe": "...",
      "contradictions": ["..."],
      "affiliations": ["..."],
      "notable_quotes": ["..."],
      "notes": "..."
    }
  ],
  "lore_entries": [
    {
      "title": "...",
      "category": "...",
      "content": "...",
      "summary": "..."
    }
  ],
  "relationships": [
    {
      "character_a_name": "...",
      "character_b_name": "...",
      "relationship_type": "...",
      "dynamic_label": "...",
      "dynamic_description": "..."
    }
  ],
  "writing_pieces": [
    {
      "title": "...",
      "type": "...",
      "summary": "...",
      "content": "..."
    }
  ],
  "extraction_notes": "..."
}

Valid values for lore category: world-rules, history, faction, location, concept, item, event, creature, technology, culture, other
Valid values for narrative_role: Protagonist, Antagonist, Supporting, Foil, Catalyst, Wildcard, Mirror, Mentor, Comic Relief, Love Interest, Other
Valid values for character_arc_stage: Origin, Rising, Peak, Falling, Redemption, Post-Arc, Unknown
Valid values for relationship_type: romantic, friendship, rivalry, family, mentor, acquaintance, enemy, neutral, complex, loyalty, fear, unspoken
Valid values for writing type: novel, short-story, scene, drabble, dialogue, lore-article, essay, outline

The extraction_notes field is optional — only include it if there is something important to tell the user about the extraction (e.g., "The document appears to be a story excerpt — I extracted character details from implied characterization.")

If you find no characters, no lore, no relationships, and no writing, return: {"characters":[],"lore_entries":[],"relationships":[],"writing_pieces":[]}`

const EXTRACTION_USER_PROMPT = (text: string) =>
  `Analyze this text and extract all character, lore, relationship, and story data:\n\n${text}`

function generateId(): string {
  return crypto.randomUUID()
}

function convertBackupToExtraction(backup: RecoilBackupFile): ExtractionResult {
  const characters = ((backup.characters || []) as Record<string, any>[]).map(c => {
    const parsed: Record<string, any> = {}
    const arrayFields = [
      'aliases', 'personality_traits', 'likes', 'dislikes', 'fears', 'desires',
      'habits', 'quirks', 'defense_mechanisms', 'contradictions', 'affiliations',
      'notable_quotes', 'tags'
    ]
    for (const [k, v] of Object.entries(c)) {
      if (arrayFields.includes(k) && typeof v === 'string') {
        try { parsed[k] = JSON.parse(v) } catch { parsed[k] = [] }
      } else {
        parsed[k] = v
      }
    }
    return {
      ...parsed,
      _id: generateId(),
      _status: 'included' as ItemInclusionStatus,
    } as ExtractedCharacter
  })

  const lore_entries = ((backup.loreEntries || []) as Record<string, any>[]).map(l => ({
    title: l.title as string,
    category: l.category as string,
    content: l.content as string,
    summary: l.summary as string,
    _id: generateId(),
    _status: 'included' as ItemInclusionStatus,
  }))

  const charIdToName = new Map<string, string>()
  characters.forEach(c => {
    if (c.id && c.name) {
      charIdToName.set(c.id, c.name)
    }
  })

  const relationships = ((backup.relationships || []) as Record<string, any>[]).map(r => {
    const nameA = charIdToName.get(r.character_a_id) || r.character_a_id
    const nameB = charIdToName.get(r.character_b_id) || r.character_b_id
    return {
      character_a_name: nameA,
      character_b_name: nameB,
      relationship_type: r.relationship_type as string,
      dynamic_label: r.dynamic_label as string,
      dynamic_description: r.dynamic_description as string,
      _id: generateId(),
      _status: 'included' as ItemInclusionStatus,
      _resolvedCharacterAId: r.character_a_id as string,
      _resolvedCharacterBId: r.character_b_id as string,
    }
  })

  const writing_pieces = ((backup.writingPieces || []) as Record<string, any>[]).map(w => ({
    title: w.title as string,
    type: w.type as string,
    summary: w.summary as string,
    content: w.content as string,
    _id: generateId(),
    _status: 'included' as ItemInclusionStatus,
  }))

  return {
    characters,
    lore_entries,
    relationships,
    writing_pieces,
    extractionNotes: `Recoil backup file detected. Contains ${characters.length} characters, ${lore_entries.length} lore entries, ${relationships.length} relationships, ${writing_pieces.length} writing pieces. No AI extraction needed.`,
  }
}

export function useImport(verseId: string) {
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileType, setFileType] = useState<ImportFileType | null>(null)
  const [fileWarning, setFileWarning] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [rawAIResponse, setRawAIResponse] = useState<string | null>(null)
  const [existingCharacters, setExistingCharacters] = useState<Character[]>([])
  const [duplicates, setDuplicates] = useState<Map<string, string>>(new Map())
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [isBackup, setIsBackup] = useState(false)
  const [importedSoFar, setImportedSoFar] = useState({ chars: 0, lore: 0, rels: 0, writing: 0 })

  // 1. Fetch existing characters for duplicate detection
  const loadExistingCharacters = useCallback(async () => {
    if (!verseId) return
    try {
      const chars = await characterService.getCharacters({ verseId })
      setExistingCharacters(chars)
    } catch (err) {
      console.error('Error fetching existing characters:', err)
    }
  }, [verseId])

  useEffect(() => {
    loadExistingCharacters()
  }, [loadExistingCharacters])

  // 2. File Received
  const onFileReceived = useCallback((result: { text: string; fileType: ImportFileType; fileName: string; warning?: string }) => {
    setFileContent(result.text)
    setFileName(result.fileName)
    setFileType(result.fileType)
    setFileWarning(result.warning ?? null)
    setExtractionError(null)
    setRawAIResponse(null)

    if (result.fileType === 'json') {
      try {
        const parsed = JSON.parse(result.text)
        if (isRecoilBackup(parsed)) {
          setIsBackup(true)
          const backupExtr = convertBackupToExtraction(parsed)
          
          // Run duplicate detection on backup characters
          const dupMap = new Map<string, string>()
          const normalizedExisting = existingCharacters.map(c => ({
            id: c.id,
            name: c.name.trim().toLowerCase(),
          }))

          backupExtr.characters.forEach(char => {
            const normalizedExtrName = char.name.trim().toLowerCase()
            const match = normalizedExisting.find(c => c.name === normalizedExtrName)
            if (match) {
              char._status = 'duplicate'
              char._duplicateMatchId = match.id
              dupMap.set(normalizedExtrName, match.id)
            }
          })

          setDuplicates(dupMap)
          setExtraction(backupExtr)
          setStatus('reviewing')
          return
        }
      } catch {
        // Carry on to plain text treatment since it isn't valid backup JSON
      }
    }

    setIsBackup(false)
    setStatus('reviewing') // Wait for user to trigger extraction
  }, [existingCharacters])

  // 3. AI Extract
  const extract = useCallback(async () => {
    if (!fileContent) return
    setStatus('extracting')
    setExtractionError(null)
    setRawAIResponse(null)

    try {
      const res = await requestAI({
        taskType: 'importAutoFill',
        systemPrompt: EXTRACTION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: EXTRACTION_USER_PROMPT(fileContent) }],
        maxTokens: 8000,
        injectGuidelines: false,
      })

      if (res.error) {
        setExtractionError(res.error)
        setStatus('error')
        return
      }

      setRawAIResponse(res.content)
      let cleaned = res.content.trim()

      // Clean markdown fencing
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim()
      }

      // Handle JSON cleanliness
      cleaned = cleaned.replace(/,\s*}/g, '}')
      cleaned = cleaned.replace(/,\s*\]/g, ']')

      let parsed: any = null
      try {
        parsed = JSON.parse(cleaned)
      } catch (err1: any) {
        // Fallback: extract the inner json block
        const firstIdx = cleaned.indexOf('{')
        const lastIdx = cleaned.lastIndexOf('}')
        if (firstIdx !== -1 && lastIdx !== -1 && lastIdx > firstIdx) {
          const fallbackStr = cleaned.slice(firstIdx, lastIdx + 1)
            .replace(/,\s*}/g, '}')
            .replace(/,\s*\]/g, ']')
          try {
            parsed = JSON.parse(fallbackStr)
          } catch (err2) {
            setExtractionError(`Failed to parse AI extraction response. JSON structure is invalid. Original Parse Exception: ${err1.message}`)
            setStatus('error')
            return
          }
        } else {
          setExtractionError(`Failed to parse AI extraction response. Could not identify any JSON block. Original Parse Exception: ${err1.message}`)
          setStatus('error')
          return
        }
      }

      // Validate parsed object
      const hasContent = parsed && (
        Array.isArray(parsed.characters) ||
        Array.isArray(parsed.lore_entries) ||
        Array.isArray(parsed.relationships) ||
        Array.isArray(parsed.writing_pieces)
      )

      if (!hasContent) {
        setExtractionError('The AI returned no valid character, lore, or writing collections. Please ensure your file describes some fictional elements.')
        setStatus('error')
        return
      }

      const characters = Array.isArray(parsed.characters) ? parsed.characters : []
      const lore_entries = Array.isArray(parsed.lore_entries) ? parsed.lore_entries : []
      const relationships = Array.isArray(parsed.relationships) ? parsed.relationships : []
      const writing_pieces = Array.isArray(parsed.writing_pieces) ? parsed.writing_pieces : []

      // Give client IDs & default status
      const mappedChars = characters.map((c: any) => ({
        ...c,
        _id: generateId(),
        _status: 'included' as ItemInclusionStatus,
      }))

      const mappedLore = lore_entries.map((l: any) => ({
        ...l,
        _id: generateId(),
        _status: 'included' as ItemInclusionStatus,
      }))

      const mappedRelationships = relationships.map((r: any) => ({
        ...r,
        _id: generateId(),
        _status: 'included' as ItemInclusionStatus,
      }))

      const mappedWritings = writing_pieces.map((w: any) => ({
        ...w,
        _id: generateId(),
        _status: 'included' as ItemInclusionStatus,
      }))

      // Run duplicate detection
      const dupMap = new Map<string, string>()
      const normalizedExisting = existingCharacters.map(c => ({
        id: c.id,
        name: c.name.trim().toLowerCase(),
      }))

      mappedChars.forEach((char: ExtractedCharacter) => {
        const normalizedName = char.name.trim().toLowerCase()
        const match = normalizedExisting.find(c => c.name === normalizedName)
        if (match) {
          char._status = 'duplicate'
          char._duplicateMatchId = match.id
          dupMap.set(normalizedName, match.id)
        }
      })

      setDuplicates(dupMap)
      setExtraction({
        characters: mappedChars,
        lore_entries: mappedLore,
        relationships: mappedRelationships,
        writing_pieces: mappedWritings,
        extractionNotes: parsed.extraction_notes || parsed.extractionNotes || undefined,
      })
      setStatus('reviewing')

    } catch (err: any) {
      setExtractionError(`An unexpected exception occurred during AI extraction: ${err.message}`)
      setStatus('error')
    }
  }, [fileContent, existingCharacters])

  // 4. Toggle Item
  const toggleItem = useCallback((type: 'characters' | 'lore_entries' | 'relationships' | 'writing_pieces', id: string) => {
    if (!extraction) return
    const updated = { ...extraction }
    const items = updated[type] as any[]
    const itemIndex = items.findIndex(i => i._id === id)
    if (itemIndex !== -1) {
      const item = items[itemIndex]
      const currentStatus = item._status
      if (currentStatus === 'included' || currentStatus === 'duplicate') {
        item._status = 'excluded'
      } else {
        if (item._duplicateMatchId) {
          item._status = 'duplicate'
        } else {
          item._status = 'included'
        }
      }
      setExtraction({ ...updated })
    }
  }, [extraction])

  // 5. Resolve Duplicate
  const resolveDuplicate = useCallback((id: string, action: 'skip' | 'update' | 'create-new') => {
    if (!extraction) return
    const updated = { ...extraction }
    const itemIndex = updated.characters.findIndex(c => c._id === id)
    if (itemIndex !== -1) {
      const character = updated.characters[itemIndex]
      if (action === 'skip') {
        character._status = 'excluded'
      } else if (action === 'update') {
        character._status = 'included'
      } else if (action === 'create-new') {
        character._status = 'included'
        delete character._duplicateMatchId
      }
      setExtraction({ ...updated })
    }
  }, [extraction])

  // 6. Start Import Execution
  const startImport = useCallback(async () => {
    if (!extraction) return
    setStatus('importing')
    setImportedSoFar({ chars: 0, lore: 0, rels: 0, writing: 0 })

    const summary: ImportSummary = {
      charactersCreated: 0,
      charactersUpdated: 0,
      charactersSkipped: 0,
      loreCreated: 0,
      loreSkipped: 0,
      relationshipsCreated: 0,
      relationshipsSkipped: 0,
      writingCreated: 0,
      writingSkipped: 0,
      errors: [],
    }

    // Name maps to resolve character links inside relationships case-insensitively
    const nameToId = new Map<string, string>()

    // Populate name maps with existing characters first
    existingCharacters.forEach(c => {
      nameToId.set(c.name.trim().toLowerCase(), c.id)
    })

    // PHASE 1: Import Characters
    const charList = extraction.characters
    let charsDone = 0
    for (const char of charList) {
      if (char._status === 'included') {
        try {
          let targetId = ''
          if (char._duplicateMatchId) {
            // Update existing character
            targetId = char._duplicateMatchId
            const { _id, _status, _duplicateMatchId, _createdId, _error, name, ...fields } = char
            await characterService.updateCharacter(targetId, fields)
            summary.charactersUpdated++
          } else {
            // Create new character
            targetId = await characterService.createCharacter({
              verse_id: verseId,
              name: char.name,
              is_oc: true,
            })
            const { _id, _status, _duplicateMatchId, _createdId, _error, name, ...fields } = char
            await characterService.updateCharacter(targetId, fields)
            
            // Re-read and calculate completion
            const reloaded = await characterService.getCharacter(targetId)
            const score = characterService.calculateProfileCompletion(reloaded)
            await characterService.updateCharacter(targetId, { profile_completion: score })

            summary.charactersCreated++
          }
          char._createdId = targetId
          // Record character name block to link relationships
          nameToId.set(char.name.trim().toLowerCase(), targetId)
        } catch (err: any) {
          char._error = err.message || 'Error saving character'
          summary.errors.push({ item: char.name, error: char._error! })
        }
      } else {
        summary.charactersSkipped++
      }
      charsDone++
      setImportedSoFar(prev => ({ ...prev, chars: charsDone }))
    }

    // PHASE 2: Import Lore Entries
    const loreList = extraction.lore_entries
    let loreDone = 0
    for (const lore of loreList) {
      if (lore._status === 'included') {
        try {
          const res = await api.post('/api/lore', {
            verse_id: verseId,
            title: lore.title,
            category: lore.category,
            content: lore.content,
            summary: lore.summary,
          })
          
          if (!res.success) {
            if (res.error?.includes('501') || res.error?.toLowerCase().includes('not yet implemented')) {
              lore._error = 'Lore system coming soon — import skipped'
              summary.loreSkipped++
            } else {
              lore._error = res.error || 'Server error'
              summary.loreSkipped++
              summary.errors.push({ item: lore.title, error: lore._error! })
            }
          } else {
            summary.loreCreated++
          }
        } catch (err: any) {
          if (String(err).includes('501') || String(err).toLowerCase().includes('not yet implemented') || String(err).includes('not found')) {
            lore._error = 'Lore system coming soon — import skipped'
            summary.loreSkipped++
          } else {
            lore._error = err.message || 'Error saving lore entry'
            summary.loreSkipped++
            summary.errors.push({ item: lore.title, error: lore._error! })
          }
        }
      } else {
        summary.loreSkipped++
      }
      loreDone++
      setImportedSoFar(prev => ({ ...prev, lore: loreDone }))
    }

    // PHASE 3: Import Relationships
    const relationshipList = extraction.relationships
    let relsDone = 0
    for (const rel of relationshipList) {
      if (rel._status === 'included') {
        try {
          // Resolve A & B
          let character_a_id = rel._resolvedCharacterAId
          let character_b_id = rel._resolvedCharacterBId

          if (!character_a_id) {
            character_a_id = nameToId.get(rel.character_a_name.trim().toLowerCase())
          }
          if (!character_b_id) {
            character_b_id = nameToId.get(rel.character_b_name.trim().toLowerCase())
          }

          if (!character_a_id || !character_b_id) {
            rel._error = 'Could not match character names to existing characters'
            summary.relationshipsSkipped++
            summary.errors.push({
              item: `${rel.character_a_name} - ${rel.character_b_name}`,
              error: rel._error!,
            })
          } else {
            await relationshipService.createRelationship({
              verse_id: verseId,
              character_a_id,
              character_b_id,
              relationship_type: rel.relationship_type as any,
              dynamic_label: rel.dynamic_label || '',
              dynamic_description: rel.dynamic_description || '',
            })
            summary.relationshipsCreated++
          }
        } catch (err: any) {
          if (err.message && (err.message.includes('409') || err.message.toLowerCase().includes('already exists'))) {
            rel._error = 'Relationship already exists'
            summary.relationshipsSkipped++
          } else {
            rel._error = err.message || 'Error saving relationship link'
            summary.relationshipsSkipped++
            summary.errors.push({
              item: `${rel.character_a_name} - ${rel.character_b_name}`,
              error: rel._error!,
            })
          }
        }
      } else {
        summary.relationshipsSkipped++
      }
      relsDone++
      setImportedSoFar(prev => ({ ...prev, rels: relsDone }))
    }

    // PHASE 4: Import Writing Pieces
    const writingList = extraction.writing_pieces
    let writingsDone = 0
    for (const piece of writingList) {
      if (piece._status === 'included') {
        try {
          const created = await writingService.createWritingPiece({
            verse_id: verseId,
            type: piece.type as any,
            title: piece.title,
            summary: piece.summary || '',
          })

          if (piece.content) {
            await writingService.updateWritingPiece(created.id, {
              content: piece.content,
              word_count: writingService.countWords(piece.content),
            })
          }
          summary.writingCreated++
        } catch (err: any) {
          piece._error = err.message || 'Error saving story piece'
          summary.writingSkipped++
          summary.errors.push({ item: piece.title, error: piece._error! })
        }
      } else {
        summary.writingSkipped++
      }
      writingsDone++
      setImportedSoFar(prev => ({ ...prev, writing: writingsDone }))
    }

    setImportSummary(summary)
    setStatus('complete')
  }, [extraction, verseId, existingCharacters])

  // 7. Reset state
  const reset = useCallback(() => {
    setStatus('idle')
    setFileContent(null)
    setFileName(null)
    setFileType(null)
    setFileWarning(null)
    setExtraction(null)
    setExtractionError(null)
    setRawAIResponse(null)
    setImportSummary(null)
    setIsBackup(false)
    setImportedSoFar({ chars: 0, lore: 0, rels: 0, writing: 0 })
  }, [])

  return {
    status,
    fileContent,
    fileName,
    fileType,
    fileWarning,
    extraction,
    extractionError,
    rawAIResponse,
    existingCharacters,
    duplicates,
    importSummary,
    isRecoilBackup: isBackup,
    importedSoFar,
    onFileReceived,
    extract,
    toggleItem,
    resolveDuplicate,
    startImport,
    reset,
  }
}
