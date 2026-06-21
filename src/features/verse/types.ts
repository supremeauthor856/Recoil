export interface Verse {
  id: string
  name: string
  description: string | null
  icon_color: string
  icon_letter: string | null
  icon_image_url: string | null
  created_at: number
  updated_at: number
  sort_order: number
}

export interface SubSeries {
  id: string
  verse_id: string
  name: string
  description: string | null
  icon_color: string | null
  sort_order: number
  created_at: number
  updated_at: number
}

export interface VerseStats {
  characterCount: number
  loreCount: number
  writingCount: number
  subSeriesCount: number
  conversationCount: number
  totalWordCount: number
}

export interface RecentActivityItem {
  id: string
  type: 'character' | 'lore' | 'writing'
  name: string
  updated_at: number
  sub_series_name: string | null
}

export type CreateVerseInput = {
  name: string
  description?: string
  icon_color?: string
  icon_letter?: string
}

export type CreateSubSeriesInput = {
  verse_id: string
  name: string
  description?: string
  icon_color?: string
}

export const PRESET_ICON_COLORS = [
  '#7B5EA7',
  '#4F8AF4',
  '#B97AFF',
  '#FF6B9D',
  '#F87171',
  '#FB923C',
  '#FBBF24',
  '#4ADE80',
  '#FFD166',
  '#60A5FA',
  '#A855F7',
  '#E879F9',
  '#06B6D4',
  '#14B8A6',
  '#84CC16',
  '#F43F5E',
] as const
