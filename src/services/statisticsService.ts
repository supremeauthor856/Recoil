import { api } from './api'
import type { VerseFullStats, TagFrequency } from '../features/statistics/types'

export const statisticsService = {
  async getFullStats(verseId: string): Promise<VerseFullStats | null> {
    const res = await api.get<VerseFullStats>(`/stats/${verseId}`)
    return res.data ?? null
  },

  // Tag frequency is computed client-side from character arrays
  // since tags are stored as JSON strings on each entity
  computeTagFrequency(
    characterTags: string[][]
  ): TagFrequency[] {
    const counts: Record<string, number> = {}
    for (const tagArr of characterTags) {
      for (const tag of tagArr) {
        if (tag && tag.trim()) {
          counts[tag.trim()] = (counts[tag.trim()] ?? 0) + 1
        }
      }
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 60)
  },

  formatMonth(monthStr: string): string {
    if (!monthStr || !monthStr.includes('-')) return monthStr
    // "2026-03" → "Mar 2026"
    const [year, month] = monthStr.split('-')
    const months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec']
    const monthIndex = parseInt(month, 10) - 1
    const monthName = months[monthIndex] || month
    return `${monthName} ${year}`
  },

  formatWordCount(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return String(count)
  },
}
