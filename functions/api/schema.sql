CREATE TABLE IF NOT EXISTS verses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_color TEXT DEFAULT '#7B5EA7',
  icon_letter TEXT,
  icon_image_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sub_series (
  id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon_color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  sub_series_id TEXT REFERENCES sub_series(id) ON DELETE SET NULL,
  is_oc INTEGER DEFAULT 1,
  is_au INTEGER DEFAULT 0,
  au_source_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  full_name TEXT,
  aliases TEXT,
  pronouns TEXT,
  age TEXT,
  age_note TEXT,
  species TEXT,
  nationality TEXT,
  occupation TEXT,
  height TEXT,
  weight TEXT,
  hair_color TEXT,
  hair_style TEXT,
  eye_color TEXT,
  skin_tone TEXT,
  body_type TEXT,
  distinguishing_features TEXT,
  style_and_fashion TEXT,
  appearance_notes TEXT,
  reference_image_url TEXT,
  personality_summary TEXT,
  personality_traits TEXT,
  likes TEXT,
  dislikes TEXT,
  fears TEXT,
  desires TEXT,
  habits TEXT,
  quirks TEXT,
  core_wound TEXT,
  defense_mechanisms TEXT,
  love_language TEXT,
  biggest_fear TEXT,
  deepest_desire TEXT,
  power_origin TEXT,
  power_origin_details TEXT,
  alignment TEXT,
  moral_notes TEXT,
  symbolic_color TEXT,
  symbolic_animal TEXT,
  symbolic_element TEXT,
  symbolic_celestial TEXT,
  symbolic_flower TEXT,
  symbolic_number TEXT,
  symbolic_tarot TEXT,
  backstory TEXT,
  early_life TEXT,
  defining_moments TEXT,
  secrets TEXT,
  narrative_role TEXT,
  character_arc_stage TEXT,
  aesthetic_vibe TEXT,
  contradictions TEXT,
  affiliations TEXT,
  notable_quotes TEXT,
  source_fandom TEXT,
  source_character_name TEXT,
  voice_claim TEXT,
  playlist_url TEXT,
  tags TEXT,
  notes TEXT,
  profile_completion INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS character_relationships (
  id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  character_a_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  character_b_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  dynamic_label TEXT,
  dynamic_description TEXT,
  emotional_closeness REAL DEFAULT 0,
  conflict_level REAL DEFAULT 0,
  trust REAL DEFAULT 0,
  romantic_tension REAL DEFAULT 0,
  power_imbalance REAL DEFAULT 0,
  narrative_importance REAL DEFAULT 5,
  loyalty REAL DEFAULT 0,
  dependency REAL DEFAULT 0,
  fear_factor REAL DEFAULT 0,
  shared_history_weight REAL DEFAULT 0,
  respect_level REAL DEFAULT 0,
  unspoken_tension REAL DEFAULT 0,
  evolution_notes TEXT,
  arc_stage TEXT,
  tags TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(character_a_id, character_b_id)
);

CREATE TABLE IF NOT EXISTS lore_entries (
  id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  sub_series_id TEXT REFERENCES sub_series(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  tags TEXT,
  linked_character_ids TEXT,
  linked_lore_ids TEXT,
  is_pinned INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS writing_pieces (
  id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  sub_series_id TEXT REFERENCES sub_series(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'short-story',
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  status TEXT DEFAULT 'draft',
  word_count INTEGER DEFAULT 0,
  tags TEXT,
  linked_character_ids TEXT,
  linked_lore_ids TEXT,
  is_pinned INTEGER DEFAULT 0,
  reading_order INTEGER,
  content_warnings TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  writing_piece_id TEXT NOT NULL REFERENCES writing_pieces(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  chapter_number INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verse_map_nodes (
  id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,
  entry_id TEXT,
  label TEXT NOT NULL,
  x_position REAL DEFAULT 0,
  y_position REAL DEFAULT 0,
  color TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verse_map_connections (
  id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL REFERENCES verse_map_nodes(id) ON DELETE CASCADE,
  target_node_id TEXT NOT NULL REFERENCES verse_map_nodes(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL,
  label TEXT,
  description TEXT,
  is_directed INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  verse_id TEXT REFERENCES verses(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  previous_conversation_id TEXT REFERENCES ai_conversations(id) ON DELETE SET NULL,
  summary TEXT,
  total_messages INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  provider_used TEXT,
  model_used TEXT,
  is_context_limit_reached INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER DEFAULT 0,
  provider TEXT,
  model TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS writing_guidelines (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  file_size INTEGER,
  is_active INTEGER DEFAULT 1,
  content_preview TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  verse_id TEXT REFERENCES verses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#7B5EA7',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tag_assignments (
  id TEXT PRIMARY KEY,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS story_arcs (
  id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  sub_series_id TEXT REFERENCES sub_series(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planned',
  sort_order INTEGER DEFAULT 0,
  linked_writing_ids TEXT,
  linked_character_ids TEXT,
  tags TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS foreshadowing_entries (
  id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  planted_in TEXT,
  payoff_in TEXT,
  status TEXT DEFAULT 'planted',
  notes TEXT,
  linked_writing_ids TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS headcanons (
  id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL REFERENCES verses(id) ON DELETE CASCADE,
  character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  canon_status TEXT DEFAULT 'soft',
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS version_history (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  version_label TEXT,
  snapshot TEXT NOT NULL,
  change_notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_characters_verse ON characters(verse_id);
CREATE INDEX IF NOT EXISTS idx_characters_sub_series ON characters(sub_series_id);
CREATE INDEX IF NOT EXISTS idx_characters_au_source ON characters(au_source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_verse ON character_relationships(verse_id);
CREATE INDEX IF NOT EXISTS idx_relationships_char_a ON character_relationships(character_a_id);
CREATE INDEX IF NOT EXISTS idx_relationships_char_b ON character_relationships(character_b_id);
CREATE INDEX IF NOT EXISTS idx_lore_verse ON lore_entries(verse_id);
CREATE INDEX IF NOT EXISTS idx_writing_verse ON writing_pieces(verse_id);
CREATE INDEX IF NOT EXISTS idx_chapters_piece ON chapters(writing_piece_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_entity ON tag_assignments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_version_history_entity ON version_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_verse_map_nodes_verse ON verse_map_nodes(verse_id);
CREATE INDEX IF NOT EXISTS idx_headcanons_character ON headcanons(character_id);
