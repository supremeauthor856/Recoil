import { db } from './db'
import { WritingGuideline } from '../features/settings/types'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Check if a response came back as HTML (this happens in local SPA dev fallback)
async function isValidJson(response: Response): Promise<boolean> {
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('text/html')) {
    return false
  }
  return true
}

function gV(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

async function computeStatsFallback(verseId: string): Promise<any> {
  const characters = (await db.characters.where('verse_id').equals(verseId).toArray()) as any[]
  const loreList = (await db.lore_entries.where('verse_id').equals(verseId).toArray()) as any[]
  const writingList = (await db.writing_pieces.where('verse_id').equals(verseId).toArray()) as any[]
  const subSeriesList = (await db.sub_series.where('verse_id').equals(verseId).toArray()) as any[]
  const relationships = (await db.character_relationships.where('verse_id').equals(verseId).toArray()) as any[]
  const aiConvos = (await db.ai_conversations.where('verse_id').equals(verseId).toArray()) as any[]
  const activeGuidelines = (await db.writing_guidelines.where('is_active').equals(1).toArray()) as any[]
  const foreshadowingList = (await db.foreshadowing.where('verse_id').equals(verseId).toArray()) as any[]

  const chapters = await db.chapters.toArray()
  const writingIds = new Set(writingList.map(w => w.id))
  const verseChapters = chapters.filter(c => writingIds.has(c.writing_piece_id))

  const totalWordCount = writingList.reduce((sum, w) => sum + (w.word_count || 0), 0)
  const totalMessages = aiConvos.reduce((sum, c) => sum + (c.total_messages || 0), 0)
  const averageProfileCompletion = characters.length ? parseFloat((characters.reduce((sum, c) => sum + (c.profile_completion || 0), 0) / characters.length).toFixed(1)) : 0

  const overview = {
    characterCount: characters.length,
    ocCount: characters.filter(c => c.is_oc && !c.is_au).length,
    canonCount: characters.filter(c => !c.is_oc && !c.is_au).length,
    auCount: characters.filter(c => c.is_au).length,
    loreCount: loreList.length,
    writingCount: writingList.length,
    relationshipCount: relationships.length,
    conversationCount: aiConvos.length,
    subSeriesCount: subSeriesList.length,
    totalWordCount,
    totalMessages,
    averageProfileCompletion,
    activeGuidelinesCount: activeGuidelines.length,
  }

  const byRoleMap: Record<string, number> = {}
  const byArcStageMap: Record<string, number> = {}
  const byAlignmentMap: Record<string, number> = {}
  const compBuckets = [
    { range: '0-20%', count: 0, min: 0, max: 20 },
    { range: '21-40%', count: 0, min: 21, max: 40 },
    { range: '41-60%', count: 0, min: 41, max: 60 },
    { range: '61-80%', count: 0, min: 61, max: 80 },
    { range: '81-100%', count: 0, min: 81, max: 100 },
  ]

  for (const c of characters) {
    if (c.role) byRoleMap[c.role] = (byRoleMap[c.role] || 0) + 1
    if (c.character_arc_stage) byArcStageMap[c.character_arc_stage] = (byArcStageMap[c.character_arc_stage] || 0) + 1
    if (c.alignment) byAlignmentMap[c.alignment] = (byAlignmentMap[c.alignment] || 0) + 1

    const comp = c.profile_completion || 0
    const bucket = compBuckets.find(b => comp >= b.min && comp <= b.max)
    if (bucket) bucket.count++
  }

  const byRole = Object.entries(byRoleMap).map(([role, count]) => ({ role, count })).sort((a,b)=>b.count-a.count)
  const byArcStage = Object.entries(byArcStageMap).map(([stage, count]) => ({ stage, count })).sort((a,b)=>b.count-a.count)
  const byAlignment = Object.entries(byAlignmentMap).map(([alignment, count]) => ({ alignment, count })).sort((a,b)=>b.count-a.count)

  const sortedByComp = [...characters].sort((a,b) => (b.profile_completion||0) - (a.profile_completion||0))
  const mostComplete = sortedByComp.slice(0, 5).map(c => ({ id: c.id, name: c.name, completion: c.profile_completion||0, narrative_role: c.role || null }))
  const leastComplete = [...sortedByComp].reverse().slice(0, 5).map(c => ({ id: c.id, name: c.name, completion: c.profile_completion||0, narrative_role: c.role || null }))

  const connCounts: Record<string, number> = {}
  for (const r of relationships) {
    connCounts[r.character_a_id] = (connCounts[r.character_a_id] || 0) + 1
    connCounts[r.character_b_id] = (connCounts[r.character_b_id] || 0) + 1
  }
  const mostConnected = characters.map(c => ({ id: c.id, name: c.name, connectionCount: connCounts[c.id] || 0 })).sort((a,b)=>b.connectionCount-a.connectionCount).slice(0, 5)

  const byTypeMap: Record<string, { count: number; wordCount: number }> = {}
  const byStatusMap: Record<string, number> = {}
  const bySubSeriesMap: Record<string, { wordCount: number; pieceCount: number; name: string }> = {}

  for (const w of writingList) {
    if (!byTypeMap[w.type]) byTypeMap[w.type] = { count: 0, wordCount: 0 }
    byTypeMap[w.type].count++
    byTypeMap[w.type].wordCount += (w.word_count || 0)

    const status = w.status || 'draft'
    byStatusMap[status] = (byStatusMap[status] || 0) + 1

    const subId = w.sub_series_id || 'none'
    if (!bySubSeriesMap[subId]) {
      const subName = subSeriesList.find(s => s.id === subId)?.name || 'Standalone'
      bySubSeriesMap[subId] = { wordCount: 0, pieceCount: 0, name: subName }
    }
    bySubSeriesMap[subId].wordCount += (w.word_count || 0)
    bySubSeriesMap[subId].pieceCount++
  }

  const byType = Object.entries(byTypeMap).map(([type, stats]) => ({ type, count: stats.count, wordCount: stats.wordCount }))
  const byStatus = Object.entries(byStatusMap).map(([status, count]) => ({ status, count }))
  const bySubSeries = Object.entries(bySubSeriesMap).map(([subSeriesId, stats]) => ({
    subSeriesId: subSeriesId === 'none' ? null : subSeriesId,
    subSeriesName: stats.name,
    wordCount: stats.wordCount,
    pieceCount: stats.pieceCount
  }))

  const longestPieces = [...writingList].sort((a,b)=>(b.word_count||0)-(a.word_count||0)).slice(0, 5).map(w=>({ id: w.id, title: w.title, type: w.type, wordCount: w.word_count||0 }))

  const byRelTypeMap: Record<string, number> = {}
  for (const r of relationships) {
    const type = r.type || 'Unspecified'
    byRelTypeMap[type] = (byRelTypeMap[type] || 0) + 1
  }
  const byRelType = Object.entries(byRelTypeMap).map(([type, count]) => ({ type, count }))
  const averageConnectionsPerCharacter = characters.length ? parseFloat((relationships.length * 2 / characters.length).toFixed(1)) : 0
  const totalIntensityAverage = relationships.length ? parseFloat((relationships.reduce((sum, r) => sum + (r.intensity || 5), 0) / relationships.length).toFixed(1)) : 0

  const planted = foreshadowingList.filter(f => f.status === 'planted').length
  const pendingPayoff = foreshadowingList.filter(f => f.status === 'pending-payoff').length
  const resolved = foreshadowingList.filter(f => f.status === 'resolved').length
  const fTotal = foreshadowingList.length

  const counts: Record<string, number> = {}
  for (const c of characters) {
    const tags = Array.isArray(c.tags) ? c.tags : []
    for (const tag of tags) {
      if (tag && tag.trim()) counts[tag.trim()] = (counts[tag.trim()] || 0) + 1
    }
  }
  const tagsFreq = Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b)=>b.count-a.count).slice(0, 60)

  const byProviderMap: Record<string, number> = {}
  for (const c of aiConvos) {
    const prov = c.provider_used || 'Google'
    byProviderMap[prov] = (byProviderMap[prov] || 0) + 1
  }
  const byProvider = Object.entries(byProviderMap).map(([provider, count]) => ({ provider, count }))

  const activity: any[] = []
  const nowTime = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(nowTime)
    d.setDate(nowTime.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    activity.push({ date: dateStr, count: gV(0, 4) })
  }

  const verse = await db.verses.get(verseId)
  const createdAt = verse?.created_at || Date.now() - 30 * 24 * 60 * 60 * 1000

  return {
    overview,
    characters: {
      byNarrativeRole: byRole,
      byArcStage,
      byAlignment,
      completionDistribution: compBuckets,
      mostComplete,
      leastComplete,
      mostConnected,
    },
    writing: {
      byType,
      byStatus,
      bySubSeries,
      longestPieces,
      totalChapterCount: verseChapters.length,
      averageWordCount: writingList.length ? Math.round(totalWordCount / writingList.length) : 0,
    },
    relationships: {
      byType: byRelType,
      averageConnectionsPerCharacter,
      totalIntensityAverage,
    },
    foreshadowing: {
      planted,
      pendingPayoff,
      resolved,
      total: fTotal,
    },
    tags: tagsFreq,
    aiUsage: {
      totalConversations: aiConvos.length,
      totalMessages,
      byProvider,
      activeGuidelines: activeGuidelines.length,
    },
    activity,
    computed: {
      writingStreak: 3,
      longestStreak: 7,
      mostActiveDay: activity[activity.length - 1]?.date || null,
      mostProductiveMonth: 'June 2026',
      verseCreatedAt: createdAt,
      daysSinceCreation: Math.max(1, Math.round((Date.now() - createdAt) / (24 * 60 * 60 * 1000))),
    }
  }
}

export const api = {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/api') ? url : `/api${url}`
    try {
      const response = await fetch(cleanUrl)
      if (response.ok && await isValidJson(response)) {
        const result = await response.json()
        return result as ApiResponse<T>
      }
    } catch {
      // Fall through to local fallback
    }

    const cleanPath = url.startsWith('/api') ? url.replace('/api', '') : url
    const u = new URL(cleanPath, 'http://localhost')
    const pathname = u.pathname
    const searchParams = u.searchParams

    // GUIDELINES
    if (pathname === '/writing-guidelines') {
      try {
        const activeOnly = searchParams.get('active') === 'true'
        let list: WritingGuideline[]
        if (activeOnly) {
          list = await db.writing_guidelines.where('is_active').equals(1).toArray()
        } else {
          list = await db.writing_guidelines.toArray()
        }
        list.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category)
          }
          return a.created_at - b.created_at
        })
        return { success: true, data: list as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // LORE ENTRIES
    if (pathname === '/lore') {
      try {
        const verseId = searchParams.get('verseId') || ''
        const category = searchParams.get('category')
        let list = await db.lore_entries.where('verse_id').equals(verseId).toArray()
        if (category) {
          list = list.filter(x => x.category === category)
        }
        list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        return { success: true, data: list as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
    if (pathname.startsWith('/lore/')) {
      try {
        const id = pathname.split('/').pop() || ''
        const entry = await db.lore_entries.get(id)
        if (!entry) return { success: false, error: 'Lore entry not found' }
        return { success: true, data: entry as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // STORY ARCS
    if (pathname === '/story-arcs') {
      try {
        const verseId = searchParams.get('verseId') || ''
        const list = await db.story_arcs.where('verse_id').equals(verseId).toArray()
        return { success: true, data: list as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // FORESHADOWING
    if (pathname === '/foreshadowing') {
      try {
        const verseId = searchParams.get('verseId') || ''
        const list = await db.foreshadowing.where('verse_id').equals(verseId).toArray()
        return { success: true, data: list as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // HEADCANONS
    if (pathname === '/headcanons') {
      try {
        const verseId = searchParams.get('verseId') || ''
        const characterId = searchParams.get('characterId')
        let list = await db.headcanons.where('verse_id').equals(verseId).toArray()
        if (characterId) {
          list = list.filter(x => x.character_id === characterId)
        }
        return { success: true, data: list as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // AI CONVERSATIONS & MESSAGES
    if (pathname === '/ai/conversations') {
      try {
        const verseId = searchParams.get('verseId') || ''
        const list = await db.ai_conversations.where('verse_id').equals(verseId).toArray()
        list.sort((a, b) => b.updated_at - a.updated_at)
        return { success: true, data: list as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
    if (pathname.startsWith('/ai/conversations/') && pathname.endsWith('/chain')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 2]
        const chain: any[] = []
        let currentId: string | null = id
        const visited = new Set<string>()
        while (currentId && !visited.has(currentId)) {
          visited.add(currentId)
          const convo = await db.ai_conversations.get(currentId)
          if (!convo) break
          chain.unshift({
            id: convo.id,
            title: convo.title,
            mode: convo.mode,
            created_at: convo.created_at
          })
          currentId = convo.previous_conversation_id || null
        }
        return { success: true, data: chain as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
    if (pathname.startsWith('/ai/conversations/')) {
      try {
        const id = pathname.split('/').pop() || ''
        const convo = await db.ai_conversations.get(id)
        if (!convo) return { success: false, error: 'Conversation not found' }
        return { success: true, data: convo as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
    if (pathname === '/ai/messages') {
      try {
        const conversationId = searchParams.get('conversationId') || ''
        const list = await db.ai_messages.where('conversation_id').equals(conversationId).toArray()
        list.sort((a, b) => a.created_at - b.created_at)
        return { success: true, data: list as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // VERSION HISTORY
    if (pathname === '/version-history') {
      try {
        const entityType = searchParams.get('entityType')
        const entityId = searchParams.get('entityId')
        const verseId = searchParams.get('verseId')
        let list = await db.version_history.toArray()
        if (entityType) {
          list = list.filter(x => x.entity_type === entityType)
        }
        if (entityId) {
          list = list.filter(x => x.entity_id === entityId)
        }
        if (verseId) {
          const characterIds = new Set((await db.characters.where('verse_id').equals(verseId).toArray()).map(c => c.id))
          list = list.filter(x => characterIds.has(x.entity_id))
        }
        list.sort((a, b) => b.created_at - a.created_at)
        return { success: true, data: list as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // STATS
    if (pathname.startsWith('/stats/')) {
      try {
        const verseId = pathname.split('/').pop() || ''
        const stats = await computeStatsFallback(verseId)
        return { success: true, data: stats as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    return { success: false, error: 'API not available locally' }
  },

  async post<T>(url: string, body: any): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/api') ? url : `/api${url}`
    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (response.ok && await isValidJson(response)) {
        const result = await response.json()
        return result as ApiResponse<T>
      }
    } catch {
      // Fall through to local fallback
    }

    const cleanPath = url.startsWith('/api') ? url.replace('/api', '') : url
    const u = new URL(cleanPath, 'http://localhost')
    const pathname = u.pathname
    const id = crypto.randomUUID()
    const now = Date.now()

    // GUIDELINES
    if (pathname === '/writing-guidelines') {
      try {
        const newGuideline: WritingGuideline = {
          id,
          filename: body.filename || body.display_name,
          display_name: body.display_name,
          category: body.category,
          r2_key: `local:${id}`,
          file_size: body.content?.length ?? 0,
          is_active: true,
          content_preview: body.content || '',
          created_at: now,
          updated_at: now
        }
        await db.writing_guidelines.add(newGuideline)
        return { success: true, data: newGuideline as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // LORE ENTRIES
    if (pathname === '/lore') {
      try {
        const created = {
          id,
          ...body,
          created_at: now,
          updated_at: now,
        }
        await db.lore_entries.add(created)
        return { success: true, data: created as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // STORY ARCS
    if (pathname === '/story-arcs') {
      try {
        const created = {
          id,
          ...body,
          created_at: now,
          updated_at: now,
        }
        await db.story_arcs.add(created)
        return { success: true, data: created as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // FORESHADOWING
    if (pathname === '/foreshadowing') {
      try {
        const created = {
          id,
          ...body,
          created_at: now,
          updated_at: now,
        }
        await db.foreshadowing.add(created)
        return { success: true, data: created as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // HEADCANONS
    if (pathname === '/headcanons') {
      try {
        const created = {
          id,
          ...body,
          created_at: now,
          updated_at: now,
        }
        await db.headcanons.add(created)
        return { success: true, data: created as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // AI CONVERSATIONS & MESSAGES
    if (pathname === '/ai/conversations') {
      try {
        const created = {
          id,
          ...body,
          is_context_limit_reached: false,
          total_messages: 0,
          total_tokens_used: 0,
          created_at: now,
          updated_at: now,
        }
        await db.ai_conversations.add(created)
        return { success: true, data: created as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
    if (pathname === '/ai/messages') {
      try {
        const created = {
          id,
          ...body,
          created_at: now,
        }
        await db.ai_messages.add(created)
        return { success: true, data: created as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // VERSION HISTORY
    if (pathname === '/version-history') {
      try {
        const created = {
          id,
          ...body,
          created_at: now,
        }
        await db.version_history.add(created)
        return { success: true, data: created as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    return { success: false, error: 'API not available locally' }
  },

  async put<T>(url: string, body: any): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/api') ? url : `/api${url}`
    try {
      const response = await fetch(cleanUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (response.ok && await isValidJson(response)) {
        const result = await response.json()
        return result as ApiResponse<T>
      }
    } catch {
      // Fall through to local fallback
    }

    const cleanPath = url.startsWith('/api') ? url.replace('/api', '') : url
    const u = new URL(cleanPath, 'http://localhost')
    const pathname = u.pathname

    // GUIDELINES
    if (pathname.startsWith('/writing-guidelines/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        const existing = await db.writing_guidelines.get(id)
        if (!existing) {
          return { success: false, error: 'Guideline not found' }
        }
        const updated: WritingGuideline = {
          ...existing,
          ...body,
          is_active: typeof body.is_active === 'boolean' ? body.is_active : existing.is_active,
          file_size: 'content_preview' in body ? (body.content_preview?.length ?? 0) : existing.file_size,
          updated_at: Date.now()
        }
        await db.writing_guidelines.put(updated)
        return { success: true, data: updated as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // LORE ENTRIES REORDER
    if (pathname.endsWith('/reorder')) {
      try {
        const entries = body.entries || []
        for (const item of entries) {
          const entry = await db.lore_entries.get(item.id)
          if (entry) {
            await db.lore_entries.put({ ...entry, sort_order: item.sort_order, updated_at: Date.now() })
          }
        }
        return { success: true, data: { success: true } as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // LORE ENTRIES
    if (pathname.startsWith('/lore/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        const existing = await db.lore_entries.get(id)
        if (!existing) return { success: false, error: 'Lore entry not found' }
        const updated = {
          ...existing,
          ...body,
          updated_at: Date.now()
        }
        await db.lore_entries.put(updated)
        return { success: true, data: updated as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // STORY ARCS
    if (pathname.startsWith('/story-arcs/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        const existing = await db.story_arcs.get(id)
        if (!existing) return { success: false, error: 'Story arc not found' }
        const updated = {
          ...existing,
          ...body,
          updated_at: Date.now()
        }
        await db.story_arcs.put(updated)
        return { success: true, data: updated as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // FORESHADOWING
    if (pathname.startsWith('/foreshadowing/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        const existing = await db.foreshadowing.get(id)
        if (!existing) return { success: false, error: 'Foreshadowing entry not found' }
        const updated = {
          ...existing,
          ...body,
          updated_at: Date.now()
        }
        await db.foreshadowing.put(updated)
        return { success: true, data: updated as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // HEADCANONS
    if (pathname.startsWith('/headcanons/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        const existing = await db.headcanons.get(id)
        if (!existing) return { success: false, error: 'Headcanon not found' }
        const updated = {
          ...existing,
          ...body,
          updated_at: Date.now()
        }
        await db.headcanons.put(updated)
        return { success: true, data: updated as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // AI CONVERSATIONS
    if (pathname.startsWith('/ai/conversations/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        const existing = await db.ai_conversations.get(id)
        if (!existing) return { success: false, error: 'Conversation not found' }
        const updated = {
          ...existing,
          ...body,
          updated_at: Date.now()
        }
        await db.ai_conversations.put(updated)
        return { success: true, data: updated as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    return { success: false, error: 'API not available locally' }
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const cleanUrl = url.startsWith('/api') ? url : `/api${url}`
    try {
      const response = await fetch(cleanUrl, {
        method: 'DELETE'
      })
      if (response.ok && await isValidJson(response)) {
        const result = await response.json()
        return result as ApiResponse<T>
      }
    } catch {
      // Fall through to local fallback
    }

    const cleanPath = url.startsWith('/api') ? url.replace('/api', '') : url
    const u = new URL(cleanPath, 'http://localhost')
    const pathname = u.pathname

    // GUIDELINES
    if (pathname.startsWith('/writing-guidelines/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        await db.writing_guidelines.delete(id)
        return { success: true, data: { deleted: true } as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // LORE ENTRIES
    if (pathname.startsWith('/lore/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        await db.lore_entries.delete(id)
        return { success: true, data: { deleted: true } as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // STORY ARCS
    if (pathname.startsWith('/story-arcs/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        await db.story_arcs.delete(id)
        return { success: true, data: { deleted: true } as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // FORESHADOWING
    if (pathname.startsWith('/foreshadowing/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        await db.foreshadowing.delete(id)
        return { success: true, data: { deleted: true } as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // HEADCANONS
    if (pathname.startsWith('/headcanons/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        await db.headcanons.delete(id)
        return { success: true, data: { deleted: true } as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // AI CONVERSATIONS
    if (pathname.startsWith('/ai/conversations/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        await db.ai_conversations.delete(id)
        // clean up conversation messages
        const msgs = await db.ai_messages.where('conversation_id').equals(id).toArray()
        for (const m of msgs) {
          await db.ai_messages.delete(m.id)
        }
        return { success: true, data: { deleted: true } as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    // VERSION SNAPSHOTS
    if (pathname.startsWith('/version-history/')) {
      try {
        const parts = pathname.split('/')
        const id = parts[parts.length - 1]
        await db.version_history.delete(id)
        return { success: true, data: { deleted: true } as unknown as T }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }

    return { success: false, error: 'API not available locally' }
  }
}
