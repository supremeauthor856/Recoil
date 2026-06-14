import Dexie, { type Table } from 'dexie'
import type {
  Verse,
  SubSeries,
  Character,
  CharacterRelationship,
  LoreEntry,
  WritingPiece,
  Chapter,
  VerseMapNode,
  VerseMapConnection,
  AiConversation,
  AiMessage,
  WritingGuideline,
  Tag,
  TagAssignment,
  StoryArc,
  ForeshadowingEntry,
  Headcanon,
  VersionHistory,
  Setting
} from '../types/database'

export class RecoilDB extends Dexie {
  verses!: Table<Verse, string>
  sub_series!: Table<SubSeries, string>
  characters!: Table<Character, string>
  character_relationships!: Table<CharacterRelationship, string>
  lore_entries!: Table<LoreEntry, string>
  writing_pieces!: Table<WritingPiece, string>
  chapters!: Table<Chapter, string>
  verse_map_nodes!: Table<VerseMapNode, string>
  verse_map_connections!: Table<VerseMapConnection, string>
  ai_conversations!: Table<AiConversation, string>
  ai_messages!: Table<AiMessage, string>
  writing_guidelines!: Table<WritingGuideline, string>
  tags!: Table<Tag, string>
  tag_assignments!: Table<TagAssignment, string>
  story_arcs!: Table<StoryArc, string>
  foreshadowing_entries!: Table<ForeshadowingEntry, string>
  headcanons!: Table<Headcanon, string>
  version_history!: Table<VersionHistory, string>
  settings!: Table<Setting, string>

  constructor() {
    super('recoil-db')
    this.version(1).stores({
      verses: 'id, name, description, icon_color, icon_letter, icon_image_url, created_at, updated_at, sort_order',
      sub_series: 'id, verse_id, name, description, icon_color, sort_order, created_at, updated_at',
      characters: 'id, verse_id, sub_series_id, is_oc, is_au, au_source_id, name, full_name, aliases, pronouns, age, age_note, species, nationality, occupation, height, weight, hair_color, hair_style, eye_color, skin_tone, body_type, distinguishing_features, style_and_fashion, appearance_notes, reference_image_url, personality_summary, personality_traits, likes, dislikes, fears, desires, habits, quirks, core_wound, defense_mechanisms, love_language, biggest_fear, deepest_desire, power_origin, power_origin_details, alignment, moral_notes, symbolic_color, symbolic_animal, symbolic_element, symbolic_celestial, symbolic_flower, symbolic_number, symbolic_tarot, backstory, early_life, defining_moments, secrets, narrative_role, character_arc_stage, aesthetic_vibe, contradictions, affiliations, notable_quotes, source_fandom, source_character_name, voice_claim, playlist_url, tags, notes, profile_completion, created_at, updated_at, sort_order',
      character_relationships: 'id, verse_id, character_a_id, character_b_id, relationship_type, dynamic_label, dynamic_description, emotional_closeness, conflict_level, trust, romantic_tension, power_imbalance, narrative_importance, loyalty, dependency, fear_factor, shared_history_weight, respect_level, unspoken_tension, evolution_notes, arc_stage, tags, created_at, updated_at',
      lore_entries: 'id, verse_id, sub_series_id, category, title, content, summary, tags, linked_character_ids, linked_lore_ids, is_pinned, created_at, updated_at, sort_order',
      writing_pieces: 'id, verse_id, sub_series_id, type, title, summary, content, status, word_count, tags, linked_character_ids, linked_lore_ids, is_pinned, reading_order, content_warnings, created_at, updated_at',
      chapters: 'id, writing_piece_id, title, content, chapter_number, word_count, status, notes, created_at, updated_at',
      verse_map_nodes: 'id, verse_id, entry_type, entry_id, label, x_position, y_position, color, notes, created_at, updated_at',
      verse_map_connections: 'id, verse_id, source_node_id, target_node_id, connection_type, label, description, is_directed, created_at, updated_at',
      ai_conversations: 'id, verse_id, title, description, previous_conversation_id, summary, total_messages, total_tokens_used, provider_used, model_used, is_context_limit_reached, created_at, updated_at',
      ai_messages: 'id, conversation_id, role, content, token_count, provider, model, created_at',
      writing_guidelines: 'id, filename, display_name, category, r2_key, file_size, is_active, content_preview, created_at, updated_at',
      tags: 'id, verse_id, name, color, created_at',
      tag_assignments: 'id, tag_id, entity_type, entity_id, created_at',
      story_arcs: 'id, verse_id, sub_series_id, title, description, status, sort_order, linked_writing_ids, linked_character_ids, tags, created_at, updated_at',
      foreshadowing_entries: 'id, verse_id, description, planted_in, payoff_in, status, notes, linked_writing_ids, created_at, updated_at',
      headcanons: 'id, verse_id, character_id, content, canon_status, notes, created_at, updated_at',
      version_history: 'id, entity_type, entity_id, version_label, snapshot, change_notes, created_at',
      settings: 'key, value, updated_at'
    })
  }
}

export const db = new RecoilDB()

export function isOffline(): boolean {
  if (typeof navigator !== 'undefined') {
    return !navigator.onLine
  }
  return false
}
