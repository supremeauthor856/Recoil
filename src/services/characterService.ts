import { db } from './db'
import { Character } from '../shared/types/database'

export async function getCharacters(filters?: { verseId?: string; subSeriesId?: string }): Promise<Character[]> {
  if (filters?.verseId && filters?.subSeriesId) {
    return await db.characters.where({ verse_id: filters.verseId, sub_series_id: filters.subSeriesId }).toArray()
  } else if (filters?.verseId) {
    return await db.characters.where('verse_id').equals(filters.verseId).toArray()
  } else if (filters?.subSeriesId) {
    return await db.characters.where('sub_series_id').equals(filters.subSeriesId).toArray()
  }
  return await db.characters.toArray()
}

export async function getCharacter(id: string): Promise<Character> {
  const char = await db.characters.get(id)
  if (!char) throw new Error('Character not found')
  return char
}

export async function createCharacter(data: { verse_id: string; name: string; is_oc?: boolean }): Promise<string> {
  const id = crypto.randomUUID()
  const now = Date.now()
  const newChar = {
    ...data,
    id,
    created_at: now,
    updated_at: now,
    role: '',
    description: '',
    species: '',
    age: '',
  }
  await db.characters.add(newChar as any)
  return id
}

export async function updateCharacter(id: string, data: Partial<Character> & Record<string, any>): Promise<void> {
  const toUpdate = { ...data, updated_at: Date.now() }
  // Serialize arrays if any exist
  for (const [key, value] of Object.entries(toUpdate)) {
    if (Array.isArray(value)) {
      toUpdate[key] = JSON.stringify(value) as any
    }
  }
  await db.characters.update(id, toUpdate as any)
}

export function calculateProfileCompletion(character: Record<string, any>): number {
  const fieldsToCheck = [
    'name', 'full_name', 'pronouns', 'age', 'species', 'nationality', 'occupation',
    'height', 'weight', 'hair_color', 'hair_style', 'eye_color', 'skin_tone', 'body_type',
    'distinguishing_features', 'style_and_fashion', 'appearance_notes', 'personality_summary',
    'personality_traits', 'likes', 'dislikes', 'fears', 'desires', 'habits', 'quirks',
    'core_wound', 'love_language', 'deepest_desire', 'biggest_fear', 'power_origin',
    'power_origin_details', 'alignment', 'backstory', 'early_life', 'defining_moments',
    'narrative_role', 'character_arc_stage', 'aesthetic_vibe', 'contradictions',
    'affiliations', 'notable_quotes', 'notes'
  ]

  let filledCount = 0
  for (const field of fieldsToCheck) {
    const value = character[field]
    if (value === null || value === undefined) continue
    if (typeof value === 'string') {
      if (value.trim().length > 0) filledCount++
    } else if (Array.isArray(value)) {
      if (value.length > 0) filledCount++
    } else if (typeof value === 'object') {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value
        if (Array.isArray(parsed) && parsed.length > 0) filledCount++
        else if (Object.keys(parsed).length > 0) filledCount++
      } catch {
        // ignore
      }
    } else {
      filledCount++
    }
  }

  return Math.round((filledCount / fieldsToCheck.length) * 100)
}

