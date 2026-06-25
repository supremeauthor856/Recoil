export interface VerseFullStats {
  overview: {
    characterCount: number
    ocCount: number
    canonCount: number
    auCount: number
    loreCount: number
    writingCount: number
    relationshipCount: number
    conversationCount: number
    subSeriesCount: number
    totalWordCount: number
    totalMessages: number
    averageProfileCompletion: number
    activeGuidelinesCount: number
  }

  characters: {
    byNarrativeRole: RoleCount[]
    byArcStage: StageCount[]
    byAlignment: AlignmentCount[]
    completionDistribution: CompletionBucket[]
    mostComplete: CharacterQuickStat[]
    leastComplete: CharacterQuickStat[]
    mostConnected: CharacterConnectionStat[]
  }

  writing: {
    byType: WritingTypeStat[]
    byStatus: WritingStatusStat[]
    bySubSeries: SubSeriesWordStat[]
    longestPieces: WritingQuickStat[]
    totalChapterCount: number
    averageWordCount: number
  }

  relationships: {
    byType: RelTypeStat[]
    averageConnectionsPerCharacter: number
    totalIntensityAverage: number
  }

  foreshadowing: {
    planted: number
    pendingPayoff: number
    resolved: number
    total: number
  }

  tags: TagFrequency[]

  aiUsage: {
    totalConversations: number
    totalMessages: number
    byProvider: ProviderStat[]
    activeGuidelines: number
  }

  activity: ActivityDay[]

  computed: {
    writingStreak: number
    longestStreak: number
    mostActiveDay: string | null
    mostProductiveMonth: string | null
    verseCreatedAt: number
    daysSinceCreation: number
  }
}

export interface RoleCount { role: string; count: number }
export interface StageCount { stage: string; count: number }
export interface AlignmentCount { alignment: string; count: number }
export interface CompletionBucket { range: string; count: number; min: number; max: number }
export interface CharacterQuickStat { id: string; name: string; completion: number; narrative_role: string | null }
export interface CharacterConnectionStat { id: string; name: string; connectionCount: number }
export interface WritingTypeStat { type: string; count: number; wordCount: number }
export interface WritingStatusStat { status: string; count: number }
export interface SubSeriesWordStat { subSeriesId: string | null; subSeriesName: string; wordCount: number; pieceCount: number }
export interface WritingQuickStat { id: string; title: string; type: string; wordCount: number }
export interface RelTypeStat { type: string; count: number }
export interface TagFrequency { name: string; count: number }
export interface ProviderStat { provider: string; count: number }
export interface ActivityDay { date: string; count: number }

// Chart color palettes
export const ROLE_COLORS: Record<string, string> = {
  Protagonist: '#4ADE80',
  Antagonist: '#F87171',
  Supporting: '#60A5FA',
  Foil: '#A855F7',
  Catalyst: '#FB923C',
  Wildcard: '#E879F9',
  Mirror: '#FBBF24',
  Mentor: '#4ADE80',
  'Comic Relief': '#60A5FA',
  'Love Interest': '#FF6B9D',
  Other: '#6B7280',
}

export const ARC_COLORS: Record<string, string> = {
  Origin: '#60A5FA',
  Rising: '#4ADE80',
  Peak: '#B97AFF',
  Falling: '#FB923C',
  Redemption: '#FF6B9D',
  'Post-Arc': '#FBBF24',
  Unknown: '#6B7280',
}

export const WRITING_TYPE_COLORS: Record<string, string> = {
  novel: '#7B5EA7',
  'short-story': '#4F8AF4',
  scene: '#B97AFF',
  drabble: '#60A5FA',
  dialogue: '#4ADE80',
  'lore-article': '#FFD166',
  essay: '#FB923C',
  outline: '#6B7280',
}

export const HEATMAP_LEVELS = [
  'rgba(255,255,255,0.03)',     // 0 — no activity
  'rgba(123,94,167,0.25)',      // 1 — low
  'rgba(123,94,167,0.45)',      // 2 — medium
  'rgba(123,94,167,0.70)',      // 3 — high
  '#7B5EA7',                    // 4+ — peak
]

export const PIE_COLORS = [
  '#7B5EA7', // Purple
  '#4F8AF4', // Blue
  '#4ADE80', // Green
  '#FB923C', // Orange
  '#FF6B9D', // Pink
  '#FBBF24', // Amber
  '#A855F7', // Violet
]

export const CHART_BAR_GRADIENT = '#7B5EA7'

