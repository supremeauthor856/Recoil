interface Env {
  DB: {
    prepare: (query: string) => {
      bind: (...args: any[]) => {
        first: () => Promise<any>
        run: () => Promise<any>
      }
      all: () => Promise<{ results: any[] }>
    }
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

  try {
    // ROUTE DISPATCHER
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
      
      if (request.method === 'POST' && (rest === '' || rest === '/')) return handleCreateLoreEntry(request)
      // GET/PUT/DELETE remain stubbed for Prompt 14
    }

    return response(404, false, undefined, `Unknown path constraint: ${path}`)
  } catch (err: any) {
    return response(500, false, undefined, err.message || String(err))
  }
}
