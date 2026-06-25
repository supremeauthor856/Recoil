import { api } from './api'
import type { LoreEntry, LoreCategory, CreateLoreInput } from '../features/lore/types'

function parseJsonArr(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val as string) } catch { return [] }
}

function parseLoreEntry(raw: Record<string, unknown>): LoreEntry {
  return {
    ...raw,
    tags: parseJsonArr(raw.tags),
    linked_character_ids: parseJsonArr(raw.linked_character_ids),
    linked_lore_ids: parseJsonArr(raw.linked_lore_ids),
    is_pinned: raw.is_pinned === 1 || raw.is_pinned === true,
  } as LoreEntry
}

function serializeLoreEntry(
  data: Partial<LoreEntry>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data }
  const arrFields = ['tags', 'linked_character_ids', 'linked_lore_ids']
  for (const field of arrFields) {
    if (Array.isArray(result[field])) {
      result[field] = JSON.stringify(result[field])
    }
  }
  if (typeof result.is_pinned === 'boolean') {
    result.is_pinned = result.is_pinned ? 1 : 0
  }
  return result
}

export const loreService = {
  async getEntries(
    verseId: string,
    filters?: { category?: LoreCategory; subSeriesId?: string }
  ): Promise<LoreEntry[]> {
    const params = new URLSearchParams({ verseId })
    if (filters?.category) params.set('category', filters.category)
    if (filters?.subSeriesId) params.set('subSeriesId', filters.subSeriesId)
    const res = await api.get<Record<string, unknown>[]>(`/lore?${params}`)
    return res.data?.map(parseLoreEntry) ?? []
  },

  async getEntry(id: string): Promise<LoreEntry | null> {
    const res = await api.get<Record<string, unknown>>(`/lore/${id}`)
    if (!res.success || !res.data) return null
    return parseLoreEntry(res.data)
  },

  async createEntry(data: CreateLoreInput): Promise<LoreEntry> {
    const res = await api.post<Record<string, unknown>>('/lore', data)
    if (!res.success || !res.data) throw new Error(res.error ?? 'Create failed')
    return parseLoreEntry(res.data)
  },

  async updateEntry(
    id: string,
    data: Partial<LoreEntry>
  ): Promise<LoreEntry> {
    const res = await api.put<Record<string, unknown>>(
      `/lore/${id}`, serializeLoreEntry(data)
    )
    if (!res.success || !res.data) throw new Error(res.error ?? 'Update failed')
    return parseLoreEntry(res.data)
  },

  async deleteEntry(id: string): Promise<boolean> {
    const res = await api.delete<unknown>(`/lore/${id}`)
    return res.success
  },

  async reorderEntries(
    entries: Array<{ id: string; sort_order: number }>
  ): Promise<boolean> {
    const res = await api.put<unknown>('/lore/reorder', { entries })
    return res.success
  },

  async togglePin(id: string, isPinned: boolean): Promise<LoreEntry> {
    return loreService.updateEntry(id, { is_pinned: isPinned })
  },
}
