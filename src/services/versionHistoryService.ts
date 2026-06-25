import { api } from './api'
import type { Character } from '../shared/types/database'

export interface VersionSnapshot {
  id: string
  entity_type: 'character' | 'writing' | 'lore'
  entity_id: string
  version_label: string | null
  snapshot: string           // JSON string of the full entity
  change_notes: string | null
  created_at: number
  // Client-only enriched fields
  entity_name?: string
  parsed?: Character         // parsed snapshot for character type
}

export const versionHistoryService = {
  async getSnapshots(
    entityType: string,
    entityId: string
  ): Promise<VersionSnapshot[]> {
    const res = await api.get<VersionSnapshot[]>(
      `/version-history?entityType=${entityType}&entityId=${entityId}`
    )
    return res.data ?? []
  },

  async getAllCharacterSnapshots(verseId: string): Promise<VersionSnapshot[]> {
    const res = await api.get<VersionSnapshot[]>(
      `/version-history?entityType=character&verseId=${verseId}`
    )
    return res.data ?? []
  },

  async saveSnapshot(data: {
    entity_type: 'character' | 'writing' | 'lore'
    entity_id: string
    snapshot: unknown          // will be JSON.stringified
    version_label?: string | null
    change_notes?: string | null
  }): Promise<VersionSnapshot> {
    const res = await api.post<VersionSnapshot>('/version-history', {
      ...data,
      snapshot: JSON.stringify(data.snapshot),
    })
    if (!res.success || !res.data) throw new Error(res.error ?? 'Save failed')
    return res.data
  },

  async deleteSnapshot(id: string): Promise<boolean> {
    const res = await api.delete<unknown>(`/version-history/${id}`)
    return res.success
  },

  parseSnapshot<T>(snapshot: VersionSnapshot): T {
    try {
      return JSON.parse(snapshot.snapshot) as T
    } catch {
      return {} as T
    }
  },

  // Compute a simple diff between two character snapshots
  // Returns an array of { field, old, new } for changed fields
  diffCharacters(
    older: Character,
    newer: Character
  ): Array<{ field: string; old: string; new: string }> {
    const ignore = new Set(['updated_at', 'profile_completion', 'created_at'])
    const changes: Array<{ field: string; old: string; new: string }> = []

    for (const key of Object.keys(newer) as Array<keyof Character>) {
      if (ignore.has(key)) continue
      const oldVal = older[key]
      const newVal = newer[key]
      const oldStr = Array.isArray(oldVal)
        ? (oldVal as string[]).join(', ')
        : String(oldVal ?? '')
      const newStr = Array.isArray(newVal)
        ? (newVal as string[]).join(', ')
        : String(newVal ?? '')
      if (oldStr !== newStr) {
        changes.push({ field: key, old: oldStr, new: newStr })
      }
    }
    return changes
  },
}
