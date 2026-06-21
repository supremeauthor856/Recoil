import { db } from './db'
import { CharacterRelationship, CreateRelationshipInput } from '../features/relationships/types'

function parseRelationship(raw: any): CharacterRelationship {
  return {
    ...raw,
    tags: (() => {
      if (!raw.tags) return []
      if (Array.isArray(raw.tags)) return raw.tags
      try {
        return JSON.parse(raw.tags as string)
      } catch {
        return []
      }
    })(),
  } as CharacterRelationship
}

function serializeRelationship(rel: Partial<CharacterRelationship>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...rel as any }
  if (Array.isArray(result.tags)) {
    result.tags = JSON.stringify(result.tags)
  }
  return result
}

export async function getRelationships(verseId: string): Promise<CharacterRelationship[]> {
  const rawList = await db.character_relationships.where('verse_id').equals(verseId).toArray()
  return rawList.map(parseRelationship)
}

export async function getCharacterRelationships(characterId: string): Promise<CharacterRelationship[]> {
  const relsA = await db.character_relationships.where('character_a_id').equals(characterId).toArray()
  const relsB = await db.character_relationships.where('character_b_id').equals(characterId).toArray()
  const map = new Map()
  for (const rel of [...relsA, ...relsB]) map.set(rel.id, rel)
  return Array.from(map.values()).map(parseRelationship)
}

export async function getRelationship(id: string): Promise<CharacterRelationship | null> {
  try {
    const raw = await db.character_relationships.get(id)
    if (!raw) return null
    return parseRelationship(raw)
  } catch {
    return null
  }
}

export async function createRelationship(data: CreateRelationshipInput): Promise<CharacterRelationship> {
  const id = crypto.randomUUID()
  const now = Date.now()
  const raw = {
    ...data,
    id,
    created_at: now,
    updated_at: now,
    emotional_closeness: 0,
    conflict_level: 0,
    trust: 0,
    romantic_tension: 0,
    power_imbalance: 0,
    narrative_importance: 5,
    loyalty: 0,
    dependency: 0,
    fear_factor: 0,
    shared_history_weight: 0,
    respect_level: 0,
    unspoken_tension: 0,
  } as any
  const serialized = serializeRelationship(raw) as any
  await db.character_relationships.add(serialized)
  return parseRelationship(serialized)
}

export async function updateRelationship(
  id: string,
  data: Partial<CharacterRelationship>
): Promise<CharacterRelationship> {
  const serialized = serializeRelationship(data)
  await db.character_relationships.update(id, { ...serialized, updated_at: Date.now() })
  const updated = await db.character_relationships.get(id)
  return parseRelationship(updated)
}

export async function deleteRelationship(id: string): Promise<boolean> {
  try {
    await db.character_relationships.delete(id)
    return true
  } catch {
    return false
  }
}

export function calculateLinkThickness(rel: CharacterRelationship): number {
  // Collect absolute values of all bipolar dimensions (emotional_closeness through unspoken_tension).
  const bipolarKeys: (keyof CharacterRelationship)[] = [
    'emotional_closeness',
    'conflict_level',
    'trust',
    'romantic_tension',
    'power_imbalance',
    'loyalty',
    'dependency',
    'fear_factor',
    'respect_level',
    'unspoken_tension',
  ]

  const bipolarValues = bipolarKeys.map((key) => Math.abs((rel[key] as number) || 0))

  // Also include narrative_importance/2 and shared_history_weight/2 (normalizing 0-10 to 0-5)
  const unipolarValues = [
    ((rel.narrative_importance as number) || 0) / 2,
    ((rel.shared_history_weight as number) || 0) / 2,
  ]

  const allValues = [...bipolarValues, ...unipolarValues]

  // Filter out zeros
  const nonZeros = allValues.filter((v) => v > 0)
  if (nonZeros.length === 0) return 1

  // Average the non-zero values
  const sum = nonZeros.reduce((acc, val) => acc + val, 0)
  const avg = sum / nonZeros.length

  // Map that average from 0–5 range to 1–5px range: thickness = 1 + (avg / 5) * 4
  const thickness = 1 + (avg / 5) * 4
  return Math.round(thickness * 10) / 10
}
