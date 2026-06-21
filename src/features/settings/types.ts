export type GuidelineCategory =
  | 'character-development'
  | 'worldbuilding'
  | 'plot-hooks'
  | 'pacing'
  | 'dialogue'
  | 'intros'
  | 'general'

export const GUIDELINE_CATEGORY_LABELS: Record<GuidelineCategory, string> = {
  'character-development': 'Character Development',
  worldbuilding: 'Worldbuilding',
  'plot-hooks': 'Plot & Hooks',
  pacing: 'Pacing',
  dialogue: 'Dialogue',
  intros: 'Introductions',
  general: 'General',
}

export const GUIDELINE_CATEGORIES: GuidelineCategory[] = [
  'character-development',
  'worldbuilding',
  'plot-hooks',
  'pacing',
  'dialogue',
  'intros',
  'general',
]

export interface WritingGuideline {
  id: string
  filename: string
  display_name: string
  category: GuidelineCategory
  r2_key: string           // "local:{id}" for D1-stored content
  file_size: number | null
  is_active: boolean
  content_preview: string | null   // Used to store full content (TEXT, no limit)
  created_at: number
  updated_at: number
}

export type ProviderFormat = 'openai' | 'gemini' | 'cloudflare'

export interface BuiltInProviderDefinition {
  id: string
  name: string
  format: ProviderFormat
  baseUrl: string
  docsUrl: string
  keyLabel: string
  keyPlaceholder: string
  models: { id: string; label: string; contextWindow: number }[]
  requiresAccountId: boolean
}

export type SettingsSection =
  | 'ai-config'
  | 'writing-guidelines'
  | 'appearance'
  | 'data'

export const SETTINGS_SECTIONS: { id: SettingsSection; label: string; icon: string }[] = [
  { id: 'ai-config', label: 'AI Configuration', icon: 'Cpu' },
  { id: 'writing-guidelines', label: 'Writing Guidelines', icon: 'FileStack' },
  { id: 'appearance', label: 'Appearance', icon: 'Palette' },
  { id: 'data', label: 'Data & Storage', icon: 'Database' },
]
