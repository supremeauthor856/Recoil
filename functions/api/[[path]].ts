interface Env {
  DB: {
    prepare: (query: string) => {
      bind: (...args: any[]) => {
        first: () => Promise<any>
        run: () => Promise<any>
      }
      all: () => Promise<{ results: any[] }>
    }
    batch: (statements: any[]) => Promise<any>
  }
  R2?: {
    put: (key: string, value: any) => Promise<any>
    delete: (key: string) => Promise<any>
  }
}

export const onRequest: PagesFunction<Env> = async (context: any) => {
  const { request, env } = context
  const url = new URL(request.url)
  const path = url.pathname

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  })

  // Handle preflights
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 })
  }

  const response = (status: number, success: boolean, data?: any, error?: string) => {
    return new Response(JSON.stringify({ success, data, error }), {
      status,
      headers,
    })
  }

  const jsonSuccess = (data: any, status = 200) => {
    return new Response(JSON.stringify({ success: true, data }), {
      status,
      headers,
    })
  }

  const jsonError = (error: string, status = 400) => {
    return new Response(JSON.stringify({ success: false, error }), {
      status,
      headers,
    })
  }

  const generateId = () => crypto.randomUUID()

  // Handler functions declared in scope for access to headers and json status
  // GET /api/ai/conversations?verseId=xxx
  async function handleGetConversations(req: Request) {
    const verseId = url.searchParams.get('verseId')
    if (!verseId) return jsonError('verseId is required', 400)
    const result = await env.DB.prepare(
      `SELECT * FROM ai_conversations
       WHERE verse_id = ?
       ORDER BY updated_at DESC`
    ).bind(verseId).all()
    return jsonSuccess(result.results ?? [])
  }

  // GET /api/ai/conversations/:id
  async function handleGetConversation(id: string) {
    const result = await env.DB.prepare(
      'SELECT * FROM ai_conversations WHERE id = ?'
    ).bind(id).first()
    if (!result) return jsonError('Conversation not found', 404)
    return jsonSuccess(result)
  }

  // GET /api/ai/conversations/:id/chain
  async function handleGetConversationChain(id: string) {
    const chain: any[] = []
    let currentId: string | null = id
    const visited = new Set<string>()

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId)
      const conv = await env.DB.prepare(
        `SELECT id, title, created_at, total_messages, summary,
         is_context_limit_reached, previous_conversation_id
         FROM ai_conversations WHERE id = ?`
      ).bind(currentId).first() as any | null

      if (!conv) break
      chain.unshift(conv) // Add to front for chronological order
      currentId = conv.previous_conversation_id as string | null
    }

    return jsonSuccess(chain)
  }

  // POST /api/ai/conversations
  async function handleCreateConversation(req: Request) {
    const body = await req.json() as Record<string, any>
    const id = generateId()
    const now = Date.now()
    await env.DB.prepare(`
      INSERT INTO ai_conversations (
        id, verse_id, title, description, previous_conversation_id,
        summary, total_messages, total_tokens_used,
        provider_used, model_used, is_context_limit_reached,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, null, 0, 0, null, null, 0, ?, ?)
    `).bind(
      id,
      body.verse_id ?? null,
      body.title ?? null,
      body.description ?? null,
      body.previous_conversation_id ?? null,
      now, now
    ).run()
    const created = await env.DB.prepare(
      'SELECT * FROM ai_conversations WHERE id = ?'
    ).bind(id).first()
    return jsonSuccess(created, 201)
  }

  // PUT /api/ai/conversations/:id
  async function handleUpdateConversation(id: string, req: Request) {
    const body = await req.json() as Record<string, any>
    const now = Date.now()
    const allowed = [
      'title','description','summary','total_messages','total_tokens_used',
      'provider_used','model_used','is_context_limit_reached'
    ]
    const updates: string[] = []
    const values: any[] = []
    for (const field of allowed) {
      if (field in body) {
        updates.push(`${field} = ?`)
        const val = body[field]
        values.push(typeof val === 'boolean' ? (val ? 1 : 0) : val)
      }
    }
    if (updates.length === 0) return jsonError('No fields to update', 400)
    updates.push('updated_at = ?')
    values.push(now, id)
    await env.DB.prepare(
      `UPDATE ai_conversations SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run()
    const updated = await env.DB.prepare(
      'SELECT * FROM ai_conversations WHERE id = ?'
    ).bind(id).first()
    return jsonSuccess(updated)
  }

  // DELETE /api/ai/conversations/:id
  async function handleDeleteConversation(id: string) {
    await env.DB.prepare(
      'DELETE FROM ai_conversations WHERE id = ?'
    ).bind(id).run()
    return jsonSuccess({ deleted: true })
  }

  // GET /api/ai/messages?conversationId=xxx
  async function handleGetMessages(req: Request) {
    const conversationId = url.searchParams.get('conversationId')
    if (!conversationId) return jsonError('conversationId is required', 400)
    const result = await env.DB.prepare(
      `SELECT * FROM ai_messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`
    ).bind(conversationId).all()
    return jsonSuccess(result.results ?? [])
  }

  // POST /api/ai/messages
  async function handleSaveMessage(req: Request) {
    const body = await req.json() as Record<string, any>
    if (!body.conversation_id || !body.role || !body.content)
      return jsonError('conversation_id, role, and content are required', 400)
    const id = generateId()
    const now = Date.now()
    await env.DB.prepare(`
      INSERT INTO ai_messages (
        id, conversation_id, role, content,
        token_count, provider, model, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.conversation_id,
      body.role,
      body.content,
      body.token_count ?? 0,
      body.provider ?? null,
      body.model ?? null,
      now
    ).run()
    const created = await env.DB.prepare(
      'SELECT * FROM ai_messages WHERE id = ?'
    ).bind(id).first()
    return jsonSuccess(created, 201)
  }

  // DELETE /api/ai/messages/:id (Not implemented here, but part of AI tools if needed)

  // ─── FORESHADOWING ───────────────────────────────────────────────────────────

  async function handleGetForeshadowing(req: Request) {
    const verseId = url.searchParams.get('verseId')
    if (!verseId) return jsonError('verseId is required', 400)
    const result = await env.DB.prepare(
      'SELECT * FROM foreshadowing_entries WHERE verse_id = ? ORDER BY status ASC, created_at DESC'
    ).bind(verseId).all()
    return jsonSuccess(result.results ?? [])
  }

  async function handleCreateForeshadowing(req: Request) {
    const body = await req.json() as Record<string, unknown>
    if (!body.verse_id || !body.description) return jsonError('verse_id and description required', 400)
    const id = generateId()
    const now = Date.now()
    await env.DB.prepare(`
      INSERT INTO foreshadowing_entries
        (id, verse_id, description, planted_in, payoff_in, status, notes, linked_writing_ids, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?, ?)
    `).bind(
      id, body.verse_id, body.description,
      body.planted_in ?? null, body.payoff_in ?? null,
      body.status ?? 'planted', body.notes ?? null,
      now, now
    ).run()
    const created = await env.DB.prepare('SELECT * FROM foreshadowing_entries WHERE id = ?').bind(id).first()
    return jsonSuccess(created, 201)
  }

  async function handleUpdateForeshadowing(id: string, req: Request) {
    const body = await req.json() as Record<string, unknown>
    const now = Date.now()
    const allowed = ['description','planted_in','payoff_in','status','notes','linked_writing_ids']
    const updates: string[] = []
    const values: unknown[] = []
    for (const field of allowed) {
      if (field in body) { updates.push(`${field} = ?`); values.push(body[field]) }
    }
    if (updates.length === 0) return jsonError('No fields to update', 400)
    updates.push('updated_at = ?'); values.push(now, id)
    await env.DB.prepare(`UPDATE foreshadowing_entries SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
    const updated = await env.DB.prepare('SELECT * FROM foreshadowing_entries WHERE id = ?').bind(id).first()
    return jsonSuccess(updated)
  }

  async function handleDeleteForeshadowing(id: string) {
    await env.DB.prepare('DELETE FROM foreshadowing_entries WHERE id = ?').bind(id).run()
    return jsonSuccess({ deleted: true })
  }

  // ─── STORY ARCS ─────────────────────────────────────────────────────────────

  async function handleGetStoryArcs(req: Request) {
    const verseId = url.searchParams.get('verseId')
    if (!verseId) return jsonError('verseId is required', 400)
    const result = await env.DB.prepare(
      'SELECT * FROM story_arcs WHERE verse_id = ? ORDER BY status ASC, sort_order ASC'
    ).bind(verseId).all()
    return jsonSuccess(result.results ?? [])
  }

  async function handleCreateStoryArc(req: Request) {
    const body = await req.json() as Record<string, unknown>
    if (!body.verse_id || !body.title) return jsonError('verse_id and title required', 400)
    const id = generateId()
    const now = Date.now()
    await env.DB.prepare(`
      INSERT INTO story_arcs
        (id, verse_id, sub_series_id, title, description, status, sort_order,
         linked_writing_ids, linked_character_ids, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, '[]', '[]', '[]', ?, ?)
    `).bind(
      id, body.verse_id, body.sub_series_id ?? null,
      body.title, body.description ?? null,
      body.status ?? 'planned',
      now, now
    ).run()
    const created = await env.DB.prepare('SELECT * FROM story_arcs WHERE id = ?').bind(id).first()
    return jsonSuccess(created, 201)
  }

  async function handleUpdateStoryArc(id: string, req: Request) {
    const body = await req.json() as Record<string, unknown>
    const now = Date.now()
    const allowed = ['title','description','status','sort_order','sub_series_id',
                     'linked_writing_ids','linked_character_ids','tags']
    const updates: string[] = []
    const values: unknown[] = []
    for (const field of allowed) {
      if (field in body) { updates.push(`${field} = ?`); values.push(body[field]) }
    }
    if (updates.length === 0) return jsonError('No fields to update', 400)
    updates.push('updated_at = ?'); values.push(now, id)
    await env.DB.prepare(`UPDATE story_arcs SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
    const updated = await env.DB.prepare('SELECT * FROM story_arcs WHERE id = ?').bind(id).first()
    return jsonSuccess(updated)
  }

  async function handleDeleteStoryArc(id: string) {
    await env.DB.prepare('DELETE FROM story_arcs WHERE id = ?').bind(id).run()
    return jsonSuccess({ deleted: true })
  }

  // ─── HEADCANONS ─────────────────────────────────────────────────────────────

  async function handleGetHeadcanons(req: Request) {
    const verseId = url.searchParams.get('verseId')
    if (!verseId) return jsonError('verseId is required', 400)
    let query = 'SELECT * FROM headcanons WHERE verse_id = ?'
    const params: unknown[] = [verseId]
    const charId = url.searchParams.get('characterId')
    if (charId) { query += ' AND character_id = ?'; params.push(charId) }
    query += ' ORDER BY canon_status ASC, created_at DESC'
    const result = await env.DB.prepare(query).bind(...params).all()
    return jsonSuccess(result.results ?? [])
  }

  async function handleCreateHeadcanon(req: Request) {
    const body = await req.json() as Record<string, unknown>
    if (!body.verse_id || !body.content) return jsonError('verse_id and content required', 400)
    const id = generateId()
    const now = Date.now()
    await env.DB.prepare(`
      INSERT INTO headcanons (id, verse_id, character_id, content, canon_status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, body.verse_id, body.character_id ?? null,
      body.content, body.canon_status ?? 'undecided',
      body.notes ?? null, now, now
    ).run()
    const created = await env.DB.prepare('SELECT * FROM headcanons WHERE id = ?').bind(id).first()
    return jsonSuccess(created, 201)
  }

  async function handleUpdateHeadcanon(id: string, req: Request) {
    const body = await req.json() as Record<string, unknown>
    const now = Date.now()
    const allowed = ['content','canon_status','notes','character_id']
    const updates: string[] = []
    const values: unknown[] = []
    for (const field of allowed) {
      if (field in body) { updates.push(`${field} = ?`); values.push(body[field]) }
    }
    if (updates.length === 0) return jsonError('No fields to update', 400)
    updates.push('updated_at = ?'); values.push(now, id)
    await env.DB.prepare(`UPDATE headcanons SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
    const updated = await env.DB.prepare('SELECT * FROM headcanons WHERE id = ?').bind(id).first()
    return jsonSuccess(updated)
  }

  async function handleDeleteHeadcanon(id: string) {
    await env.DB.prepare('DELETE FROM headcanons WHERE id = ?').bind(id).run()
    return jsonSuccess({ deleted: true })
  }

  // ─── MINIMAL LORE CREATE (for Lore Expander) ─────────────────────────────────

  async function handleCreateLoreEntry(req: Request) {
    const body = await req.json() as Record<string, unknown>
    if (!body.verse_id || !body.title) return jsonError('verse_id and title required', 400)
    const id = generateId()
    const now = Date.now()
    await env.DB.prepare(`
      INSERT INTO lore_entries
        (id, verse_id, sub_series_id, category, title, content, summary,
         tags, linked_character_ids, linked_lore_ids, is_pinned, created_at, updated_at, sort_order)
      VALUES (?, ?, null, ?, ?, ?, ?, '[]', '[]', '[]', 0, ?, ?, 0)
    `).bind(
      id, body.verse_id,
      body.category ?? 'general', body.title,
      body.content ?? null, body.summary ?? null,
      now, now
    ).run()
    const created = await env.DB.prepare('SELECT * FROM lore_entries WHERE id = ?').bind(id).first()
    return jsonSuccess(created, 201)
  }

  // GET /api/lore?verseId=xxx&category=xxx&subSeriesId=xxx
  async function handleGetLoreEntries(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const verseId = url.searchParams.get('verseId')
    if (!verseId) return jsonError('verseId is required', 400)

    let query = 'SELECT * FROM lore_entries WHERE verse_id = ?'
    const params: unknown[] = [verseId]

    const category = url.searchParams.get('category')
    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }

    const subSeriesId = url.searchParams.get('subSeriesId')
    if (subSeriesId) {
      query += ' AND sub_series_id = ?'
      params.push(subSeriesId)
    }

    query += ' ORDER BY is_pinned DESC, sort_order ASC, updated_at DESC'

    const result = await env.DB.prepare(query).bind(...params).all()
    return jsonSuccess(result.results ?? [])
  }

  // GET /api/lore/:id
  async function handleGetLoreEntry(id: string, env: Env): Promise<Response> {
    const result = await env.DB.prepare(
      'SELECT * FROM lore_entries WHERE id = ?'
    ).bind(id).first()
    if (!result) return jsonError('Lore entry not found', 404)
    return jsonSuccess(result)
  }

  // PUT /api/lore/reorder — must be matched BEFORE /api/lore/:id
  async function handleReorderLoreEntries(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as {
      entries: Array<{ id: string; sort_order: number }>
    }
    if (!Array.isArray(body.entries))
      return jsonError('entries array is required', 400)

    const now = Date.now()
    const stmts = body.entries.map(({ id, sort_order }) =>
      env.DB.prepare(
        'UPDATE lore_entries SET sort_order = ?, updated_at = ? WHERE id = ?'
      ).bind(sort_order, now, id)
    )
    if (stmts.length > 0) await env.DB.batch(stmts)
    return jsonSuccess({ reordered: true })
  }

  // PUT /api/lore/:id
  async function handleUpdateLoreEntry(id: string, request: Request, env: Env): Promise<Response> {
    const body = await request.json() as Record<string, unknown>
    const now = Date.now()

    const allowed = [
      'title', 'category', 'content', 'summary', 'tags',
      'linked_character_ids', 'linked_lore_ids',
      'is_pinned', 'sort_order', 'sub_series_id',
    ]

    const updates: string[] = []
    const values: unknown[] = []

    for (const field of allowed) {
      if (field in body) {
        updates.push(`${field} = ?`)
        const val = body[field]
        values.push(
          typeof val === 'boolean' ? (val ? 1 : 0) :
          Array.isArray(val) ? JSON.stringify(val) :
          val
        )
      }
    }

    if (updates.length === 0) return jsonError('No fields to update', 400)
    updates.push('updated_at = ?')
    values.push(now, id)

    await env.DB.prepare(
      `UPDATE lore_entries SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run()

    const updated = await env.DB.prepare(
      'SELECT * FROM lore_entries WHERE id = ?'
    ).bind(id).first()
    return jsonSuccess(updated)
  }

  // DELETE /api/lore/:id
  async function handleDeleteLoreEntry(id: string, env: Env): Promise<Response> {
    await env.DB.prepare(
      'DELETE FROM lore_entries WHERE id = ?'
    ).bind(id).run()
    return jsonSuccess({ deleted: true })
  }

  // GET /api/version-history?entityType=xxx&entityId=xxx
  //   OR ?entityType=character&verseId=xxx (returns all character snapshots for verse)
  async function handleGetVersionHistory(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const entityType = url.searchParams.get('entityType')
    const entityId = url.searchParams.get('entityId')
    const verseId = url.searchParams.get('verseId')

    if (!entityType) return jsonError('entityType is required', 400)

    if (entityId) {
      const result = await env.DB.prepare(
        `SELECT * FROM version_history
         WHERE entity_type = ? AND entity_id = ?
         ORDER BY created_at DESC`
      ).bind(entityType, entityId).all()
      return jsonSuccess(result.results ?? [])
    }

    if (verseId && entityType === 'character') {
      // Get all character IDs in this verse then fetch their snapshots
      const chars = await env.DB.prepare(
        'SELECT id, name FROM characters WHERE verse_id = ?'
      ).bind(verseId).all()
      const charIds = (chars.results ?? []).map(
        (c: Record<string, unknown>) => c.id as string
      )
      if (charIds.length === 0) return jsonSuccess([])

      // Fetch snapshots for all these characters
      const placeholders = charIds.map(() => '?').join(', ')
      const result = await env.DB.prepare(
        `SELECT vh.*, c.name as entity_name
         FROM version_history vh
         JOIN characters c ON vh.entity_id = c.id
         WHERE vh.entity_type = 'character'
           AND vh.entity_id IN (${placeholders})
         ORDER BY vh.created_at DESC`
      ).bind(...charIds).all()
      return jsonSuccess(result.results ?? [])
    }

    return jsonError('entityId or verseId is required', 400)
  }

  // POST /api/version-history
  async function handleCreateSnapshot(request: Request): Promise<Response> {
    const body = await request.json() as Record<string, unknown>
    if (!body.entity_type || !body.entity_id || !body.snapshot)
      return jsonError('entity_type, entity_id, and snapshot are required', 400)
    const id = generateId()
    const now = Date.now()
    await env.DB.prepare(`
      INSERT INTO version_history
        (id, entity_type, entity_id, version_label, snapshot, change_notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.entity_type,
      body.entity_id,
      body.version_label ?? null,
      typeof body.snapshot === 'string' ? body.snapshot : JSON.stringify(body.snapshot),
      body.change_notes ?? null,
      now
    ).run()
    const created = await env.DB.prepare(
      'SELECT * FROM version_history WHERE id = ?'
    ).bind(id).first()
    return jsonSuccess(created, 201)
  }

  // DELETE /api/version-history/:id
  async function handleDeleteSnapshot(id: string): Promise<Response> {
    await env.DB.prepare(
      'DELETE FROM version_history WHERE id = ?'
    ).bind(id).run()
    return jsonSuccess({ deleted: true })
  }

  // --- STATS ENDPOINT FOR PROMPT 12 ---
  interface RoleCount { role: string; count: number }
  interface StageCount { stage: string; count: number }
  interface AlignmentCount { alignment: string; count: number }
  interface CompletionBucket { range: string; count: number; min: number; max: number }
  interface CharacterQuickStat { id: string; name: string; profile_completion?: number; completion: number; narrative_role: string | null }
  interface CharacterConnectionStat { id: string; name: string; connectionCount: number }
  interface WritingTypeStat { type: string; count: number; wordCount: number }
  interface WritingStatusStat { status: string; count: number }
  interface SubSeriesWordStat { subSeriesId: string | null; subSeriesName: string; wordCount: number; pieceCount: number }
  interface WritingQuickStat { id: string; title: string; type: string; wordCount: number }
  interface RelTypeStat { type: string; count: number }
  interface TagFrequency { name: string; count: number }
  interface ProviderStat { provider: string; count: number }
  interface ActivityDay { date: string; count: number }

  interface VerseFullStats {
    overview: {
      characterCount: number
      ocCount: number
      canonCount: number
      auCount: number
      loreCount: number
      writingCount: number
      relationshipCount: number
      conversationCount: number
      subSeriesCount: number
      totalWordCount: number
      totalMessages: number
      averageProfileCompletion: number
      activeGuidelinesCount: number
    }
  
    characters: {
      byNarrativeRole: RoleCount[]
      byArcStage: StageCount[]
      byAlignment: AlignmentCount[]
      completionDistribution: CompletionBucket[]
      mostComplete: CharacterQuickStat[]
      leastComplete: CharacterQuickStat[]
      mostConnected: CharacterConnectionStat[]
    }
  
    writing: {
      byType: WritingTypeStat[]
      byStatus: WritingStatusStat[]
      bySubSeries: SubSeriesWordStat[]
      longestPieces: WritingQuickStat[]
      totalChapterCount: number
      averageWordCount: number
    }
  
    relationships: {
      byType: RelTypeStat[]
      averageConnectionsPerCharacter: number
      totalIntensityAverage: number
    }
  
    foreshadowing: {
      planted: number
      pendingPayoff: number
      resolved: number
      total: number
    }
  
    tags: TagFrequency[]
  
    aiUsage: {
      totalConversations: number
      totalMessages: number
      byProvider: ProviderStat[]
      activeGuidelines: number
    }
  
    activity: ActivityDay[]
  
    computed: {
      writingStreak: number
      longestStreak: number
      mostActiveDay: string | null
      mostProductiveMonth: string | null
      verseCreatedAt: number
      daysSinceCreation: number
    }
  }

  async function handleGetVerseStats(
    verseId: string, env: Env
  ): Promise<Response> {

    // Run all queries in parallel — D1 batch approach
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000

    const [
      // Overview counts
      charStats,
      loreCount,
      writingStats,
      relCount,
      subSeriesCount,
      convoStats,
      guidelinesCount,
      // Character breakdowns
      byRole,
      byArcStage,
      byAlignment,
      completionStats,
      mostComplete,
      leastComplete,
      // Writing breakdowns
      byWritingType,
      byWritingStatus,
      bySubSeries,
      topWriting,
      chapterCount,
      // Relationships
      byRelType,
      relByCharA,
      relByCharB,
      // Foreshadowing
      foreshadowing,
      // AI
      byProvider,
      aiMessages,
      // Activity timestamps — last 365 days
      charActivity,
      writingActivity,
      loreActivity,
      chapterActivity,
    ] = await Promise.all([

      // --- OVERVIEW ---
      env.DB.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN is_oc=1 AND is_au=0 THEN 1 ELSE 0 END) as oc_count,
          SUM(CASE WHEN is_oc=0 AND is_au=0 THEN 1 ELSE 0 END) as canon_count,
          SUM(CASE WHEN is_au=1 THEN 1 ELSE 0 END) as au_count,
          ROUND(AVG(profile_completion),1) as avg_completion
        FROM characters WHERE verse_id=?
      `).bind(verseId).first(),

      env.DB.prepare(
        'SELECT COUNT(*) as count FROM lore_entries WHERE verse_id=?'
      ).bind(verseId).first(),

      env.DB.prepare(`
        SELECT COUNT(*) as count, SUM(word_count) as total_words,
               ROUND(AVG(word_count),0) as avg_words
        FROM writing_pieces WHERE verse_id=?
      `).bind(verseId).first(),

      env.DB.prepare(
        'SELECT COUNT(*) as count FROM character_relationships WHERE verse_id=?'
      ).bind(verseId).first(),

      env.DB.prepare(
        'SELECT COUNT(*) as count FROM sub_series WHERE verse_id=?'
      ).bind(verseId).first(),

      env.DB.prepare(`
        SELECT COUNT(*) as count, SUM(total_messages) as total_msgs
        FROM ai_conversations WHERE verse_id=?
      `).bind(verseId).first(),

      env.DB.prepare(
        'SELECT COUNT(*) as count FROM writing_guidelines WHERE is_active=1'
      ).first(),

      // --- CHARACTER BREAKDOWNS ---
      env.DB.prepare(`
        SELECT narrative_role as role, COUNT(*) as count
        FROM characters WHERE verse_id=? AND narrative_role IS NOT NULL
        GROUP BY narrative_role ORDER BY count DESC
      `).bind(verseId).all(),

      env.DB.prepare(`
        SELECT character_arc_stage as stage, COUNT(*) as count
        FROM characters WHERE verse_id=? AND character_arc_stage IS NOT NULL
        GROUP BY character_arc_stage ORDER BY count DESC
      `).bind(verseId).all(),

      env.DB.prepare(`
        SELECT alignment, COUNT(*) as count
        FROM characters WHERE verse_id=? AND alignment IS NOT NULL
        GROUP BY alignment ORDER BY count DESC
      `).bind(verseId).all(),

      env.DB.prepare(`
        SELECT
          SUM(CASE WHEN profile_completion BETWEEN 0 AND 24 THEN 1 ELSE 0 END) as bucket_0_25,
          SUM(CASE WHEN profile_completion BETWEEN 25 AND 49 THEN 1 ELSE 0 END) as bucket_25_50,
          SUM(CASE WHEN profile_completion BETWEEN 50 AND 74 THEN 1 ELSE 0 END) as bucket_50_75,
          SUM(CASE WHEN profile_completion BETWEEN 75 AND 100 THEN 1 ELSE 0 END) as bucket_75_100
        FROM characters WHERE verse_id=?
      `).bind(verseId).first(),

      env.DB.prepare(`
        SELECT id, name, profile_completion, narrative_role
        FROM characters WHERE verse_id=?
        ORDER BY profile_completion DESC LIMIT 5
      `).bind(verseId).all(),

      env.DB.prepare(`
        SELECT id, name, profile_completion, narrative_role
        FROM characters WHERE verse_id=?
        ORDER BY profile_completion ASC LIMIT 5
      `).bind(verseId).all(),

      // --- WRITING BREAKDOWNS ---
      env.DB.prepare(`
        SELECT type, COUNT(*) as count, SUM(word_count) as wordCount
        FROM writing_pieces WHERE verse_id=?
        GROUP BY type ORDER BY wordCount DESC
      `).bind(verseId).all(),

      env.DB.prepare(`
        SELECT status, COUNT(*) as count
        FROM writing_pieces WHERE verse_id=?
        GROUP BY status ORDER BY count DESC
      `).bind(verseId).all(),

      env.DB.prepare(`
        SELECT wp.sub_series_id, COALESCE(ss.name,\'No Sub-series\') as subSeriesName,
               SUM(wp.word_count) as wordCount, COUNT(*) as pieceCount
        FROM writing_pieces wp
        LEFT JOIN sub_series ss ON wp.sub_series_id=ss.id
        WHERE wp.verse_id=?
        GROUP BY wp.sub_series_id ORDER BY wordCount DESC
      `).bind(verseId).all(),

      env.DB.prepare(`
        SELECT id, title, type, word_count as wordCount
        FROM writing_pieces WHERE verse_id=?
        ORDER BY word_count DESC LIMIT 5
      `).bind(verseId).all(),

      env.DB.prepare(`
        SELECT COUNT(*) as count FROM chapters
        WHERE writing_piece_id IN (SELECT id FROM writing_pieces WHERE verse_id=?)
      `).bind(verseId).first(),

      // --- RELATIONSHIPS ---
      env.DB.prepare(`
        SELECT relationship_type as type, COUNT(*) as count
        FROM character_relationships WHERE verse_id=?
        GROUP BY relationship_type ORDER BY count DESC
      `).bind(verseId).all(),

      env.DB.prepare(`
        SELECT character_a_id as char_id, COUNT(*) as connections
        FROM character_relationships WHERE verse_id=?
        GROUP BY character_a_id
      `).bind(verseId).all(),

      env.DB.prepare(`
        SELECT character_b_id as char_id, COUNT(*) as connections
        FROM character_relationships WHERE verse_id=?
        GROUP BY character_b_id
      `).bind(verseId).all(),

      // --- FORESHADOWING ---
      env.DB.prepare(`
        SELECT status, COUNT(*) as count
        FROM foreshadowing_entries WHERE verse_id=?
        GROUP BY status
      `).bind(verseId).all(),

      // --- AI USAGE ---
      env.DB.prepare(`
        SELECT provider_used as provider, COUNT(*) as count
        FROM ai_conversations WHERE verse_id=? AND provider_used IS NOT NULL
        GROUP BY provider_used ORDER BY count DESC
      `).bind(verseId).all(),

      env.DB.prepare(`
        SELECT SUM(m.token_count) as total_tokens, COUNT(*) as msg_count
        FROM ai_messages m
        JOIN ai_conversations c ON m.conversation_id=c.id
        WHERE c.verse_id=?
      `).bind(verseId).first(),

      // --- ACTIVITY (last 365 days) ---
      env.DB.prepare(
        \'SELECT updated_at FROM characters WHERE verse_id=? AND updated_at > ?\'
      ).bind(verseId, oneYearAgo).all(),

      env.DB.prepare(
        \'SELECT updated_at FROM writing_pieces WHERE verse_id=? AND updated_at > ?\'
      ).bind(verseId, oneYearAgo).all(),

      env.DB.prepare(
        \'SELECT updated_at FROM lore_entries WHERE verse_id=? AND updated_at > ?\'
      ).bind(verseId, oneYearAgo).all(),

      env.DB.prepare(`
        SELECT ch.updated_at FROM chapters ch
        JOIN writing_pieces wp ON ch.writing_piece_id=wp.id
        WHERE wp.verse_id=? AND ch.updated_at > ?
      `).bind(verseId, oneYearAgo).all(),
    ])

    // ─── COMPUTE CONNECTION COUNTS ─────────────────────────────────────
    const connectionMap: Record<string, number> = {}
    for (const row of [...(relByCharA.results ?? []), ...(relByCharB.results ?? [])]) {
      const r = row as Record<string, string | number>
      const id = r.char_id as string
      connectionMap[id] = (connectionMap[id] ?? 0) + (r.connections as number)
    }

    // Get character names for most-connected
    const topConnectedIds = Object.entries(connectionMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id)

    let mostConnected: CharacterConnectionStat[] = []
    if (topConnectedIds.length > 0) {
      const placeholders = topConnectedIds.map(() => \'?\').join(\',\')
      const namesResult = await env.DB.prepare(
        `SELECT id, name FROM characters WHERE id IN (${placeholders})`
      ).bind(...topConnectedIds).all()
      mostConnected = (namesResult.results ?? []).map(r => {
        const row = r as Record<string, string>
        return {
          id: row.id,
          name: row.name,
          connectionCount: connectionMap[row.id] ?? 0,
        }
      }).sort((a, b) => b.connectionCount - a.connectionCount)
    }

    const totalChars = (charStats as Record<string, number>)?.total ?? 0
    const avgConnections = totalChars > 0
      ? Object.values(connectionMap).reduce((s, v) => s + v, 0) / totalChars
      : 0

    // ─── COMPUTE ACTIVITY DAYS ─────────────────────────────────────────
    const dateCounts: Record<string, number> = {}
    const allTimestamps = [
      ...(charActivity.results ?? []),
      ...(writingActivity.results ?? []),
      ...(loreActivity.results ?? []),
      ...(chapterActivity.results ?? []),
    ]
    for (const row of allTimestamps) {
      const ts = (row as Record<string, number>).updated_at
      if (!ts) continue
      const date = new Date(ts).toISOString().slice(0, 10)
      dateCounts[date] = (dateCounts[date] ?? 0) + 1
    }
    const activityDays: ActivityDay[] = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // ─── COMPUTE STREAK ────────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10)
    const activeDates = new Set(activityDays.map(d => d.date))
    let streak = 0
    let longestStreak = 0
    let currentStreak = 0

    // Walking back from today for current streak
    for (let i = 0; i < 366; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      if (activeDates.has(d)) {
        if (currentStreak === 0 || i === streak + 1) {
          currentStreak++
          streak = i
        }
      } else if (i > 0) { break }
    }

    // Longest streak from sorted list
    let consecutive = 0
    for (let i = 0; i < activityDays.length; i++) {
      if (i === 0) { consecutive = 1; continue }
      const prev = new Date(activityDays[i - 1].date).getTime()
      const curr = new Date(activityDays[i].date).getTime()
      if (curr - prev === 86400000) {
        consecutive++
      } else {
        longestStreak = Math.max(longestStreak, consecutive)
        consecutive = 1
      }
    }
    longestStreak = Math.max(longestStreak, consecutive)

    // Most active day
    const mostActiveDay = activityDays.length > 0
      ? activityDays.reduce((max, d) => d.count > max.count ? d : max, activityDays[0]).date
      : null

    // Most productive month
    const monthCounts: Record<string, number> = {}
    for (const { date, count } of activityDays) {
      const month = date.slice(0, 7)
      monthCounts[month] = (monthCounts[month] ?? 0) + count
    }
    const mostProductiveMonth = Object.keys(monthCounts).length > 0
      ? Object.entries(monthCounts).reduce((max, [m, c]) => c > max[1] ? [m, c] : max, [\'\', 0])[0]
      : null

    // Foreshadowing by status
    const fsMap: Record<string, number> = {}
    for (const r of (foreshadowing.results ?? [])) {
      const row = r as Record<string, string | number>
      fsMap[row.status as string] = row.count as number
    }

    // Verse creation date
    const verseRow = await env.DB.prepare(
      \'SELECT created_at FROM verses WHERE id=?\'
    ).bind(verseId).first() as Record<string, number> | null
    const verseCreatedAt = verseRow?.created_at ?? Date.now()
    const daysSinceCreation = Math.floor((Date.now() - verseCreatedAt) / 86400000)

    const cs = charStats as Record<string, number> | null
    const ws = writingStats as Record<string, number> | null
    const rs = relCount as Record<string, number> | null
    const cs2 = completionStats as Record<string, number> | null

    const mapCharacterQuickStat = (rowObj: any): CharacterQuickStat => {
      const completionVal = typeof rowObj.profile_completion === \'number\' 
        ? rowObj.profile_completion 
        : (typeof rowObj.completion === \'number\' ? rowObj.completion : 0);
      return {
        id: rowObj.id as string,
        name: rowObj.name as string,
        completion: completionVal,
        profile_completion: completionVal,
        narrative_role: (rowObj.narrative_role ?? null) as string | null
      }
    }

    const fullStats: VerseFullStats = {
      overview: {
        characterCount: cs?.total ?? 0,
        ocCount: cs?.oc_count ?? 0,
        canonCount: cs?.canon_count ?? 0,
        auCount: cs?.au_count ?? 0,
        loreCount: (loreCount as Record<string, number>)?.count ?? 0,
        writingCount: ws?.count ?? 0,
        relationshipCount: rs?.count ?? 0,
        conversationCount: (convoStats as Record<string, number>)?.count ?? 0,
        subSeriesCount: (subSeriesCount as Record<string, number>)?.count ?? 0,
        totalWordCount: ws?.total_words ?? 0,
        totalMessages: (convoStats as Record<string, number>)?.total_msgs ?? 0,
        averageProfileCompletion: cs?.avg_completion ?? 0,
        activeGuidelinesCount: (guidelinesCount as Record<string, number>)?.count ?? 0,
      },
      characters: {
        byNarrativeRole: (byRole.results ?? []) as RoleCount[],
        byArcStage: (byArcStage.results ?? []) as StageCount[],
        byAlignment: (byAlignment.results ?? []) as AlignmentCount[],
        completionDistribution: [
          { range: \'0–24%\', count: cs2?.bucket_0_25 ?? 0, min: 0, max: 24 },
          { range: \'25–49%\', count: cs2?.bucket_25_50 ?? 0, min: 25, max: 49 },
          { range: \'50–74%\', count: cs2?.bucket_50_75 ?? 0, min: 50, max: 74 },
          { range: \'75–100%\', count: cs2?.bucket_75_100 ?? 0, min: 75, max: 100 },
        ],
        mostComplete: (mostComplete.results ?? []).map(mapCharacterQuickStat),
        leastComplete: (leastComplete.results ?? []).map(mapCharacterQuickStat),
        mostConnected,
      },
      writing: {
        byType: (byWritingType.results ?? []) as WritingTypeStat[],
        byStatus: (byWritingStatus.results ?? []) as WritingStatusStat[],
        bySubSeries: (bySubSeries.results ?? []) as SubSeriesWordStat[],
        longestPieces: (topWriting.results ?? []) as WritingQuickStat[],
        totalChapterCount: (chapterCount as Record<string, number>)?.count ?? 0,
        averageWordCount: ws?.avg_words ?? 0,
      },
      relationships: {
        byType: (byRelType.results ?? []) as RelTypeStat[],
        averageConnectionsPerCharacter: Math.round(avgConnections * 10) / 10,
        totalIntensityAverage: 0,   // not computed server-side for performance
      },
      foreshadowing: {
        planted: fsMap['planted'] ?? 0,
        pendingPayoff: fsMap['pending-payoff'] ?? 0,
        resolved: fsMap['resolved'] ?? 0,
        total: Object.values(fsMap).reduce((s, v) => s + v, 0),
      },
      tags: [],   // computed client-side from character tag arrays
      aiUsage: {
        totalConversations: (convoStats as Record<string, number>)?.count ?? 0,
        totalMessages: (aiMessages as Record<string, number>)?.msg_count ?? 0,
        byProvider: (byProvider.results ?? []) as ProviderStat[],
        activeGuidelines: (guidelinesCount as Record<string, number>)?.count ?? 0,
      },
      activity: activityDays,
      computed: {
        writingStreak: currentStreak,
        longestStreak,
        mostActiveDay,
        mostProductiveMonth,
        verseCreatedAt,
        daysSinceCreation,
      },
    }

    return jsonSuccess(fullStats)
  }

  // GET /api/search?verseId=xxx&q=xxx&types=character,writing,lore,arc,conversation
  async function handleSearch(
    request: Request, env: Env
  ): Promise<Response> {
    const url = new URL(request.url)
    const verseId = url.searchParams.get('verseId')
    const query = url.searchParams.get('q')?.trim()
    const typesParam = url.searchParams.get('types') ?? 'character,writing,lore,arc,conversation'
    const types = typesParam.split(',').map(t => t.trim())

    if (!verseId) return jsonError('verseId is required', 400)
    if (!query || query.length < 1) return jsonSuccess([])

    const pattern = `%${query}%`
    const results: unknown[] = []

    // Run each type query conditionally
    const queries: Promise<unknown>[] = []

    if (types.includes('character')) {
      queries.push(
        env.DB.prepare(`
          SELECT 'character' as type, id, name as title,
            COALESCE(pronouns,'') || CASE WHEN species IS NOT NULL AND pronouns IS NOT NULL THEN ' · ' ELSE '' END || COALESCE(species,'') as subtitle,
            narrative_role as meta,
            profile_completion as completion_pct,
            verse_id, null as sub_series_id, updated_at
          FROM characters
          WHERE verse_id = ?
            AND (name LIKE ? OR full_name LIKE ? OR species LIKE ? OR personality_summary LIKE ? OR aesthetic_vibe LIKE ?)
          ORDER BY
            CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
            profile_completion DESC
          LIMIT 6
        `).bind(verseId, pattern, pattern, pattern, pattern, pattern, pattern).all()
      )
    }

    if (types.includes('writing')) {
      queries.push(
        env.DB.prepare(`
          SELECT 'writing' as type, id, title,
            COALESCE(summary,'') as subtitle,
            type as meta,
            word_count as completion_pct,
            verse_id, sub_series_id, updated_at
          FROM writing_pieces
          WHERE verse_id = ?
            AND (title LIKE ? OR summary LIKE ?)
          ORDER BY
            CASE WHEN title LIKE ? THEN 0 ELSE 1 END,
            updated_at DESC
          LIMIT 5
        `).bind(verseId, pattern, pattern, pattern).all()
      )
    }

    if (types.includes('lore')) {
      queries.push(
        env.DB.prepare(`
          SELECT 'lore' as type, id, title,
            COALESCE(summary,'') as subtitle,
            category as meta,
            0 as completion_pct,
            verse_id, sub_series_id, updated_at
          FROM lore_entries
          WHERE verse_id = ?
            AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)
          ORDER BY
            CASE WHEN title LIKE ? THEN 0 ELSE 1 END,
            updated_at DESC
          LIMIT 5
        `).bind(verseId, pattern, pattern, pattern, pattern).all()
      )
    }

    if (types.includes('conversation')) {
      queries.push(
        env.DB.prepare(`
          SELECT 'conversation' as type, id,
            COALESCE(title, 'Untitled Conversation') as title,
            '' as subtitle,
            provider_used as meta,
            0 as completion_pct,
            verse_id, null as sub_series_id, updated_at
          FROM ai_conversations
          WHERE verse_id = ?
            AND (title LIKE ?)
          ORDER BY updated_at DESC
          LIMIT 4
        `).bind(verseId, pattern).all()
      )
    }

    if (types.includes('arc')) {
      queries.push(
        env.DB.prepare(`
          SELECT 'arc' as type, id, title,
            COALESCE(description,'') as subtitle,
            status as meta,
            0 as completion_pct,
            verse_id, sub_series_id, updated_at
          FROM story_arcs
          WHERE verse_id = ?
            AND (title LIKE ? OR description LIKE ?)
          ORDER BY
            CASE WHEN title LIKE ? THEN 0 ELSE 1 END,
            updated_at DESC
          LIMIT 3
        `).bind(verseId, pattern, pattern, pattern).all()
      )
    }

    if (types.includes('headcanon')) {
      queries.push(
        env.DB.prepare(`
          SELECT 'headcanon' as type, id,
            SUBSTR(content, 1, 80) as title,
            '' as subtitle,
            canon_status as meta,
            0 as completion_pct,
            verse_id, null as sub_series_id, updated_at
          FROM headcanons
          WHERE verse_id = ?
            AND content LIKE ?
          ORDER BY updated_at DESC
          LIMIT 3
        `).bind(verseId, pattern).all()
      )
    }

    if (types.includes('foreshadowing')) {
      queries.push(
        env.DB.prepare(`
          SELECT 'foreshadowing' as type, id,
            SUBSTR(description, 1, 80) as title,
            '' as subtitle,
            status as meta,
            0 as completion_pct,
            verse_id, null as sub_series_id, updated_at
          FROM foreshadowing_entries
          WHERE verse_id = ?
            AND description LIKE ?
          ORDER BY updated_at DESC
          LIMIT 3
        `).bind(verseId, pattern).all()
      )
    }

    // Run all enabled queries in parallel
    const queryResults = await Promise.all(queries)
    for (const result of queryResults) {
      const allResult = result as { results?: unknown[] }
      if (allResult?.results) results.push(...allResult.results)
    }

    // Sort combined results: exact title matches first, then by recency
    results.sort((a, b) => {
      const ra = a as Record<string, unknown>
      const rb = b as Record<string, unknown>
      const aExact = String(ra.title ?? '').toLowerCase() === query.toLowerCase() ? 0 : 1
      const bExact = String(rb.title ?? '').toLowerCase() === query.toLowerCase() ? 0 : 1
      if (aExact !== bExact) return aExact - bExact
      return (rb.updated_at as number ?? 0) - (ra.updated_at as number ?? 0)
    })

    return jsonSuccess(results.slice(0, 25))
  }

  try {
    // ROUTE DISPATCHER
    if (path.startsWith('/api/search')) {
      if (!env.DB) return response(500, false, undefined, 'Database binding unavailable on host.')
      return handleSearch(request, env)
    }
    if (path.startsWith('/api/ai/conversations')) {
      const rest = path.replace('/api/ai/conversations', '')

      if (!env.DB) {
        return response(500, false, undefined, 'Database binding unavailable on host.')
      }

      if (request.method === 'GET' && rest.endsWith('/chain')) {
        const id = rest.replace('/', '').replace('/chain', '')
        return handleGetConversationChain(id)
      }

      if (request.method === 'GET' && rest.startsWith('/') && rest.length > 1) {
        const id = rest.replace('/', '')
        return handleGetConversation(id)
      }

      if (request.method === 'GET' && (rest === '' || rest === '/')) {
        return handleGetConversations(request)
      }

      if (request.method === 'POST' && (rest === '' || rest === '/')) {
        return handleCreateConversation(request)
      }

      if (request.method === 'PUT' && rest.startsWith('/') && rest.length > 1) {
        const id = rest.replace('/', '')
        return handleUpdateConversation(id, request)
      }

      if (request.method === 'DELETE' && rest.startsWith('/') && rest.length > 1) {
        const id = rest.replace('/', '')
        return handleDeleteConversation(id)
      }
    }

    if (path.startsWith('/api/ai/messages')) {
      const rest = path.replace('/api/ai/messages', '')

      if (!env.DB) {
        return response(500, false, undefined, 'Database binding unavailable on host.')
      }

      if (request.method === 'GET' && (rest === '' || rest === '/')) {
        return handleGetMessages(request)
      }

      if (request.method === 'POST' && (rest === '' || rest === '/')) {
        return handleSaveMessage(request)
      }
    }

    if (path.startsWith('/api/writing-guidelines')) {
      const rest = path.replace('/api/writing-guidelines', '')

      // Check for binding
      if (!env.DB) {
        return response(500, false, undefined, 'Database binding unavailable on host.')
      }

      // GET /api/writing-guidelines
      if (request.method === 'GET' && (rest === '' || rest === '/')) {
        const activeOnly = url.searchParams.get('active') === 'true'
        let query = 'SELECT * FROM writing_guidelines'
        if (activeOnly) {
          query += ' WHERE is_active = 1'
        }
        
        const { results } = await env.DB.prepare(query).all()
        const formatted = results.map((r: any) => ({
          ...r,
          is_active: r.is_active === 1 || r.is_active === true,
        }))
        return response(200, true, formatted)
      }

      // POST /api/writing-guidelines
      if (request.method === 'POST' && (rest === '' || rest === '/')) {
        const body: any = await request.json()
        const id = crypto.randomUUID()
        const now = Date.now()
        const r2_key = `guidelines/${id}`

        if (env.R2 && body.content) {
          await env.R2.put(r2_key, body.content)
        }

        await env.DB.prepare(
          'INSERT INTO writing_guidelines (id, filename, display_name, category, r2_key, file_size, is_active, content_preview, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
          .bind(
            id,
            body.filename || body.display_name,
            body.display_name,
            body.category,
            r2_key,
            body.content?.length || 0,
            1, // Active by default
            body.content || '',
            now,
            now
          )
          .run()

        const inserted = {
          id,
          filename: body.filename || body.display_name,
          display_name: body.display_name,
          category: body.category,
          r2_key,
          file_size: body.content?.length || 0,
          is_active: true,
          content_preview: body.content || '',
          created_at: now,
          updated_at: now,
        }
        return response(200, true, inserted)
      }

      // PUT /api/writing-guidelines/:id
      if (request.method === 'PUT' && rest.startsWith('/')) {
        const id = rest.replace('/', '')
        const body: any = await request.json()
        const now = Date.now()

        const existing = await env.DB.prepare('SELECT * FROM writing_guidelines WHERE id = ?')
          .bind(id)
          .first()

        if (!existing) {
          return response(404, false, undefined, 'Guideline catalog not found.')
        }

        const display_name = body.display_name ?? existing.display_name
        const category = body.category ?? existing.category
        const is_active = body.is_active !== undefined ? (body.is_active ? 1 : 0) : existing.is_active
        const filename = body.filename ?? existing.filename
        let content_preview = existing.content_preview
        let file_size = existing.file_size

        if (body.content !== undefined) {
          content_preview = body.content
          file_size = body.content.length
          if (env.R2 && existing.r2_key) {
            await env.R2.put(existing.r2_key, body.content)
          }
        }

        await env.DB.prepare(
          'UPDATE writing_guidelines SET display_name = ?, category = ?, is_active = ?, filename = ?, content_preview = ?, file_size = ?, updated_at = ? WHERE id = ?'
        )
          .bind(display_name, category, is_active, filename, content_preview, file_size, now, id)
          .run()

        const updated = {
          ...existing,
          display_name,
          category,
          is_active: is_active === 1 || is_active === true,
          filename,
          content_preview,
          file_size,
          updated_at: now,
        }
        return response(200, true, updated)
      }

      // DELETE /api/writing-guidelines/:id
      if (request.method === 'DELETE' && rest.startsWith('/')) {
        const id = rest.replace('/', '')

        const existing = await env.DB.prepare('SELECT * FROM writing_guidelines WHERE id = ?')
          .bind(id)
          .first()

        if (!existing) {
          return response(404, false, undefined, 'Guideline not found.')
        }

        if (env.R2 && existing.r2_key) {
          await env.R2.delete(existing.r2_key)
        }

        await env.DB.prepare('DELETE FROM writing_guidelines WHERE id = ?').bind(id).run()

        return response(200, true, { deleted: true })
      }
    }

    if (path.startsWith('/api/foreshadowing')) {
      const rest = path.replace('/api/foreshadowing', '')
      if (!env.DB) return response(500, false, undefined, 'Database binding unavailable on host.')
      
      if (request.method === 'GET' && (rest === '' || rest === '/')) return handleGetForeshadowing(request)
      if (request.method === 'POST' && (rest === '' || rest === '/')) return handleCreateForeshadowing(request)
      if (request.method === 'PUT' && rest.startsWith('/') && rest.length > 1) return handleUpdateForeshadowing(rest.replace('/', ''), request)
      if (request.method === 'DELETE' && rest.startsWith('/') && rest.length > 1) return handleDeleteForeshadowing(rest.replace('/', ''))
    }

    if (path.startsWith('/api/story-arcs')) {
      const rest = path.replace('/api/story-arcs', '')
      if (!env.DB) return response(500, false, undefined, 'Database binding unavailable on host.')
      
      if (request.method === 'GET' && (rest === '' || rest === '/')) return handleGetStoryArcs(request)
      if (request.method === 'POST' && (rest === '' || rest === '/')) return handleCreateStoryArc(request)
      if (request.method === 'PUT' && rest.startsWith('/') && rest.length > 1) return handleUpdateStoryArc(rest.replace('/', ''), request)
      if (request.method === 'DELETE' && rest.startsWith('/') && rest.length > 1) return handleDeleteStoryArc(rest.replace('/', ''))
    }

    if (path.startsWith('/api/headcanons')) {
      const rest = path.replace('/api/headcanons', '')
      if (!env.DB) return response(500, false, undefined, 'Database binding unavailable on host.')
      
      if (request.method === 'GET' && (rest === '' || rest === '/')) return handleGetHeadcanons(request)
      if (request.method === 'POST' && (rest === '' || rest === '/')) return handleCreateHeadcanon(request)
      if (request.method === 'PUT' && rest.startsWith('/') && rest.length > 1) return handleUpdateHeadcanon(rest.replace('/', ''), request)
      if (request.method === 'DELETE' && rest.startsWith('/') && rest.length > 1) return handleDeleteHeadcanon(rest.replace('/', ''))
    }

    if (path.startsWith('/api/lore')) {
      const rest = path.replace('/api/lore', '')
      if (!env.DB) return response(500, false, undefined, 'Database binding unavailable on host.')

      if (request.method === 'PUT' && (rest === '/reorder' || rest === 'reorder')) {
        return handleReorderLoreEntries(request, env)
      }
      if (request.method === 'GET' && (rest === '' || rest === '/')) {
        return handleGetLoreEntries(request, env)
      }
      if (request.method === 'POST' && (rest === '' || rest === '/')) {
        return handleCreateLoreEntry(request)
      }
      if (request.method === 'GET' && rest.startsWith('/') && rest.length > 1) {
        return handleGetLoreEntry(rest.replace('/', ''), env)
      }
      if (request.method === 'PUT' && rest.startsWith('/') && rest.length > 1) {
        return handleUpdateLoreEntry(rest.replace('/', ''), request, env)
      }
      if (request.method === 'DELETE' && rest.startsWith('/') && rest.length > 1) {
        return handleDeleteLoreEntry(rest.replace('/', ''), env)
      }
    }

    if (path.startsWith('/api/version-history')) {
      const rest = path.replace('/api/version-history', '')
      if (!env.DB) return response(500, false, undefined, 'Database binding unavailable on host.')

      if (request.method === 'GET' && (rest === '' || rest === '/')) {
        return handleGetVersionHistory(request)
      }
      if (request.method === 'POST' && (rest === '' || rest === '/')) {
        return handleCreateSnapshot(request)
      }
      if (request.method === 'DELETE' && rest.startsWith('/') && rest.length > 1) {
        return handleDeleteSnapshot(rest.replace('/', ''))
      }
    }

    if (path.startsWith('/api/stats/')) {
      const verseId = path.replace('/api/stats/', '')
      if (!env.DB) return response(500, false, undefined, 'Database binding unavailable on host.')
      if (request.method === 'GET') {
        return handleGetVerseStats(verseId, env)
      }
    }

    return response(404, false, undefined, `Unknown path constraint: ${path}`)
  } catch (err: any) {
    return response(500, false, undefined, err.message || String(err))
  }
}
