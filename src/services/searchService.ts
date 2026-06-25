import { api } from './api'

export type SearchResultType =
  | 'character'
  | 'writing'
  | 'lore'
  | 'conversation'
  | 'arc'
  | 'headcanon'
  | 'foreshadowing'

export interface SearchResult {
  type: SearchResultType
  id: string
  title: string
  subtitle: string
  meta: string | null
  completion_pct: number
  verse_id: string
  sub_series_id: string | null
  updated_at: number
}

export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  character: 'Character',
  writing: 'Writing',
  lore: 'Lore',
  conversation: 'Conversation',
  arc: 'Story Arc',
  headcanon: 'Headcanon',
  foreshadowing: 'Foreshadowing',
}

export const SEARCH_TYPE_ICONS: Record<SearchResultType, string> = {
  character: 'User',
  writing: 'FileText',
  lore: 'BookOpen',
  conversation: 'MessageSquare',
  arc: 'GitBranch',
  headcanon: 'Archive',
  foreshadowing: 'Eye',
}

// Build the navigation path for a search result
export function getResultPath(result: SearchResult, verseId: string): string {
  switch (result.type) {
    case 'character':
      return `/verse/${verseId}/characters/${result.id}`
    case 'writing':
      return `/verse/${verseId}/writing/${result.id}`
    case 'lore':
      return `/verse/${verseId}/lore/${result.id}`
    case 'conversation':
      return `/verse/${verseId}/ai`
    case 'arc':
      return `/verse/${verseId}/tools/arc-board`
    case 'headcanon':
      return `/verse/${verseId}/tools/headcanon-vault`
    case 'foreshadowing':
      return `/verse/${verseId}/tools/foreshadowing`
    default:
      return `/verse/${verseId}`
  }
}

// Extra navigation state for types that need it
export function getResultNavState(
  result: SearchResult
): Record<string, string> | undefined {
  if (result.type === 'conversation') return { conversationId: result.id }
  return undefined
}

export const searchService = {
  async search(
    verseId: string,
    query: string,
    types?: SearchResultType[]
  ): Promise<SearchResult[]> {
    if (!query.trim() || query.trim().length < 1) return []
    const typesParam = types ? `&types=${types.join(',')}` : ''
    const encoded = encodeURIComponent(query.trim())
    const res = await api.get<SearchResult[]>(
      `/search?verseId=${verseId}&q=${encoded}${typesParam}`
    )
    return res.data ?? []
  },
}

// Recent items stored in localStorage
const RECENT_KEY = 'recoil-search-recent'
const MAX_RECENT = 8

export const recentSearches = {
  get(): SearchResult[] {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  },

  add(result: SearchResult): void {
    try {
      const existing = recentSearches.get()
      const filtered = existing.filter(r => !(r.id === result.id && r.type === result.type))
      const updated = [result, ...filtered].slice(0, MAX_RECENT)
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
    } catch { /* storage unavailable */ }
  },

  clear(): void {
    try { localStorage.removeItem(RECENT_KEY) } catch { /* skip */ }
  },
}
