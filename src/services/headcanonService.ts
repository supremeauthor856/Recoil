import { api } from './api'
import type { Headcanon, CanonStatus } from '../features/tools/types'

export const headcanonService = {
  async getAll(verseId: string, characterId?: string): Promise<Headcanon[]> {
    const params = new URLSearchParams({ verseId })
    if (characterId) params.set('characterId', characterId)
    const res = await api.get<Headcanon[]>(`/headcanons?${params}`)
    return res.data ?? []
  },

  async create(data: {
    verse_id: string
    content: string
    character_id?: string | null
    canon_status?: CanonStatus
    notes?: string
  }): Promise<Headcanon> {
    const res = await api.post<Headcanon>('/headcanons', data)
    if (!res.success || !res.data) throw new Error(res.error ?? 'Create failed')
    return res.data
  },

  async update(id: string, data: Partial<Headcanon>): Promise<Headcanon> {
    const res = await api.put<Headcanon>(`/headcanons/${id}`, data)
    if (!res.success || !res.data) throw new Error(res.error ?? 'Update failed')
    return res.data
  },

  async delete(id: string): Promise<boolean> {
    const res = await api.delete<unknown>(`/headcanons/${id}`)
    return res.success
  },
}
