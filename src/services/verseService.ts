import { db } from './db'
import {
  Verse,
  SubSeries,
  VerseStats,
  RecentActivityItem,
  CreateVerseInput,
  CreateSubSeriesInput,
} from '../features/verse/types'

export async function getVerses(): Promise<Verse[]> {
  return await db.verses.orderBy('updated_at').reverse().toArray()
}

export async function getVerse(id: string): Promise<Verse | null> {
  const verse = await db.verses.get(id)
  return verse || null
}

export async function getVerseStats(id: string): Promise<VerseStats> {
  const [characterCount, writingCount, subSeriesCount] = await Promise.all([
    db.characters.where('verse_id').equals(id).count(),
    db.writing_pieces.where('verse_id').equals(id).count(),
    db.sub_series.where('verse_id').equals(id).count()
  ])
  
  const writings = await db.writing_pieces.where('verse_id').equals(id).toArray()
  const totalWordCount = writings.reduce((sum, w) => sum + (w.word_count || 0), 0)

  return {
    characterCount,
    loreCount: 0,
    writingCount,
    subSeriesCount,
    conversationCount: 0,
    totalWordCount
  }
}

export async function getRecentActivity(id: string): Promise<RecentActivityItem[]> {
  const chars = await db.characters.where('verse_id').equals(id).toArray()
  const writings = await db.writing_pieces.where('verse_id').equals(id).toArray()
  const subSeries = await db.sub_series.where('verse_id').equals(id).toArray()
  const subMap = new Map(subSeries.map(s => [s.id, s.name]))
  
  const recentItems: RecentActivityItem[] = [
    ...chars.map(c => ({ id: c.id, name: c.name, type: 'character' as const, updated_at: c.updated_at, sub_series_name: c.sub_series_id ? subMap.get(c.sub_series_id) : undefined })),
    ...writings.map(w => ({ id: w.id, name: w.title, type: 'writing' as const, updated_at: w.updated_at, sub_series_name: w.sub_series_id ? subMap.get(w.sub_series_id) : undefined }))
  ]
  
  return recentItems.sort((a, b) => b.updated_at - a.updated_at).slice(0, 5)
}

export async function createVerse(data: CreateVerseInput): Promise<Verse> {
  const now = Date.now()
  const verse: Verse = {
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description || null,
    icon_color: data.icon_color || '#7B5EA7',
    icon_letter: data.icon_letter || data.name.charAt(0).toUpperCase(),
    icon_image_url: null,
    genre: data.genre || 'General Fiction',
    canon_strictness: data.canon_strictness || 'Strict Canon',
    magic_system: data.magic_system || 'Non-Magical',
    narrative_tone: data.narrative_tone || 'Balanced',
    target_audience: data.target_audience || 'Teen 13+',
    era_tech_level: data.era_tech_level || 'Modern Day',
    seed_starter_worldbuilding: data.seed_starter_worldbuilding ?? true,
    primary_faction_name: data.primary_faction_name || '',
    visibility_privacy: data.visibility_privacy || 'Private Draft',
    created_at: now,
    updated_at: now,
    sort_order: 0
  }
  await db.verses.add(verse)

  // Auto-seed primary faction if specified
  if (data.primary_faction_name?.trim()) {
    await db.sub_series.add({
      id: crypto.randomUUID(),
      verse_id: verse.id,
      name: data.primary_faction_name.trim(),
      description: `Primary governing faction or central organization in ${verse.name}.`,
      icon_color: verse.icon_color,
      sort_order: 0,
      created_at: now,
      updated_at: now,
    })
  }

  // Auto-seed starter worldbuilding articles if checked
  if (data.seed_starter_worldbuilding) {
    await db.writing_pieces.bulkAdd([
      {
        id: crypto.randomUUID(),
        verse_id: verse.id,
        sub_series_id: null,
        title: `Core Rules & Cosmic Principles of ${verse.name}`,
        summary: `Essential laws governing magic (${verse.magic_system}), physics, and society in the ${verse.genre} era.`,
        content: `<p>Welcome to <strong>${verse.name}</strong>!</p><p>This verse operates under a <strong>${verse.canon_strictness}</strong> framework with a <strong>${verse.narrative_tone}</strong> tone, set in a <strong>${verse.era_tech_level}</strong> environment.</p>`,
        type: 'lore-article',
        status: 'draft',
        word_count: 45,
        tags: [verse.genre, verse.magic_system],
        linked_character_ids: [],
        linked_lore_ids: [],
        is_pinned: true,
        reading_order: 1,
        content_warnings: [],
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        verse_id: verse.id,
        sub_series_id: null,
        title: `Historical Timeline Overview (${verse.era_tech_level})`,
        summary: `Key historical epochs, conflicts, and pivotal turning points leading to the current era.`,
        content: `<p>A chronological record of significant milestones and ancient sagas in <strong>${verse.name}</strong>.</p>`,
        type: 'lore-article',
        status: 'draft',
        word_count: 20,
        tags: [verse.era_tech_level],
        linked_character_ids: [],
        linked_lore_ids: [],
        is_pinned: false,
        reading_order: 2,
        content_warnings: [],
        created_at: now,
        updated_at: now,
      }
    ])
  }

  return verse
}

export async function updateVerse(id: string, data: Partial<Verse>): Promise<Verse> {
  await db.verses.update(id, { ...data, updated_at: Date.now() })
  const updated = await db.verses.get(id)
  return updated!
}

export async function deleteVerse(id: string): Promise<boolean> {
  await db.verses.delete(id)
  return true
}

export async function getSubSeries(verseId: string): Promise<SubSeries[]> {
  return await db.sub_series.where('verse_id').equals(verseId).toArray()
}

export async function getSubSeriesById(id: string): Promise<SubSeries | null> {
  const sub = await db.sub_series.get(id)
  return sub || null
}

export async function createSubSeries(data: CreateSubSeriesInput): Promise<SubSeries> {
  const now = Date.now()
  const sub: SubSeries = {
    id: crypto.randomUUID(),
    verse_id: data.verse_id,
    name: data.name,
    description: data.description,
    icon_color: data.icon_color || '#7B5EA7',
    created_at: now,
    updated_at: now,
    sort_order: 0
  }
  await db.sub_series.add(sub)
  return sub
}

export async function updateSubSeries(id: string, data: Partial<SubSeries>): Promise<SubSeries> {
  await db.sub_series.update(id, { ...data, updated_at: Date.now() })
  const updated = await db.sub_series.get(id)
  return updated!
}

export async function deleteSubSeries(id: string): Promise<boolean> {
  await db.sub_series.delete(id)
  return true
}
