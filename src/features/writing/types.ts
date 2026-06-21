export type WritingType =
  | 'novel'
  | 'short-story'
  | 'scene'
  | 'drabble'
  | 'dialogue'
  | 'lore-article'
  | 'essay'
  | 'outline'

export type WritingStatus =
  | 'draft'
  | 'in-progress'
  | 'complete'
  | 'abandoned'
  | 'on-hold'

export type ChapterStatus = 'draft' | 'in-progress' | 'complete'

export interface WritingPiece {
  id: string
  verse_id: string
  sub_series_id: string | null
  type: WritingType
  title: string
  summary: string | null
  content: string | null       // HTML from TipTap — null for novels (content lives in chapters)
  status: WritingStatus
  word_count: number
  tags: string[]
  linked_character_ids: string[]
  linked_lore_ids: string[]
  is_pinned: boolean
  reading_order: number | null
  content_warnings: string[]
  created_at: number
  updated_at: number
}

export interface Chapter {
  id: string
  writing_piece_id: string
  title: string | null
  content: string | null       // HTML from TipTap
  chapter_number: number
  word_count: number
  status: ChapterStatus
  notes: string | null
  created_at: number
  updated_at: number
}

export type CreateWritingInput = {
  verse_id: string
  type: WritingType
  title: string
  sub_series_id?: string | null
  summary?: string
}

export type CreateChapterInput = {
  writing_piece_id: string
  title?: string
  chapter_number: number
}

export const WRITING_TYPES: WritingType[] = [
  'novel','short-story','scene','drabble',
  'dialogue','lore-article','essay','outline'
]

export const WRITING_TYPE_LABELS: Record<WritingType, string> = {
  novel: 'Novel',
  'short-story': 'Short Story',
  scene: 'Scene',
  drabble: 'Drabble',
  dialogue: 'Dialogue',
  'lore-article': 'Lore Article',
  essay: 'Essay',
  outline: 'Outline',
}

export const WRITING_STATUSES: WritingStatus[] = [
  'draft','in-progress','complete','abandoned','on-hold'
]

export const WRITING_STATUS_LABELS: Record<WritingStatus, string> = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  complete: 'Complete',
  abandoned: 'Abandoned',
  'on-hold': 'On Hold',
}

export const WRITING_TYPE_COLORS: Record<WritingType, string> = {
  novel: 'var(--color-accent-primary)',
  'short-story': 'var(--color-accent-secondary)',
  scene: 'var(--color-accent-highlight)',
  drabble: 'var(--color-rel-friendship)',
  dialogue: 'var(--color-rel-mentor)',
  'lore-article': 'var(--color-rel-family)',
  essay: 'var(--color-rel-loyalty)',
  outline: 'var(--color-text-muted)',
}

export const WRITING_STATUS_COLORS: Record<WritingStatus, string> = {
  draft: 'var(--color-text-muted)',
  'in-progress': 'var(--color-accent-secondary)',
  complete: 'var(--color-success)',
  abandoned: 'var(--color-error)',
  'on-hold': 'var(--color-warning)',
}

export interface WritingFilters {
  type: WritingType | 'all'
  status: WritingStatus | 'all'
  subSeriesId: string | 'all'
  search: string
  sortBy: 'title' | 'updated' | 'word-count' | 'status' | 'reading-order'
  pinned: boolean
}
