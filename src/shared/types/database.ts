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

export interface Character {
  id: string
  verse_id: string
  sub_series_id?: string | null
  name: string
  role?: string | null
  description?: string | null
  avatar_url?: string | null
  reference_image_url?: string | null
  species?: string | null
  age?: string | null
  created_at?: number
  updated_at?: number
}
