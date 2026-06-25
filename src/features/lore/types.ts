export type LoreCategory =
  | 'world-rules'
  | 'history'
  | 'faction'
  | 'location'
  | 'concept'
  | 'item'
  | 'event'
  | 'creature'
  | 'technology'
  | 'culture'
  | 'other'

export const LORE_CATEGORIES: LoreCategory[] = [
  'world-rules', 'history', 'faction', 'location',
  'concept', 'item', 'event', 'creature', 'technology', 'culture', 'other',
]

export const LORE_CATEGORY_LABELS: Record<LoreCategory, string> = {
  'world-rules': 'World Rules',
  history: 'History',
  faction: 'Faction',
  location: 'Location',
  concept: 'Concept',
  item: 'Item / Artifact',
  event: 'Event',
  creature: 'Creature',
  technology: 'Technology',
  culture: 'Culture',
  other: 'Other',
}

export const LORE_CATEGORY_COLORS: Record<LoreCategory, string> = {
  'world-rules': '#7B5EA7',
  history: '#FBBF24',
  faction: '#F87171',
  location: '#4ADE80',
  concept: '#60A5FA',
  item: '#FB923C',
  event: '#E879F9',
  creature: '#FF6B9D',
  technology: '#4F8AF4',
  culture: '#FFD166',
  other: '#6B7280',
}

// Categories that appear in the Timeline view
export const TIMELINE_CATEGORIES: LoreCategory[] = ['event', 'history']

// Categories that appear in the Glossary view
export const GLOSSARY_CATEGORIES: LoreCategory[] = [
  'concept', 'world-rules', 'creature', 'item', 'technology',
]

export interface LoreEntry {
  id: string
  verse_id: string
  sub_series_id: string | null
  category: LoreCategory
  title: string
  content: string | null          // TipTap HTML
  summary: string | null
  tags: string[]
  linked_character_ids: string[]
  linked_lore_ids: string[]
  is_pinned: boolean
  created_at: number
  updated_at: number
  sort_order: number
}

export type CreateLoreInput = {
  verse_id: string
  title: string
  category: LoreCategory
  sub_series_id?: string | null
  summary?: string
  content?: string
}

export interface LoreFilters {
  category: LoreCategory | 'all'
  subSeriesId: string | 'all'
  search: string
  pinned: boolean
  sortBy: 'updated' | 'alpha' | 'category' | 'sort-order'
}

export type LoreView = 'grid' | 'list' | 'timeline' | 'glossary'

// Sidebar groupings — maps sidebar item labels to category filters
export const SIDEBAR_LORE_GROUPS: { label: string; categories: LoreCategory[]; icon: string }[] = [
  { label: 'Timeline', categories: TIMELINE_CATEGORIES, icon: 'Clock' },
  { label: 'Glossary', categories: GLOSSARY_CATEGORIES, icon: 'BookOpen' },
  { label: 'Factions & Groups', categories: ['faction'], icon: 'Shield' },
  { label: 'Concepts & Rules', categories: ['concept', 'world-rules'], icon: 'Lightbulb' },
]
