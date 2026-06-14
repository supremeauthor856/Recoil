export type Insert<T> = Omit<T, Extract<keyof T, 'id' | 'created_at' | 'updated_at'>> & Partial<Pick<T, Extract<keyof T, 'id' | 'created_at' | 'updated_at'>>>

export interface Verse {
  id: string
  name: string
  description?: string | null
  icon_color: string
  icon_letter?: string | null
  icon_image_url?: string | null
  created_at: number
  updated_at: number
  sort_order: number
}

export interface SubSeries {
  id: string
  verse_id: string
  name: string
  description?: string | null
  icon_color?: string | null
  sort_order: number
  created_at: number
  updated_at: number
}

export interface Character {
  id: string
  verse_id: string
  sub_series_id?: string | null
  is_oc: number // boolean
  is_au: number // boolean
  au_source_id?: string | null
  name: string
  full_name?: string | null
  aliases?: string | null // JSON array
  pronouns?: string | null
  age?: string | null
  age_note?: string | null
  species?: string | null
  nationality?: string | null
  occupation?: string | null
  height?: string | null
  weight?: string | null
  hair_color?: string | null
  hair_style?: string | null
  eye_color?: string | null
  skin_tone?: string | null
  body_type?: string | null
  distinguishing_features?: string | null
  style_and_fashion?: string | null
  appearance_notes?: string | null
  reference_image_url?: string | null
  personality_summary?: string | null
  personality_traits?: string | null // JSON array
  likes?: string | null // JSON array
  dislikes?: string | null // JSON array
  fears?: string | null // JSON array
  desires?: string | null // JSON array
  habits?: string | null // JSON array
  quirks?: string | null // JSON array
  core_wound?: string | null
  defense_mechanisms?: string | null
  love_language?: string | null
  biggest_fear?: string | null
  deepest_desire?: string | null
  power_origin?: string | null
  power_origin_details?: string | null
  alignment?: string | null
  moral_notes?: string | null
  symbolic_color?: string | null
  symbolic_animal?: string | null
  symbolic_element?: string | null
  symbolic_celestial?: string | null
  symbolic_flower?: string | null
  symbolic_number?: string | null
  symbolic_tarot?: string | null
  backstory?: string | null
  early_life?: string | null
  defining_moments?: string | null
  secrets?: string | null
  narrative_role?: string | null
  character_arc_stage?: string | null
  aesthetic_vibe?: string | null
  contradictions?: string | null
  affiliations?: string | null // JSON array
  notable_quotes?: string | null // JSON array
  source_fandom?: string | null
  source_character_name?: string | null
  voice_claim?: string | null
  playlist_url?: string | null
  tags?: string | null // JSON array
  notes?: string | null
  profile_completion: number
  created_at: number
  updated_at: number
  sort_order: number
}

export interface CharacterRelationship {
  id: string
  verse_id: string
  character_a_id: string
  character_b_id: string
  relationship_type: string
  dynamic_label?: string | null
  dynamic_description?: string | null
  emotional_closeness: number
  conflict_level: number
  trust: number
  romantic_tension: number
  power_imbalance: number
  narrative_importance: number
  loyalty: number
  dependency: number
  fear_factor: number
  shared_history_weight: number
  respect_level: number
  unspoken_tension: number
  evolution_notes?: string | null
  arc_stage?: string | null
  tags?: string | null // JSON array
  created_at: number
  updated_at: number
}

export interface LoreEntry {
  id: string
  verse_id: string
  sub_series_id?: string | null
  category: string
  title: string
  content?: string | null
  summary?: string | null
  tags?: string | null // JSON array
  linked_character_ids?: string | null // JSON array
  linked_lore_ids?: string | null // JSON array
  is_pinned: number // boolean
  created_at: number
  updated_at: number
  sort_order: number
}

export interface WritingPiece {
  id: string
  verse_id: string
  sub_series_id?: string | null
  type: string
  title: string
  summary?: string | null
  content?: string | null
  status: string
  word_count: number
  tags?: string | null // JSON array
  linked_character_ids?: string | null // JSON array
  linked_lore_ids?: string | null // JSON array
  is_pinned: number // boolean
  reading_order?: number | null
  content_warnings?: string | null // JSON array
  created_at: number
  updated_at: number
}

export interface Chapter {
  id: string
  writing_piece_id: string
  title?: string | null
  content?: string | null
  chapter_number: number
  word_count: number
  status: string
  notes?: string | null
  created_at: number
  updated_at: number
}

export interface VerseMapNode {
  id: string
  verse_id: string
  entry_type: string
  entry_id?: string | null
  label: string
  x_position: number
  y_position: number
  color?: string | null
  notes?: string | null
  created_at: number
  updated_at: number
}

export interface VerseMapConnection {
  id: string
  verse_id: string
  source_node_id: string
  target_node_id: string
  connection_type: string
  label?: string | null
  description?: string | null
  is_directed: number // boolean
  created_at: number
  updated_at: number
}

export interface AiConversation {
  id: string
  verse_id?: string | null
  title?: string | null
  description?: string | null
  previous_conversation_id?: string | null
  summary?: string | null
  total_messages: number
  total_tokens_used: number
  provider_used?: string | null
  model_used?: string | null
  is_context_limit_reached: number // boolean
  created_at: number
  updated_at: number
}

export interface AiMessage {
  id: string
  conversation_id: string
  role: string
  content: string
  token_count: number
  provider?: string | null
  model?: string | null
  created_at: number
}

export interface WritingGuideline {
  id: string
  filename: string
  display_name: string
  category: string
  r2_key: string
  file_size?: number | null
  is_active: number // boolean
  content_preview?: string | null
  created_at: number
  updated_at: number
}

export interface Tag {
  id: string
  verse_id?: string | null
  name: string
  color: string
  created_at: number
}

export interface TagAssignment {
  id: string
  tag_id: string
  entity_type: string
  entity_id: string
  created_at: number
}

export interface StoryArc {
  id: string
  verse_id: string
  sub_series_id?: string | null
  title: string
  description?: string | null
  status: string
  sort_order: number
  linked_writing_ids?: string | null // JSON array
  linked_character_ids?: string | null // JSON array
  tags?: string | null // JSON array
  created_at: number
  updated_at: number
}

export interface ForeshadowingEntry {
  id: string
  verse_id: string
  description: string
  planted_in?: string | null
  payoff_in?: string | null
  status: string
  notes?: string | null
  linked_writing_ids?: string | null // JSON array
  created_at: number
  updated_at: number
}

export interface Headcanon {
  id: string
  verse_id: string
  character_id?: string | null
  content: string
  canon_status: string
  notes?: string | null
  created_at: number
  updated_at: number
}

export interface VersionHistory {
  id: string
  entity_type: string
  entity_id: string
  version_label?: string | null
  snapshot: string
  change_notes?: string | null
  created_at: number
}

export interface Setting {
  key: string
  value: string
  updated_at: number
}
