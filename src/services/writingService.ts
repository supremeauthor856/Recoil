import { db } from './db'
import {
  WritingPiece,
  Chapter,
  CreateWritingInput,
  CreateChapterInput
} from '../features/writing/types'

function parseJsonArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val as string) } catch { return [] }
}

export function parseWritingPiece(raw: any): WritingPiece {
  return {
    ...raw,
    tags: parseJsonArray(raw.tags),
    linked_character_ids: parseJsonArray(raw.linked_character_ids),
    linked_lore_ids: parseJsonArray(raw.linked_lore_ids),
    content_warnings: parseJsonArray(raw.content_warnings),
    is_pinned: raw.is_pinned === 1 || raw.is_pinned === true || raw.is_pinned === '1',
  } as unknown as WritingPiece
}

export function serializeWritingPiece(piece: Partial<WritingPiece>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...piece as any }
  const arrayFields = ['tags','linked_character_ids','linked_lore_ids','content_warnings']
  for (const field of arrayFields) {
    if (Array.isArray(result[field])) result[field] = JSON.stringify(result[field])
  }
  if (typeof result.is_pinned === 'boolean') result.is_pinned = result.is_pinned ? 1 : 0
  return result
}

export async function getWritingPieces(verseId: string): Promise<WritingPiece[]> {
  const raws = await db.writing_pieces.where('verse_id').equals(verseId).toArray()
  return raws.map(parseWritingPiece)
}

export async function getWritingPiece(id: string): Promise<WritingPiece | null> {
  try {
    const raw = await db.writing_pieces.get(id)
    if (!raw) return null
    return parseWritingPiece(raw)
  } catch {
    return null
  }
}

export async function createWritingPiece(data: CreateWritingInput): Promise<WritingPiece> {
  const id = crypto.randomUUID()
  const now = Date.now()
  const raw = {
    ...data,
    id,
    type: data.type || 'short-story',
    status: 'draft',
    word_count: 0,
    is_pinned: 0,
    created_at: now,
    updated_at: now,
  } as any
  const serialized = serializeWritingPiece(raw) as any
  await db.writing_pieces.add(serialized)
  return parseWritingPiece(serialized)
}

export async function updateWritingPiece(id: string, data: Partial<WritingPiece>): Promise<WritingPiece> {
  const serialized = serializeWritingPiece(data)
  await db.writing_pieces.update(id, { ...serialized, updated_at: Date.now() })
  const updated = await db.writing_pieces.get(id)
  return parseWritingPiece(updated)
}

export async function deleteWritingPiece(id: string): Promise<boolean> {
  await db.writing_pieces.delete(id)
  return true
}

export async function getChapters(writingPieceId: string): Promise<Chapter[]> {
  return await db.chapters.where('writing_piece_id').equals(writingPieceId).sortBy('chapter_number')
}

export async function getChapter(id: string): Promise<Chapter | null> {
  try {
    const chap = await db.chapters.get(id)
    return chap || null
  } catch {
    return null
  }
}

export async function createChapter(data: CreateChapterInput): Promise<Chapter> {
  const id = crypto.randomUUID()
  const now = Date.now()
  
  // Find highest chapter number
  const existing = await getChapters(data.writing_piece_id)
  const maxChapter = existing.length > 0 ? Math.max(...existing.map(c => c.chapter_number)) : 0
  
  const chap: Chapter = {
    ...data,
    title: data.title || null,
    id,
    chapter_number: maxChapter + 1,
    status: 'draft',
    word_count: 0,
    content: null,
    notes: null,
    created_at: now,
    updated_at: now,
  }
  await db.chapters.add(chap)
  return chap
}

export async function updateChapter(id: string, data: Partial<Chapter>): Promise<Chapter> {
  await db.chapters.update(id, { ...data, updated_at: Date.now() })
  const updated = await db.chapters.get(id)
  return updated!
}

export async function deleteChapter(id: string): Promise<boolean> {
  await db.chapters.delete(id)
  return true
}

export async function reorderChapters(chapterIds: string[]): Promise<boolean> {
  // Simple reordering transaction
  await db.transaction('rw', db.chapters, async () => {
    for (let i = 0; i < chapterIds.length; i++) {
        await db.chapters.update(chapterIds[i], {
            chapter_number: i + 1,
            updated_at: Date.now()
        });
    }
  });
  return true
}

export function countWords(html: string): number {
  if (!html) return 0
  // Strip HTML tags, collapse whitespace, split on spaces, filter out empty, return length.
  const text = html.replace(/<[^>]*>/g, ' ')
  const collapsed = text.replace(/\s+/g, ' ').trim()
  if (!collapsed) return 0
  return collapsed.split(' ').length
}
