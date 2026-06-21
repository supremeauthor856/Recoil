import { api } from './api'
import type { WritingGuideline } from '../features/settings/types'

function parseGuideline(raw: Record<string, any>): WritingGuideline {
  return {
    ...raw,
    is_active: raw.is_active === 1 || raw.is_active === true,
  } as WritingGuideline
}

export const guidelineService = {
  async getAll(): Promise<WritingGuideline[]> {
    const result = await api.get<Record<string, any>[]>('/writing-guidelines')
    return result.data?.map(parseGuideline) ?? []
  },

  async getActive(): Promise<WritingGuideline[]> {
    const result = await api.get<Record<string, any>[]>('/writing-guidelines?active=true')
    return result.data?.map(parseGuideline) ?? []
  },

  async create(data: {
    display_name: string
    category: string
    content: string
    filename: string
  }): Promise<WritingGuideline> {
    const result = await api.post<Record<string, any>>('/writing-guidelines', data)
    if (!result.success || !result.data) throw new Error(result.error ?? 'Create failed')
    return parseGuideline(result.data)
  },

  async update(id: string, data: Partial<WritingGuideline>): Promise<WritingGuideline> {
    const result = await api.put<Record<string, any>>(`/writing-guidelines/${id}`, data)
    if (!result.success || !result.data) throw new Error(result.error ?? 'Update failed')
    return parseGuideline(result.data)
  },

  async delete(id: string): Promise<boolean> {
    const result = await api.delete<unknown>(`/writing-guidelines/${id}`)
    return !!result.success
  },

  async toggleActive(id: string, isActive: boolean): Promise<WritingGuideline> {
    return guidelineService.update(id, { is_active: isActive })
  },
}
