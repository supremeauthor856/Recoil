export type Theme = 'light' | 'dark' | 'system' | 'darker' | 'midnight'

export type FontSize = 'default' | 'sm' | 'md' | 'lg' | 'compact' | 'relaxed'

export type SectionName = string

export interface Toast {
  id: string
  title: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}
