import { api } from './api'
import type { ForeshadowingEntry, ForeshadowingStatus } from '../features/tools/types'

function parse(raw: Record<string, unknown>): ForeshadowingEntry {
  return {
    ...raw,
    linked_writing_ids: (() => {
      if (!raw.linked_writing_ids) return []
      if (Array.isArray(raw.linked_writing_ids)) return raw.linked_writing_ids as string[]
      try { return JSON.parse(raw.linked_writing_ids as string) as string[] } catch { return [] }
    })(),
  } as ForeshadowingEntry
}

export const foreshadowingService = {
  async getAll(verseId: string): Promise<ForeshadowingEntry[]> {
    const res = await api.get<Record<string, unknown>[]>(`/foreshadowing?verseId=${verseId}`)
    return res.data?.map(parse) ?? []
  },

  async create(data: {
    verse_id: string
    description: string
    planted_in?: string
    payoff_in?: string
    status?: ForeshadowingStatus
    notes?: string
  }): Promise<ForeshadowingEntry> {
    const res = await api.post<Record<string, unknown>>('/foreshadowing', data)
    if (!res.success || !res.data) throw new Error(res.error ?? 'Create failed')
    return parse(res.data)
  },

  async update(id: string, data: Partial<ForeshadowingEntry>): Promise<ForeshadowingEntry> {
    const payload = {
      ...data,
      linked_writing_ids: Array.isArray(data.linked_writing_ids)
        ? JSON.stringify(data.linked_writing_ids)
        : undefined,
    }
    const res = await api.put<Record<string, unknown>>(`/foreshadowing/${id}`, payload)
    if (!res.success || !res.data) throw new Error(res.error ?? 'Update failed')
    return parse(res.data)
  },

  async delete(id: string): Promise<boolean> {
    const res = await api.delete<unknown>(`/foreshadowing/${id}`)
    return res.success
  },
}
