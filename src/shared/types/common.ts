export type SectionName =
  | 'characters'
  | 'sub-series'
  | 'lore'
  | 'writing'
  | 'relationships'
  | 'verse-map'
  | 'ai'
  | 'tools'
  | 'writing-guidelines'
  | 'settings'

export type ContentType =
  | 'verse'
  | 'character'
  | 'lore'
  | 'writing'
  | 'relationship'
  | 'conversation'
  | 'tool'

export type Theme = 'dark' | 'darker' | 'midnight'

export type FontSize = 'compact' | 'default' | 'relaxed'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}
