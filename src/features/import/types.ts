export type ImportFileType =
  | 'txt'
  | 'md'
  | 'html'
  | 'json'
  | 'docx'
  | 'pdf'
  | 'unknown'

export type ImportStatus =
  | 'idle'
  | 'reading'
  | 'extracting'
  | 'reviewing'
  | 'importing'
  | 'complete'
  | 'error'

export type ItemInclusionStatus = 'included' | 'excluded' | 'duplicate' | 'pending'

export interface ExtractedCharacter {
  id?: string                          // optional original database ID (e.g. from Backup)
  // Extraction fields
  name: string
  full_name?: string
  pronouns?: string
  age?: string
  species?: string
  nationality?: string
  occupation?: string
  height?: string
  weight?: string
  hair_color?: string
  hair_style?: string
  eye_color?: string
  skin_tone?: string
  body_type?: string
  distinguishing_features?: string
  style_and_fashion?: string
  appearance_notes?: string
  personality_summary?: string
  personality_traits?: string[]
  likes?: string[]
  dislikes?: string[]
  fears?: string[]
  desires?: string[]
  habits?: string[]
  quirks?: string[]
  core_wound?: string
  love_language?: string
  deepest_desire?: string
  biggest_fear?: string
  power_origin?: string
  power_origin_details?: string
  alignment?: string
  backstory?: string
  early_life?: string
  defining_moments?: string
  narrative_role?: string
  character_arc_stage?: string
  aesthetic_vibe?: string
  contradictions?: string[]
  affiliations?: string[]
  notable_quotes?: string[]
  notes?: string
  // Import state (not sent to AI)
  _id: string                          // temp client-only ID
  _status: ItemInclusionStatus
  _duplicateMatchId?: string           // ID of existing character with same name
  _createdId?: string                  // ID after creation
  _error?: string
}

export interface ExtractedLoreEntry {
  title: string
  category: string
  content?: string
  summary?: string
  // Import state
  _id: string
  _status: ItemInclusionStatus
  _createdId?: string
  _error?: string
}

export interface ExtractedRelationship {
  character_a_name: string
  character_b_name: string
  relationship_type: string
  dynamic_label?: string
  dynamic_description?: string
  // Import state
  _id: string
  _status: ItemInclusionStatus
  _resolvedCharacterAId?: string
  _resolvedCharacterBId?: string
  _error?: string
}

export interface ExtractedWritingPiece {
  title: string
  type: string
  summary?: string
  content?: string
  // Import state
  _id: string
  _status: ItemInclusionStatus
  _createdId?: string
  _error?: string
}

export interface ExtractionResult {
  characters: ExtractedCharacter[]
  lore_entries: ExtractedLoreEntry[]
  relationships: ExtractedRelationship[]
  writing_pieces: ExtractedWritingPiece[]
  extractionNotes?: string    // AI commentary on what it found
}

export interface ImportSummary {
  charactersCreated: number
  charactersUpdated: number
  charactersSkipped: number
  loreCreated: number
  loreSkipped: number
  relationshipsCreated: number
  relationshipsSkipped: number
  writingCreated: number
  writingSkipped: number
  errors: { item: string; error: string }[]
}

export interface DuplicateResolution {
  action: 'skip' | 'update' | 'create-new'
  extractedCharacter: ExtractedCharacter
  existingCharacterId: string
  existingCharacterName: string
}

// Special case: a full Recoil JSON backup file
export interface RecoilBackupFile {
  exportedAt: number
  version: string
  verses: unknown[]
  subSeries: unknown[]
  characters: unknown[]
  relationships: unknown[]
  loreEntries: unknown[]
  writingPieces: unknown[]
  chapters: unknown[]
  conversations: unknown[]
  storyArcs: unknown[]
  foreshadowing: unknown[]
  headcanons: unknown[]
  writingGuidelines: unknown[]
  tags: unknown[]
}

export function isRecoilBackup(obj: unknown): obj is RecoilBackupFile {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'version' in obj &&
    'exportedAt' in obj &&
    'characters' in obj &&
    'verses' in obj
  )
}

export function detectFileType(filename: string): ImportFileType {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, ImportFileType> = {
    txt: 'txt', md: 'md', markdown: 'md',
    html: 'html', htm: 'html',
    json: 'json',
    docx: 'docx',
    pdf: 'pdf',
  }
  return map[ext ?? ''] ?? 'unknown'
}
