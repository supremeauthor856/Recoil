import { api } from './api'
import type { StoryArc, ArcStatus } from '../features/tools/types'

function parseJsonArr(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val as string[]
  try { return JSON.parse(val as string) as string[] } catch { return [] }
}

function parse(raw: Record<string, unknown>): StoryArc {
  return {
    ...raw,
    linked_writing_ids: parseJsonArr(raw.linked_writing_ids),
    linked_character_ids: parseJsonArr(raw.linked_character_ids),
    tags: parseJsonArr(raw.tags),
  } as StoryArc
}

function serialize(data: Partial<StoryArc>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data }
  if (Array.isArray(result.linked_writing_ids))
    result.linked_writing_ids = JSON.stringify(result.linked_writing_ids)
  if (Array.isArray(result.linked_character_ids))
    result.linked_character_ids = JSON.stringify(result.linked_character_ids)
  if (Array.isArray(result.tags))
    result.tags = JSON.stringify(result.tags)
  return result
}

export const storyArcService = {
  async getAll(verseId: string): Promise<StoryArc[]> {
    const res = await api.get<Record<string, unknown>[]>(`/story-arcs?verseId=${verseId}`)
    return res.data?.map(parse) ?? []
  },

  async create(data: {
    verse_id: string
    title: string
    description?: string
    status?: ArcStatus
    sub_series_id?: string
  }): Promise<StoryArc> {
    const res = await api.post<Record<string, unknown>>('/story-arcs', data)
    if (!res.success || !res.data) throw new Error(res.error ?? 'Create failed')
    return parse(res.data)
  },

  async update(id: string, data: Partial<StoryArc>): Promise<StoryArc> {
    const res = await api.put<Record<string, unknown>>(`/story-arcs/${id}`, serialize(data))
    if (!res.success || !res.data) throw new Error(res.error ?? 'Update failed')
    return parse(res.data)
  },

  async updateStatus(id: string, status: ArcStatus): Promise<StoryArc> {
    return storyArcService.update(id, { status })
  },

  async delete(id: string): Promise<boolean> {
    const res = await api.delete<unknown>(`/story-arcs/${id}`)
    return res.success
  },
}
