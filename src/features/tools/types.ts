export type ForeshadowingStatus = 'planted' | 'pending-payoff' | 'resolved'

export interface ForeshadowingEntry {
  id: string
  verse_id: string
  description: string
  planted_in: string | null
  payoff_in: string | null
  status: ForeshadowingStatus
  notes: string | null
  linked_writing_ids: string[]
  created_at: number
  updated_at: number
}

export const FORESHADOWING_STATUSES: ForeshadowingStatus[] = [
  'planted', 'pending-payoff', 'resolved'
]

export const FORESHADOWING_STATUS_LABELS: Record<ForeshadowingStatus, string> = {
  planted: 'Planted',
  'pending-payoff': 'Pending Payoff',
  resolved: 'Resolved',
}

export const FORESHADOWING_STATUS_COLORS: Record<ForeshadowingStatus, string> = {
  planted: 'var(--color-accent-secondary)',
  'pending-payoff': 'var(--color-warning)',
  resolved: 'var(--color-success)',
}

export type ArcStatus = 'planned' | 'in-progress' | 'written' | 'complete'

export interface StoryArc {
  id: string
  verse_id: string
  sub_series_id: string | null
  title: string
  description: string | null
  status: ArcStatus
  sort_order: number
  linked_writing_ids: string[]
  linked_character_ids: string[]
  tags: string[]
  created_at: number
  updated_at: number
}

export const ARC_STATUSES: ArcStatus[] = [
  'planned', 'in-progress', 'written', 'complete'
]

export const ARC_STATUS_LABELS: Record<ArcStatus, string> = {
  planned: 'Planned',
  'in-progress': 'In Progress',
  written: 'Written',
  complete: 'Complete',
}

export const ARC_STATUS_COLORS: Record<ArcStatus, string> = {
  planned: 'var(--color-text-muted)',
  'in-progress': 'var(--color-accent-secondary)',
  written: 'var(--color-accent-primary)',
  complete: 'var(--color-success)',
}

export type CanonStatus = 'official-canon' | 'headcanon' | 'non-canon' | 'fanon-alternate' | 'just-an-idea' | 'confirmed-canon' | 'soft-headcanon' | 'denied' | 'undecided'

export interface Headcanon {
  id: string
  verse_id: string
  character_id: string | null
  content: string
  canon_status: CanonStatus
  notes: string | null
  tags?: string[]
  created_at: number
  updated_at: number
  // Client-only — enriched after fetch
  character_name?: string
}

export const CANON_STATUSES: CanonStatus[] = [
  'official-canon', 'headcanon', 'non-canon', 'fanon-alternate', 'just-an-idea'
]

export const CANON_STATUS_LABELS: Record<CanonStatus, string> = {
  'official-canon': 'Official Canon',
  'headcanon': 'Headcanon',
  'non-canon': 'Non-Canon / AU',
  'fanon-alternate': 'Fanon / Alternate',
  'just-an-idea': 'Just an Idea',
  'confirmed-canon': 'Official Canon',
  'soft-headcanon': 'Headcanon',
  denied: 'Non-Canon',
  undecided: 'Just an Idea',
}

export const CANON_STATUS_COLORS: Record<CanonStatus, string> = {
  'official-canon': '#10B981', // Emerald green
  'headcanon': '#3B82F6', // Blue
  'non-canon': '#EF4444', // Red
  'fanon-alternate': '#8B5CF6', // Purple
  'just-an-idea': '#F59E0B', // Amber
  'confirmed-canon': '#10B981',
  'soft-headcanon': '#3B82F6',
  denied: '#EF4444',
  undecided: '#F59E0B',
}

export interface PlotHoleIssue {
  type: 'contradiction' | 'inconsistency' | 'plot-hole' | 'character-inconsistency' | 'lore-conflict'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  affectedContent: string[]
  suggestion: string
}

export interface PlotHoleAnalysis {
  issues: PlotHoleIssue[]
  summary: string
  analysisDate: number
  contextUsed: {
    characterCount: number
    loreEntryCount: number
    writingCount: number
  }
}
