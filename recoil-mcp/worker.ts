/**
 * Recoil MCP Server
 * A remote Model Context Protocol server for the Recoil creative writing app.
 * Runs as a Cloudflare Worker. Exposes all verse data as Claude-accessible tools.
 *
 * Authentication: URL path secret
 * Endpoint: https://recoil-mcp.ACCOUNT.workers.dev/YOUR_SECRET/mcp
 */

// ─── ENVIRONMENT ─────────────────────────────────────────────────────────────

interface Env {
  DB: D1Database
  MCP_SECRET: string   // Cloudflare secret — set in Worker dashboard
}

interface D1Database {
  prepare: (query: string) => {
    bind: (...args: any[]) => {
      first: <T = unknown>() => Promise<T | null>
      run: () => Promise<any>
    }
    all: <T = unknown>() => Promise<{ results: T[] }>
  }
}

// ─── MCP JSON-RPC TYPES ──────────────────────────────────────────────────────

interface JSONRPCRequest {
  jsonrpc: '2.0'
  id: string | number | null | undefined
  method: string
  params?: Record<string, unknown>
}

interface JSONRPCResponse {
  jsonrpc: '2.0'
  id: string | number | null | undefined
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, { type: string; description: string; enum?: string[] }>
    required: string[]
  }
}

interface MCPContent {
  type: 'text'
  text: string
}

interface MCPToolResult {
  content: MCPContent[]
  isError: boolean
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function jsonArr(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val as string[]
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return [val] }
  }
  return []
}

function bool(val: unknown): boolean {
  return val === 1 || val === true || val === '1' || val === 'true'
}

function trunc(str: string | null | undefined, max: number): string {
  if (!str) return ''
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

function fmtDate(ts: number | null | undefined): string {
  if (!ts) return 'unknown'
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function ok(result: unknown, id: string | number | null | undefined): JSONRPCResponse {
  return { jsonrpc: '2.0', id, result }
}

function err(code: number, message: string, id?: string | number | null): JSONRPCResponse {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}

function toolSuccess(text: string): MCPToolResult {
  return { content: [{ type: 'text', text }], isError: false }
}

function toolError(text: string): MCPToolResult {
  return { content: [{ type: 'text', text: `Error: ${text}` }], isError: true }
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, mcp-session-id, mcp-protocol-version, Accept',
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

// ─── TOOL DEFINITIONS ────────────────────────────────────────────────────────

const TOOLS: MCPTool[] = [
  {
    name: 'recoil_list_verses',
    description:
      'List all verses (universes) in Recoil. Start here to discover which verse IDs to use in other tools.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'recoil_get_verse_overview',
    description:
      'Get a comprehensive briefing of an entire verse: all characters with their key traits and relationships, lore summary, writing list, and statistics. Call this first when you need to understand a verse deeply before helping with creative work.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID to get an overview of' },
      },
      required: ['verse_id'],
    },
  },
  {
    name: 'recoil_list_characters',
    description:
      'List all characters in a verse. Returns compact profiles including name, pronouns, species, narrative role, arc stage, and aesthetic vibe. Use recoil_get_character for full details on a specific character.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID' },
        narrative_role: {
          type: 'string',
          description: 'Optional filter by role: Protagonist, Antagonist, Supporting, etc.',
        },
      },
      required: ['verse_id'],
    },
  },
  {
    name: 'recoil_get_character',
    description:
      'Get the complete profile of a character by ID, including all personality fields, backstory, symbolic identity, power origin, psychological profile, and notable quotes.',
    inputSchema: {
      type: 'object',
      properties: {
        character_id: { type: 'string', description: 'The character ID' },
      },
      required: ['character_id'],
    },
  },
  {
    name: 'recoil_find_character_by_name',
    description:
      'Find a character by name when you know the name but not the ID. Returns full profile if found. Useful when the user refers to a character by name in conversation.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID to search in' },
        name: { type: 'string', description: 'The character name to search for (case-insensitive partial match)' },
      },
      required: ['verse_id', 'name'],
    },
  },
  {
    name: 'recoil_list_relationships',
    description:
      'List all character relationships in a verse with their types, dynamic labels, and the 4 highest-intensity dimensions for each pair.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID' },
      },
      required: ['verse_id'],
    },
  },
  {
    name: 'recoil_get_character_relationships',
    description:
      'Get all relationships for a specific character, including all 12 intensity dimensions for each relationship. Use this when writing scenes involving a specific character to understand their dynamics with others.',
    inputSchema: {
      type: 'object',
      properties: {
        character_id: { type: 'string', description: 'The character ID' },
      },
      required: ['character_id'],
    },
  },
  {
    name: 'recoil_list_lore',
    description: 'List lore entries in a verse, optionally filtered by category.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID' },
        category: {
          type: 'string',
          description:
            'Optional category filter: world-rules, history, faction, location, concept, item, event, creature, technology, culture, other',
        },
      },
      required: ['verse_id'],
    },
  },
  {
    name: 'recoil_get_lore_entry',
    description: 'Get the full content of a specific lore entry by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        entry_id: { type: 'string', description: 'The lore entry ID' },
      },
      required: ['entry_id'],
    },
  },
  {
    name: 'recoil_list_writing',
    description:
      'List all writing pieces in a verse with their type, status, word count, and summary.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID' },
        type: {
          type: 'string',
          description:
            'Optional type filter: novel, short-story, scene, drabble, dialogue, lore-article, essay, outline',
        },
      },
      required: ['verse_id'],
    },
  },
  {
    name: 'recoil_get_writing',
    description:
      'Get a writing piece by ID. For non-novel types, includes full content. For novels, use recoil_list_chapters then recoil_get_chapter to access content.',
    inputSchema: {
      type: 'object',
      properties: {
        writing_id: { type: 'string', description: 'The writing piece ID' },
        include_content: {
          type: 'string',
          description: 'Set to "true" to include the full HTML content (may be very long)',
        },
      },
      required: ['writing_id'],
    },
  },
  {
    name: 'recoil_list_chapters',
    description: 'List all chapters for a novel, ordered by chapter number.',
    inputSchema: {
      type: 'object',
      properties: {
        writing_piece_id: { type: 'string', description: 'The novel writing piece ID' },
      },
      required: ['writing_piece_id'],
    },
  },
  {
    name: 'recoil_get_chapter',
    description:
      'Get the full content of a specific chapter. Content is HTML from the rich text editor.',
    inputSchema: {
      type: 'object',
      properties: {
        chapter_id: { type: 'string', description: 'The chapter ID' },
      },
      required: ['chapter_id'],
    },
  },
  {
    name: 'recoil_list_headcanons',
    description: 'List headcanons in a verse, optionally filtered by character.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID' },
        character_id: {
          type: 'string',
          description: 'Optional: filter to headcanons about a specific character',
        },
      },
      required: ['verse_id'],
    },
  },
  {
    name: 'recoil_list_foreshadowing',
    description:
      'List all foreshadowing entries in a verse — what seeds have been planted, what is pending payoff, and what has been resolved.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID' },
      },
      required: ['verse_id'],
    },
  },
  {
    name: 'recoil_list_story_arcs',
    description: 'List all story arcs and their planning/completion status.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID' },
      },
      required: ['verse_id'],
    },
  },
  {
    name: 'recoil_search',
    description:
      'Search across all content in a verse — characters, writing, lore, story arcs, headcanons, and conversations — by keyword.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID to search in' },
        query: { type: 'string', description: 'Search terms' },
      },
      required: ['verse_id', 'query'],
    },
  },
  {
    name: 'recoil_get_verse_stats',
    description:
      'Get statistics for a verse: character counts by role and arc stage, total word count, relationship count, lore entry count, writing piece count, and foreshadowing status breakdown.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID' },
      },
      required: ['verse_id'],
    },
  },
  {
    name: 'recoil_create_character',
    description:
      'Create a new original character in a verse. Returns the new character\'s ID. Use recoil_update_character_field to fill in additional details after creation.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID to add the character to' },
        name: { type: 'string', description: 'Character name' },
        pronouns: { type: 'string', description: 'Optional pronouns (e.g. she/her)' },
        species: { type: 'string', description: 'Optional species' },
        narrative_role: {
          type: 'string',
          description:
            'Optional: Protagonist, Antagonist, Supporting, Foil, Catalyst, Wildcard, Mirror, Mentor, Comic Relief, Love Interest, Other',
        },
      },
      required: ['verse_id', 'name'],
    },
  },
  {
    name: 'recoil_update_character_field',
    description:
      'Update a single field on an existing character. Valid field names: full_name, pronouns, age, species, nationality, occupation, height, weight, hair_color, hair_style, eye_color, skin_tone, body_type, distinguishing_features, style_and_fashion, appearance_notes, personality_summary, core_wound, love_language, biggest_fear, deepest_desire, power_origin, power_origin_details, alignment, moral_notes, backstory, early_life, defining_moments, secrets, narrative_role, character_arc_stage, aesthetic_vibe, notes. For array fields (personality_traits, likes, dislikes, fears, desires, habits, quirks, contradictions, affiliations, notable_quotes, tags) pass a JSON array string like \'["item1","item2"]\'.',
    inputSchema: {
      type: 'object',
      properties: {
        character_id: { type: 'string', description: 'The character ID to update' },
        field: { type: 'string', description: 'The field name to update' },
        value: { type: 'string', description: 'The new value (arrays as JSON string)' },
      },
      required: ['character_id', 'field', 'value'],
    },
  },
  {
    name: 'recoil_create_lore_entry',
    description: 'Create a new lore entry in a verse.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID' },
        title: { type: 'string', description: 'Lore entry title' },
        category: {
          type: 'string',
          description:
            'Category: world-rules, history, faction, location, concept, item, event, creature, technology, culture, other',
        },
        content: {
          type: 'string',
          description: 'The lore content as plain text (will be stored as-is)',
        },
        summary: {
          type: 'string',
          description: 'Short summary for previews and search',
        },
      },
      required: ['verse_id', 'title', 'category'],
    },
  },
  {
    name: 'recoil_add_headcanon',
    description: 'Add a new headcanon to a verse, optionally attached to a specific character.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID' },
        content: { type: 'string', description: 'The headcanon text' },
        character_id: {
          type: 'string',
          description: 'Optional: attach to a specific character',
        },
        canon_status: {
          type: 'string',
          description: 'Status: confirmed-canon, soft-headcanon, denied, undecided (default: undecided)',
        },
      },
      required: ['verse_id', 'content'],
    },
  },
  {
    name: 'recoil_create_writing_piece',
    description: 'Create a new writing piece in a verse.',
    inputSchema: {
      type: 'object',
      properties: {
        verse_id: { type: 'string', description: 'The verse ID' },
        title: { type: 'string', description: 'Title of the writing piece' },
        type: {
          type: 'string',
          description: 'Type: novel, short-story, scene, drabble, dialogue, lore-article, essay, outline',
        },
        summary: { type: 'string', description: 'Optional brief summary' },
      },
      required: ['verse_id', 'title', 'type'],
    },
  },
]

// ─── TOOL IMPLEMENTATIONS ────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID()
}

async function toolListVerses(env: Env): Promise<MCPToolResult> {
  try {
    const result = await env.DB.prepare(
      'SELECT * FROM verses ORDER BY sort_order ASC, created_at ASC'
    ).all<Record<string, unknown>>()
    const verses = result.results ?? []
    if (verses.length === 0) {
      return toolSuccess('No verses found in Recoil. The user has not created any verses yet.')
    }
    const lines = verses.map(v =>
      `ID: ${v.id}\nName: ${v.name}\nDescription: ${trunc(v.description as string, 200)}\nCreated: ${fmtDate(v.created_at as number)}`
    )
    return toolSuccess(`VERSES IN RECOIL (${verses.length})\n\n${lines.join('\n\n')}`)
  } catch (e) {
    return toolError(`Database query failed: ${String(e)}`)
  }
}

async function toolGetVerseOverview(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  if (!verseId) return toolError('verse_id is required')

  try {
    const [verseRow, charRows, relRows, loreRows, writingRows] = await Promise.all([
      env.DB.prepare('SELECT * FROM verses WHERE id = ?').bind(verseId).first<Record<string, unknown>>(),
      env.DB.prepare(
        'SELECT id, name, pronouns, species, narrative_role, character_arc_stage, aesthetic_vibe, personality_summary, alignment FROM characters WHERE verse_id = ? ORDER BY narrative_role ASC, name ASC'
      ).bind(verseId).all<Record<string, unknown>>(),
      env.DB.prepare(
        'SELECT cr.*, ca.name as name_a, cb.name as name_b FROM character_relationships cr JOIN characters ca ON cr.character_a_id = ca.id JOIN characters cb ON cr.character_b_id = cb.id WHERE cr.verse_id = ? ORDER BY cr.narrative_importance DESC LIMIT 20'
      ).bind(verseId).all<Record<string, unknown>>(),
      env.DB.prepare(
        'SELECT id, title, category, summary FROM lore_entries WHERE verse_id = ? ORDER BY category ASC, title ASC LIMIT 30'
      ).bind(verseId).all<Record<string, unknown>>(),
      env.DB.prepare(
        'SELECT id, title, type, status, word_count, summary FROM writing_pieces WHERE verse_id = ? ORDER BY updated_at DESC LIMIT 15'
      ).bind(verseId).all<Record<string, unknown>>(),
    ])

    if (!verseRow) return toolError('Verse not found')

    const verse = verseRow
    const chars = charRows.results ?? []
    const rels = relRows.results ?? []
    const lore = loreRows.results ?? []
    const writing = writingRows.results ?? []

    const sections: string[] = []

    // Verse header
    sections.push(
      `VERSE: ${verse.name}\n${verse.description ? `Description: ${verse.description}` : ''}\nCreated: ${fmtDate(verse.created_at as number)}`
    )

    // Characters
    if (chars.length > 0) {
      const charLines = chars.map(c => {
        const sub = [c.pronouns, c.species].filter(Boolean).join(', ')
        const role = [c.narrative_role, c.character_arc_stage].filter(Boolean).join(' — ')
        const summary = trunc(c.personality_summary as string, 120)
        return `• ${c.name}${sub ? ` (${sub})` : ''}${role ? ` — ${role}` : ''}${c.aesthetic_vibe ? `\n  Vibe: "${c.aesthetic_vibe}"` : ''}${summary ? `\n  ${summary}` : ''}`
      })
      sections.push(`CHARACTERS (${chars.length})\n${charLines.join('\n')}`)
    } else {
      sections.push('CHARACTERS\nNone created yet.')
    }

    // Key relationships
    if (rels.length > 0) {
      const relLines = rels.slice(0, 12).map(r => {
        const dims = []
        if (Math.abs(Number(r.emotional_closeness || 0)) > 2)
          dims.push(`closeness ${r.emotional_closeness}`)
        if (Math.abs(Number(r.conflict_level || 0)) > 2)
          dims.push(`conflict ${r.conflict_level}`)
        if (Math.abs(Number(r.romantic_tension || 0)) > 2)
          dims.push(`romance ${r.romantic_tension}`)
        const dimStr = dims.length > 0 ? ` [${dims.join(', ')}]` : ''
        return `• ${r.name_a} — ${r.relationship_type} — ${r.name_b}${r.dynamic_label ? `: ${r.dynamic_label}` : ''}${dimStr}`
      })
      sections.push(`KEY RELATIONSHIPS (${rels.length} total)\n${relLines.join('\n')}`)
    }

    // Lore
    if (lore.length > 0) {
      const byCategory: Record<string, string[]> = {}
      for (const l of lore) {
        const cat = (l.category as string) || 'other'
        if (!byCategory[cat]) byCategory[cat] = []
        byCategory[cat].push(l.title as string)
      }
      const loreLines = Object.entries(byCategory).map(
        ([cat, titles]) => `  ${cat}: ${titles.join(', ')}`
      )
      sections.push(`LORE & WORLDBUILDING (${lore.length} entries)\n${loreLines.join('\n')}`)
    }

    // Writing
    if (writing.length > 0) {
      const writingLines = writing.map(w =>
        `• "${w.title}" (${w.type}, ${w.status}) — ${(w.word_count as number).toLocaleString()} words${w.summary ? `\n  ${trunc(w.summary as string, 100)}` : ''}`
      )
      sections.push(`WRITING (${writing.length} pieces)\n${writingLines.join('\n')}`)
    }

    return toolSuccess(sections.join('\n\n' + '─'.repeat(50) + '\n\n'))
  } catch (e) {
    return toolError(`Failed to load verse overview: ${String(e)}`)
  }
}

async function toolListCharacters(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  if (!verseId) return toolError('verse_id is required')

  try {
    let query =
      'SELECT id, name, pronouns, species, narrative_role, character_arc_stage, aesthetic_vibe, alignment, is_oc, is_au, profile_completion FROM characters WHERE verse_id = ?'
    const params: unknown[] = [verseId]

    if (args.narrative_role) {
      query += ' AND narrative_role = ?'
      params.push(args.narrative_role)
    }

    query += ' ORDER BY narrative_role ASC, name ASC'

    const result = await env.DB.prepare(query).bind(...params).all<Record<string, unknown>>()
    const chars = result.results ?? []

    if (chars.length === 0) return toolSuccess('No characters found matching the criteria.')

    const lines = chars.map(c => {
      const tags = [
        bool(c.is_au) ? 'AU' : bool(c.is_oc) ? 'OC' : 'Canon',
        c.narrative_role,
        c.character_arc_stage,
      ].filter(Boolean).join(' · ')
      return [
        `ID: ${c.id}`,
        `Name: ${c.name}${c.pronouns ? ` (${c.pronouns})` : ''}${c.species ? `, ${c.species}` : ''}`,
        tags ? `Tags: ${tags}` : null,
        c.aesthetic_vibe ? `Vibe: "${c.aesthetic_vibe}"` : null,
        c.alignment ? `Alignment: ${c.alignment}` : null,
        `Profile: ${c.profile_completion}% complete`,
      ]
        .filter(Boolean)
        .join('\n')
    })

    return toolSuccess(`CHARACTERS (${chars.length})\n\n${lines.join('\n\n')}`)
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolGetCharacter(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const id = args.character_id as string
  if (!id) return toolError('character_id is required')

  try {
    const raw = await env.DB.prepare('SELECT * FROM characters WHERE id = ?').bind(id).first<Record<string, unknown>>()
    if (!raw) return toolError('Character not found')

    const c = raw

    const sections: string[] = []

    sections.push(
      [
        `CHARACTER: ${c.name}`,
        c.full_name ? `Full name: ${c.full_name}` : null,
        c.pronouns || c.species || c.age
          ? `Identity: ${[c.pronouns, c.age, c.species, c.nationality].filter(Boolean).join(' · ')}`
          : null,
        c.occupation ? `Occupation: ${c.occupation}` : null,
        bool(c.is_au) ? 'Type: AU Version' : bool(c.is_oc) ? 'Type: Original Character' : 'Type: Canon Character',
      ]
        .filter(Boolean)
        .join('\n')
    )

    const appearance = [
      c.height || c.weight
        ? `Build: ${[c.height, c.weight, c.body_type].filter(Boolean).join(', ')}`
        : null,
      c.hair_color || c.hair_style
        ? `Hair: ${[c.hair_color, c.hair_style].filter(Boolean).join(', ')}`
        : null,
      c.eye_color ? `Eyes: ${c.eye_color}` : null,
      c.skin_tone ? `Skin: ${c.skin_tone}` : null,
      c.distinguishing_features ? `Distinctive: ${c.distinguishing_features}` : null,
      c.style_and_fashion ? `Style: ${c.style_and_fashion}` : null,
      c.appearance_notes ? `Notes: ${c.appearance_notes}` : null,
    ].filter(Boolean)
    if (appearance.length) sections.push(`APPEARANCE\n${appearance.join('\n')}`)

    const personality = [
      c.personality_summary ? c.personality_summary : null,
      jsonArr(c.personality_traits).length
        ? `Traits: ${jsonArr(c.personality_traits).join(', ')}`
        : null,
      jsonArr(c.likes).length ? `Likes: ${jsonArr(c.likes).join(', ')}` : null,
      jsonArr(c.dislikes).length ? `Dislikes: ${jsonArr(c.dislikes).join(', ')}` : null,
      jsonArr(c.fears).length ? `Fears: ${jsonArr(c.fears).join(', ')}` : null,
      jsonArr(c.desires).length ? `Desires: ${jsonArr(c.desires).join(', ')}` : null,
      jsonArr(c.habits).length ? `Habits: ${jsonArr(c.habits).join(', ')}` : null,
      jsonArr(c.quirks).length ? `Quirks: ${jsonArr(c.quirks).join(', ')}` : null,
    ].filter(Boolean)
    if (personality.length) sections.push(`PERSONALITY\n${personality.join('\n')}`)

    const psych = [
      c.core_wound ? `Core wound: ${c.core_wound}` : null,
      c.love_language ? `Love language: ${c.love_language}` : null,
      c.deepest_desire ? `Deepest desire: ${c.deepest_desire}` : null,
      c.biggest_fear ? `Biggest fear: ${c.biggest_fear}` : null,
      jsonArr(c.defense_mechanisms).length
        ? `Defense mechanisms: ${jsonArr(c.defense_mechanisms).join(', ')}`
        : null,
    ].filter(Boolean)
    if (psych.length) sections.push(`PSYCHOLOGICAL PROFILE\n${psych.join('\n')}`)

    const narrative = [
      c.narrative_role ? `Role: ${c.narrative_role}` : null,
      c.character_arc_stage ? `Arc stage: ${c.character_arc_stage}` : null,
      c.aesthetic_vibe ? `Vibe: "${c.aesthetic_vibe}"` : null,
      c.alignment ? `Alignment: ${c.alignment}` : null,
      jsonArr(c.contradictions).length
        ? `Contradictions:\n${jsonArr(c.contradictions).map(x => `  — ${x}`).join('\n')}`
        : null,
      jsonArr(c.affiliations).length
        ? `Affiliations: ${jsonArr(c.affiliations).join(', ')}`
        : null,
    ].filter(Boolean)
    if (narrative.length) sections.push(`NARRATIVE\n${narrative.join('\n')}`)

    const power = [
      c.power_origin ? `Origin: ${c.power_origin}` : null,
      c.power_origin_details ? c.power_origin_details : null,
    ].filter(Boolean)
    if (power.length) sections.push(`POWER & ABILITY\n${power.join('\n')}`)

    const symbolic = [
      c.symbolic_color ? `Color: ${c.symbolic_color}` : null,
      c.symbolic_animal ? `Animal: ${c.symbolic_animal}` : null,
      c.symbolic_element ? `Element: ${c.symbolic_element}` : null,
      c.symbolic_celestial ? `Celestial: ${c.symbolic_celestial}` : null,
      c.symbolic_tarot ? `Tarot: ${c.symbolic_tarot}` : null,
    ].filter(Boolean)
    if (symbolic.length) sections.push(`SYMBOLIC IDENTITY\n${symbolic.join('\n')}`)

    if (c.backstory)
      sections.push(`BACKSTORY\n${c.backstory}`)
    if (c.early_life)
      sections.push(`EARLY LIFE\n${c.early_life}`)
    if (c.defining_moments)
      sections.push(`DEFINING MOMENTS\n${c.defining_moments}`)

    const quotes = jsonArr(c.notable_quotes)
    if (quotes.length) {
      sections.push(`NOTABLE QUOTES\n${quotes.map(q => `"${q}"`).join('\n')}`)
    }

    if (c.notes) sections.push(`NOTES\n${c.notes}`)

    sections.push(`Profile completion: ${c.profile_completion}%\nLast updated: ${fmtDate(c.updated_at as number)}`)

    return toolSuccess(sections.join('\n\n' + '─'.repeat(40) + '\n\n'))
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolFindCharacterByName(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  const name = args.name as string
  if (!verseId || !name) return toolError('verse_id and name are required')

  try {
    const result = await env.DB.prepare(
      'SELECT * FROM characters WHERE verse_id = ? AND (name LIKE ? OR full_name LIKE ?) LIMIT 3'
    )
      .bind(verseId, `%${name}%`, `%${name}%`)
      .all<Record<string, unknown>>()

    const chars = result.results ?? []
    if (chars.length === 0) {
      return toolSuccess(`No character found with name matching "${name}" in this verse.`)
    }

    if (chars.length === 1) {
      return toolGetCharacter(env, { character_id: chars[0].id })
    }

    const matches = chars.map(
      c => `ID: ${c.id} — ${c.name}${c.pronouns ? ` (${c.pronouns})` : ''}${c.narrative_role ? `, ${c.narrative_role}` : ''}`
    )
    return toolSuccess(
      `Multiple characters match "${name}". Use recoil_get_character with the specific ID:\n\n${matches.join('\n')}`
    )
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolListRelationships(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  if (!verseId) return toolError('verse_id is required')

  try {
    const result = await env.DB.prepare(
      `SELECT cr.*, ca.name as name_a, cb.name as name_b
       FROM character_relationships cr
       JOIN characters ca ON cr.character_a_id = ca.id
       JOIN characters cb ON cr.character_b_id = cb.id
       WHERE cr.verse_id = ?
       ORDER BY cr.narrative_importance DESC, cr.updated_at DESC`
    )
      .bind(verseId)
      .all<Record<string, unknown>>()

    const rels = result.results ?? []
    if (rels.length === 0) return toolSuccess('No relationships defined in this verse yet.')

    const lines = rels.map(r => {
      const dims: string[] = []
      const dimMap: [string, number][] = [
        ['closeness', Number(r.emotional_closeness || 0)],
        ['conflict', Number(r.conflict_level || 0)],
        ['trust', Number(r.trust || 0)],
        ['romance', Number(r.romantic_tension || 0)],
        ['power', Number(r.power_imbalance || 0)],
        ['fear', Number(r.fear_factor || 0)],
        ['loyalty', Number(r.loyalty || 0)],
        ['unspoken', Number(r.unspoken_tension || 0)],
      ]
      for (const [label, val] of dimMap) {
        if (Math.abs(val) >= 2.5) dims.push(`${label}:${val > 0 ? '+' : ''}${val}`)
      }
      const dimStr = dims.length > 0 ? ` [${dims.join(' ')}]` : ''
      const narr = `narrative importance: ${r.narrative_importance}`
      return `• ${r.name_a} — ${r.relationship_type} — ${r.name_b}${r.dynamic_label ? `: "${r.dynamic_label}"` : ''}${dimStr}\n  ${narr}${r.evolution_notes ? `\n  Evolution: ${trunc(r.evolution_notes as string, 100)}` : ''}`
    })

    return toolSuccess(`RELATIONSHIPS (${rels.length})\n\n${lines.join('\n\n')}`)
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolGetCharacterRelationships(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const charId = args.character_id as string
  if (!charId) return toolError('character_id is required')

  try {
    const [charRow, relResult] = await Promise.all([
      env.DB.prepare('SELECT name FROM characters WHERE id = ?').bind(charId).first<Record<string, string>>(),
      env.DB.prepare(
        `SELECT cr.*,
           ca.name as name_a, cb.name as name_b,
           CASE WHEN cr.character_a_id = ? THEN cb.id ELSE ca.id END as other_id,
           CASE WHEN cr.character_a_id = ? THEN cb.name ELSE ca.name END as other_name
         FROM character_relationships cr
         JOIN characters ca ON cr.character_a_id = ca.id
         JOIN characters cb ON cr.character_b_id = cb.id
         WHERE cr.character_a_id = ? OR cr.character_b_id = ?
         ORDER BY cr.narrative_importance DESC`
      )
        .bind(charId, charId, charId, charId)
        .all<Record<string, unknown>>(),
    ])

    const charName = charRow?.name ?? 'Unknown'
    const rels = relResult.results ?? []

    if (rels.length === 0) {
      return toolSuccess(`${charName} has no defined relationships yet.`)
    }

    const lines = rels.map(r => {
      return [
        `With: ${r.other_name} (ID: ${r.other_id})`,
        `Type: ${r.relationship_type}${r.dynamic_label ? ` — "${r.dynamic_label}"` : ''}`,
        r.dynamic_description ? `Description: ${r.dynamic_description}` : null,
        `Emotional closeness: ${r.emotional_closeness} | Conflict: ${r.conflict_level} | Trust: ${r.trust}`,
        `Romantic tension: ${r.romantic_tension} | Power imbalance: ${r.power_imbalance} | Fear factor: ${r.fear_factor}`,
        `Loyalty: ${r.loyalty} | Dependency: ${r.dependency} | Respect: ${r.respect_level}`,
        `Unspoken tension: ${r.unspoken_tension} | Shared history: ${r.shared_history_weight} | Narrative importance: ${r.narrative_importance}`,
        r.evolution_notes ? `Evolution: ${r.evolution_notes}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    })

    return toolSuccess(
      `RELATIONSHIPS FOR ${charName.toUpperCase()} (${rels.length})\n\n${lines.join('\n\n')}`
    )
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolListLore(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  if (!verseId) return toolError('verse_id is required')

  try {
    let query =
      'SELECT id, title, category, summary, is_pinned, updated_at FROM lore_entries WHERE verse_id = ?'
    const params: unknown[] = [verseId]

    if (args.category) {
      query += ' AND category = ?'
      params.push(args.category)
    }

    query += ' ORDER BY is_pinned DESC, category ASC, title ASC'

    const result = await env.DB.prepare(query).bind(...params).all<Record<string, unknown>>()
    const entries = result.results ?? []

    if (entries.length === 0) return toolSuccess('No lore entries found.')

    const byCategory: Record<string, typeof entries> = {}
    for (const e of entries) {
      const cat = (e.category as string) || 'other'
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(e)
    }

    const sections = Object.entries(byCategory).map(([cat, items]) => {
      const lines = items.map(
        e =>
          `  • [${e.id}] ${e.title}${bool(e.is_pinned) ? ' 📌' : ''}${e.summary ? `\n    ${trunc(e.summary as string, 120)}` : ''}`
      )
      return `${cat.toUpperCase()}\n${lines.join('\n')}`
    })

    return toolSuccess(`LORE ENTRIES (${entries.length})\n\n${sections.join('\n\n')}`)
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolGetLoreEntry(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const id = args.entry_id as string
  if (!id) return toolError('entry_id is required')

  try {
    const raw = await env.DB.prepare(
      'SELECT * FROM lore_entries WHERE id = ?'
    ).bind(id).first<Record<string, unknown>>()
    if (!raw) return toolError('Lore entry not found')

    const e = raw

    const htmlToText = (html: string): string =>
      html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    const content = e.content ? htmlToText(e.content as string) : ''

    return toolSuccess(
      [
        `LORE ENTRY: ${e.title}`,
        `Category: ${e.category}`,
        e.summary ? `Summary: ${e.summary}` : null,
        `Updated: ${fmtDate(e.updated_at as number)}`,
        content ? `\nCONTENT:\n${content}` : '\n(No content written yet)',
      ]
        .filter(Boolean)
        .join('\n')
    )
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolListWriting(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  if (!verseId) return toolError('verse_id is required')

  try {
    let query =
      'SELECT id, title, type, status, word_count, summary, updated_at FROM writing_pieces WHERE verse_id = ?'
    const params: unknown[] = [verseId]

    if (args.type) {
      query += ' AND type = ?'
      params.push(args.type)
    }

    query += ' ORDER BY updated_at DESC'

    const result = await env.DB.prepare(query).bind(...params).all<Record<string, unknown>>()
    const pieces = result.results ?? []

    if (pieces.length === 0) return toolSuccess('No writing pieces found.')

    const lines = pieces.map(
      w =>
        `ID: ${w.id}\nTitle: "${w.title}" (${w.type}, ${w.status})\nWords: ${(w.word_count as number).toLocaleString()}\nUpdated: ${fmtDate(w.updated_at as number)}${w.summary ? `\n${trunc(w.summary as string, 150)}` : ''}`
    )

    return toolSuccess(`WRITING PIECES (${pieces.length})\n\n${lines.join('\n\n')}`)
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolGetWriting(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const id = args.writing_id as string
  const includeContent = args.include_content === 'true'
  if (!id) return toolError('writing_id is required')

  try {
    const raw = await env.DB.prepare(
      'SELECT * FROM writing_pieces WHERE id = ?'
    ).bind(id).first<Record<string, unknown>>()
    if (!raw) return toolError('Writing piece not found')

    const w = raw

    const htmlToText = (html: string): string =>
      html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    const lines: string[] = [
      `WRITING: "${w.title}"`,
      `Type: ${w.type} | Status: ${w.status} | Words: ${(w.word_count as number).toLocaleString()}`,
      `Updated: ${fmtDate(w.updated_at as number)}`,
    ]

    if (w.summary) lines.push(`Summary: ${w.summary}`)

    if (jsonArr(w.linked_character_ids).length > 0) {
      const charIds = jsonArr(w.linked_character_ids)
      const charNames = await Promise.all(
        charIds.slice(0, 8).map(async cId => {
          const c = await env.DB.prepare(
            'SELECT name FROM characters WHERE id = ?'
          ).bind(cId).first<Record<string, string>>()
          return c?.name ?? cId
        })
      )
      lines.push(`Linked characters: ${charNames.join(', ')}`)
    }

    if (w.type === 'novel') {
      const chapterResult = await env.DB.prepare(
        'SELECT id, title, chapter_number, word_count, status FROM chapters WHERE writing_piece_id = ? ORDER BY chapter_number ASC'
      )
        .bind(id)
        .all<Record<string, unknown>>()
      const chapters = chapterResult.results ?? []
      lines.push(
        `\nCHAPTERS (${chapters.length}):\n${chapters.map(c => `  Ch.${c.chapter_number}: "${c.title ?? 'Untitled'}" — ${c.word_count} words (${c.status}) [ID: ${c.id}]`).join('\n')}`
      )
      lines.push('Use recoil_get_chapter with a chapter ID to read chapter content.')
    } else if (includeContent && w.content) {
      const text = htmlToText(w.content as string)
      const truncatedContent = text.length > 8000 ? text.slice(0, 8000) + '\n\n[Content truncated — very long piece]' : text
      lines.push(`\nCONTENT:\n${truncatedContent}`)
    } else if (!includeContent && w.content) {
      const wordCount = (w.content as string).split(/\s+/).length
      lines.push(`\n(Content available — ${wordCount.toLocaleString()} words. Pass include_content: "true" to read it.)`)
    }

    return toolSuccess(lines.join('\n'))
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolListChapters(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const pieceId = args.writing_piece_id as string
  if (!pieceId) return toolError('writing_piece_id is required')

  try {
    const [pieceRow, chapterResult] = await Promise.all([
      env.DB.prepare('SELECT title FROM writing_pieces WHERE id = ?').bind(pieceId).first<Record<string, string>>(),
      env.DB.prepare(
        'SELECT id, title, chapter_number, word_count, status, notes FROM chapters WHERE writing_piece_id = ? ORDER BY chapter_number ASC'
      )
        .bind(pieceId)
        .all<Record<string, unknown>>(),
    ])

    const pieceName = pieceRow?.title ?? 'Unknown'
    const chapters = chapterResult.results ?? []

    if (chapters.length === 0) return toolSuccess(`"${pieceName}" has no chapters yet.`)

    const totalWords = chapters.reduce((s, c) => s + (c.word_count as number), 0)
    const lines = chapters.map(
      c =>
        `Ch.${c.chapter_number} [ID: ${c.id}]: "${c.title ?? 'Untitled'}" — ${c.word_count} words (${c.status})${c.notes ? `\n  Notes: ${trunc(c.notes as string, 100)}` : ''}`
    )

    return toolSuccess(
      `CHAPTERS OF "${pieceName}" (${chapters.length} chapters, ${totalWords.toLocaleString()} total words)\n\n${lines.join('\n')}`
    )
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolGetChapter(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const id = args.chapter_id as string
  if (!id) return toolError('chapter_id is required')

  try {
    const raw = await env.DB.prepare(
      'SELECT * FROM chapters WHERE id = ?'
    ).bind(id).first<Record<string, unknown>>()
    if (!raw) return toolError('Chapter not found')

    const c = raw

    const htmlToText = (html: string): string =>
      html
        .replace(/<h[1-6][^>]*>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    const content = c.content ? htmlToText(c.content as string) : '(No content written yet)'
    const truncated =
      content.length > 12000
        ? content.slice(0, 12000) + '\n\n[Content truncated at 12,000 characters]'
        : content

    return toolSuccess(
      [
        `CHAPTER ${c.chapter_number}: "${c.title ?? 'Untitled'}"`,
        `Status: ${c.status} | Words: ${c.word_count}`,
        c.notes ? `Notes: ${c.notes}` : null,
        `\n${truncated}`,
      ]
        .filter(Boolean)
        .join('\n')
    )
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolListHeadcanons(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  if (!verseId) return toolError('verse_id is required')

  try {
    let query =
      'SELECT h.*, c.name as character_name FROM headcanons h LEFT JOIN characters c ON h.character_id = c.id WHERE h.verse_id = ?'
    const params: unknown[] = [verseId]

    if (args.character_id) {
      query += ' AND h.character_id = ?'
      params.push(args.character_id)
    }

    query += ' ORDER BY h.canon_status ASC, h.created_at DESC'

    const result = await env.DB.prepare(query).bind(...params).all<Record<string, unknown>>()
    const entries = result.results ?? []

    if (entries.length === 0) return toolSuccess('No headcanons found.')

    const lines = entries.map(
      h =>
        `[${h.canon_status}] ${h.character_name ? `(${h.character_name}) ` : '(General) '}${h.content}${h.notes ? `\n  Notes: ${h.notes}` : ''}`
    )

    return toolSuccess(`HEADCANONS (${entries.length})\n\n${lines.join('\n\n')}`)
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolListForeshadowing(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  if (!verseId) return toolError('verse_id is required')

  try {
    const result = await env.DB.prepare(
      'SELECT * FROM foreshadowing_entries WHERE verse_id = ? ORDER BY status ASC, created_at DESC'
    )
      .bind(verseId)
      .all<Record<string, unknown>>()
    const entries = result.results ?? []

    if (entries.length === 0) return toolSuccess('No foreshadowing entries found.')

    const byStatus: Record<string, typeof entries> = {}
    for (const e of entries) {
      const s = (e.status as string) || 'planted'
      if (!byStatus[s]) byStatus[s] = []
      byStatus[s].push(e)
    }

    const sections = Object.entries(byStatus).map(([status, items]) => {
      const lines = items.map(
        e =>
          `  • ${e.description}${e.planted_in ? `\n    Planted in: ${e.planted_in}` : ''}${e.payoff_in ? `\n    Pays off in: ${e.payoff_in}` : ''}${e.notes ? `\n    Notes: ${e.notes}` : ''}`
      )
      return `${status.toUpperCase()} (${items.length})\n${lines.join('\n')}`
    })

    return toolSuccess(`FORESHADOWING (${entries.length} total)\n\n${sections.join('\n\n')}`)
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolListStoryArcs(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  if (!verseId) return toolError('verse_id is required')

  try {
    const result = await env.DB.prepare(
      'SELECT * FROM story_arcs WHERE verse_id = ? ORDER BY status ASC, sort_order ASC'
    )
      .bind(verseId)
      .all<Record<string, unknown>>()
    const arcs = result.results ?? []

    if (arcs.length === 0) return toolSuccess('No story arcs defined yet.')

    const lines = arcs.map(
      a =>
        `[${a.status}] ${a.title}${a.description ? `\n  ${trunc(a.description as string, 150)}` : ''}`
    )

    return toolSuccess(`STORY ARCS (${arcs.length})\n\n${lines.join('\n\n')}`)
  } catch (e) {
    return toolError(`Database error: ${String(e)}`)
  }
}

async function toolSearch(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  const query = args.query as string
  if (!verseId || !query) return toolError('verse_id and query are required')

  const pattern = `%${query}%`

  try {
    const [chars, lore, writing, arcs, headcanons] = await Promise.all([
      env.DB.prepare(
        `SELECT 'character' as type, id, name as title, COALESCE(pronouns,'') || ' ' || COALESCE(species,'') as subtitle
         FROM characters WHERE verse_id = ? AND (name LIKE ? OR personality_summary LIKE ? OR backstory LIKE ?) LIMIT 5`
      )
        .bind(verseId, pattern, pattern, pattern)
        .all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT 'lore' as type, id, title, COALESCE(summary,'') as subtitle
         FROM lore_entries WHERE verse_id = ? AND (title LIKE ? OR content LIKE ?) LIMIT 5`
      )
        .bind(verseId, pattern, pattern)
        .all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT 'writing' as type, id, title, COALESCE(summary,'') as subtitle
         FROM writing_pieces WHERE verse_id = ? AND (title LIKE ? OR summary LIKE ?) LIMIT 5`
      )
        .bind(verseId, pattern, pattern)
        .all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT 'story-arc' as type, id, title, COALESCE(description,'') as subtitle
         FROM story_arcs WHERE verse_id = ? AND (title LIKE ? OR description LIKE ?) LIMIT 3`
      )
        .bind(verseId, pattern, pattern)
        .all<Record<string, unknown>>(),
      env.DB.prepare(
        `SELECT 'headcanon' as type, id, SUBSTR(content,1,80) as title, canon_status as subtitle
         FROM headcanons WHERE verse_id = ? AND content LIKE ? LIMIT 5`
      )
        .bind(verseId, pattern)
        .all<Record<string, unknown>>(),
    ])

    const results = [
      ...(chars.results ?? []),
      ...(lore.results ?? []),
      ...(writing.results ?? []),
      ...(arcs.results ?? []),
      ...(headcanons.results ?? []),
    ]

    if (results.length === 0) return toolSuccess(`No results found for "${query}" in this verse.`)

    const lines = results.map(
      r => `[${(r.type as string).toUpperCase()}] ${r.title}${r.subtitle ? ` — ${r.subtitle}` : ''} (ID: ${r.id})`
    )

    return toolSuccess(`SEARCH RESULTS FOR "${query}" (${results.length})\n\n${lines.join('\n')}`)
  } catch (e) {
    return toolError(`Database error during search: ${String(e)}`)
  }
}

async function toolGetVerseStats(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  if (!verseId) return toolError('verse_id is required')

  try {
    const [charStats, relCount, loreCount, writingCount, wordCount, foresCount] = await Promise.all([
      env.DB.prepare(
        'SELECT narrative_role, character_arc_stage, COUNT(*) as cnt FROM characters WHERE verse_id = ? GROUP BY narrative_role, character_arc_stage'
      ).bind(verseId).all<Record<string, unknown>>(),
      env.DB.prepare(
        'SELECT COUNT(*) as cnt FROM character_relationships WHERE verse_id = ?'
      ).bind(verseId).first<Record<string, number>>(),
      env.DB.prepare(
        'SELECT COUNT(*) as cnt FROM lore_entries WHERE verse_id = ?'
      ).bind(verseId).first<Record<string, number>>(),
      env.DB.prepare(
        'SELECT COUNT(*) as cnt FROM writing_pieces WHERE verse_id = ?'
      ).bind(verseId).first<Record<string, number>>(),
      env.DB.prepare(
        'SELECT SUM(word_count) as total_words FROM writing_pieces WHERE verse_id = ?'
      ).bind(verseId).first<Record<string, number>>(),
      env.DB.prepare(
        'SELECT status, COUNT(*) as cnt FROM foreshadowing_entries WHERE verse_id = ? GROUP BY status'
      ).bind(verseId).all<Record<string, unknown>>(),
    ])

    const chars = charStats.results ?? []
    const fores = foresCount.results ?? []

    const rels = (relCount as any)?.cnt ?? 0
    const lores = (loreCount as any)?.cnt ?? 0
    const writings = (writingCount as any)?.cnt ?? 0
    const words = (wordCount as any)?.total_words ?? 0

    // Process roles and arc stages
    const roles: Record<string, number> = {}
    const stages: Record<string, number> = {}
    let totalChars = 0

    for (const c of chars) {
      const r = (c.narrative_role as string) || 'Unspecified'
      const s = (c.character_arc_stage as string) || 'Unspecified'
      const count = (c.cnt as number) || 0
      totalChars += count

      roles[r] = (roles[r] || 0) + count
      stages[s] = (stages[s] || 0) + count
    }

    const sections: string[] = [
      `VERSE STATISTICS (ID: ${verseId})`,
      `Total Characters: ${totalChars}`,
      `Total Relationships: ${rels}`,
      `Total Lore Entries: ${lores}`,
      `Total Writing Pieces: ${writings}`,
      `Total Word Count: ${Number(words).toLocaleString()} words`
    ]

    if (totalChars > 0) {
      const roleLines = Object.entries(roles).map(([k, v]) => `  — ${k}: ${v}`)
      const stageLines = Object.entries(stages).map(([k, v]) => `  — ${k}: ${v}`)
      sections.push(`Characters by Narrative Role:\n${roleLines.join('\n')}`)
      sections.push(`Characters by Arc Stage:\n${stageLines.join('\n')}`)
    }

    if (fores.length > 0) {
      const foresLines = fores.map(f => `  — ${(f.status as string || 'planted').toUpperCase()}: ${f.cnt}`)
      sections.push(`Foreshadowing Seed Payoffs:\n${foresLines.join('\n')}`)
    }

    return toolSuccess(sections.join('\n\n'))
  } catch (e) {
    return toolError(`Database error loading stats: ${String(e)}`)
  }
}

async function toolCreateCharacter(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  const name = args.name as string
  const pronouns = args.pronouns as string | undefined
  const species = args.species as string | undefined
  const narrative_role = args.narrative_role as string | undefined

  if (!verseId || !name) return toolError('verse_id and name are required')

  const id = generateId()
  const now = Date.now()

  try {
    await env.DB.prepare(
      `INSERT INTO characters (
        id, verse_id, name, pronouns, species, narrative_role,
        is_oc, is_au, profile_completion, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, 5, ?, ?)`
    )
      .bind(id, verseId, name, pronouns ?? null, species ?? null, narrative_role ?? null, now, now)
      .run()

    return toolSuccess(`Successfully created character "${name}" with ID: ${id}`)
  } catch (e) {
    return toolError(`Failed to create character: ${String(e)}`)
  }
}

async function toolUpdateCharacterField(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const characterId = args.character_id as string
  const field = args.field as string
  const value = args.value as string

  if (!characterId || !field || value === undefined) {
    return toolError('character_id, field, and value are required')
  }

  const validFields = [
    'full_name', 'pronouns', 'age', 'species', 'nationality', 'occupation',
    'height', 'weight', 'hair_color', 'hair_style', 'eye_color', 'skin_tone',
    'body_type', 'distinguishing_features', 'style_and_fashion', 'appearance_notes',
    'personality_summary', 'core_wound', 'love_language', 'biggest_fear',
    'deepest_desire', 'power_origin', 'power_origin_details', 'alignment',
    'moral_notes', 'backstory', 'early_life', 'defining_moments', 'secrets',
    'narrative_role', 'character_arc_stage', 'aesthetic_vibe', 'notes',
    'personality_traits', 'likes', 'dislikes', 'fears', 'desires', 'habits',
    'quirks', 'contradictions', 'affiliations', 'notable_quotes', 'tags'
  ]

  if (!validFields.includes(field)) {
    return toolError(`Invalid field: ${field}. Must be one of the documented field names.`)
  }

  const now = Date.now()

  try {
    const existing = await env.DB.prepare('SELECT id FROM characters WHERE id = ?').bind(characterId).first<Record<string, unknown>>()
    if (!existing) return toolError(`Character with ID ${characterId} not found`)

    await env.DB.prepare(
      `UPDATE characters SET ${field} = ?, updated_at = ? WHERE id = ?`
    )
      .bind(value, now, characterId)
      .run()

    return toolSuccess(`Successfully updated field "${field}" on character ${characterId} to "${trunc(value, 60)}"`)
  } catch (e) {
    return toolError(`Failed to update character field: ${String(e)}`)
  }
}

async function toolCreateLoreEntry(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  const title = args.title as string
  const category = args.category as string
  const content = args.content as string | undefined
  const summary = args.summary as string | undefined

  if (!verseId || !title || !category) {
    return toolError('verse_id, title, and category are required')
  }

  const id = generateId()
  const now = Date.now()

  try {
    await env.DB.prepare(
      `INSERT INTO lore_entries (
        id, verse_id, title, category, content, summary, is_pinned, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
      .bind(id, verseId, title, category, content ?? '', summary ?? '', now, now)
      .run()

    return toolSuccess(`Successfully created lore entry "${title}" with ID: ${id}`)
  } catch (e) {
    return toolError(`Failed to create lore entry: ${String(e)}`)
  }
}

async function toolAddHeadcanon(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  const content = args.content as string
  const characterId = args.character_id as string | undefined
  const canonStatus = args.canon_status as string | undefined

  if (!verseId || !content) {
    return toolError('verse_id and content are required')
  }

  const id = generateId()
  const now = Date.now()
  const status = canonStatus || 'undecided'

  try {
    await env.DB.prepare(
      `INSERT INTO headcanons (
        id, verse_id, content, character_id, canon_status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, null, ?, ?)`
    )
      .bind(id, verseId, content, characterId ?? null, status, now, now)
      .run()

    return toolSuccess(`Successfully added headcanon (${status}) with ID: ${id}`)
  } catch (e) {
    return toolError(`Failed to add headcanon: ${String(e)}`)
  }
}

async function toolCreateWritingPiece(
  env: Env, args: Record<string, unknown>
): Promise<MCPToolResult> {
  const verseId = args.verse_id as string
  const title = args.title as string
  const type = args.type as string
  const summary = args.summary as string | undefined

  if (!verseId || !title || !type) {
    return toolError('verse_id, title, and type are required')
  }

  const id = generateId()
  const now = Date.now()

  try {
    await env.DB.prepare(
      `INSERT INTO writing_pieces (
        id, verse_id, title, type, summary, status, content, word_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'draft', '', 0, ?, ?)`
    )
      .bind(id, verseId, title, type, summary ?? '', now, now)
      .run()

    return toolSuccess(`Successfully created writing piece "${title}" (${type}) with ID: ${id}`)
  } catch (e) {
    return toolError(`Failed to create writing piece: ${String(e)}`)
  }
}

// ─── ROUTING & ROUTER HANDLERS ───────────────────────────────────────────────

async function handleCallTool(env: Env, name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
  const targetArgs = args || {}
  switch (name) {
    case 'recoil_list_verses':
      return await toolListVerses(env)
    case 'recoil_get_verse_overview':
      return await toolGetVerseOverview(env, targetArgs)
    case 'recoil_list_characters':
      return await toolListCharacters(env, targetArgs)
    case 'recoil_get_character':
      return await toolGetCharacter(env, targetArgs)
    case 'recoil_find_character_by_name':
      return await toolFindCharacterByName(env, targetArgs)
    case 'recoil_list_relationships':
      return await toolListRelationships(env, targetArgs)
    case 'recoil_get_character_relationships':
      return await toolGetCharacterRelationships(env, targetArgs)
    case 'recoil_list_lore':
      return await toolListLore(env, targetArgs)
    case 'recoil_get_lore_entry':
      return await toolGetLoreEntry(env, targetArgs)
    case 'recoil_list_writing':
      return await toolListWriting(env, targetArgs)
    case 'recoil_get_writing':
      return await toolGetWriting(env, targetArgs)
    case 'recoil_list_chapters':
      return await toolListChapters(env, targetArgs)
    case 'recoil_get_chapter':
      return await toolGetChapter(env, targetArgs)
    case 'recoil_list_headcanons':
      return await toolListHeadcanons(env, targetArgs)
    case 'recoil_list_foreshadowing':
      return await toolListForeshadowing(env, targetArgs)
    case 'recoil_list_story_arcs':
      return await toolListStoryArcs(env, targetArgs)
    case 'recoil_search':
      return await toolSearch(env, targetArgs)
    case 'recoil_get_verse_stats':
      return await toolGetVerseStats(env, targetArgs)
    case 'recoil_create_character':
      return await toolCreateCharacter(env, targetArgs)
    case 'recoil_update_character_field':
      return await toolUpdateCharacterField(env, targetArgs)
    case 'recoil_create_lore_entry':
      return await toolCreateLoreEntry(env, targetArgs)
    case 'recoil_add_headcanon':
      return await toolAddHeadcanon(env, targetArgs)
    case 'recoil_create_writing_piece':
      return await toolCreateWritingPiece(env, targetArgs)
    default:
      return toolError(`Tool not found: ${name}`)
  }
}

// ─── EXPORT WORKER FETCH HANDLER ─────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle Preflights
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(), status: 204 })
    }

    const pathParts = url.pathname.split('/').filter(Boolean)
    const secret = pathParts[0]

    // Verify secret if set in environment
    if (env.MCP_SECRET && secret !== env.MCP_SECRET) {
      return new Response('Unauthorized: Invalid secret key', {
        status: 401,
        headers: { 'Content-Type': 'text/plain', ...corsHeaders() }
      })
    }

    // Ensure it's pointing to MCP endpoint or sub-routes
    const isMcpPath = pathParts[1] === 'mcp' || pathParts[0] === 'mcp'
    if (!isMcpPath && url.pathname !== '/' && url.pathname !== '/mcp') {
      return new Response('Recoil MCP Server Running. Connect via path secret and /mcp.', {
        status: 200,
        headers: { 'Content-Type': 'text/plain', ...corsHeaders() }
      })
    }

    if (request.method !== 'POST') {
      return jsonResponse({
        status: 'online',
        message: 'Recoil remote MCP Server is fully operational.',
        supported_tools: TOOLS.length,
        spec_version: '2024-11-05'
      })
    }

    try {
      const payload = await request.json() as JSONRPCRequest
      const id = payload.id

      if (payload.jsonrpc !== '2.0') {
        return jsonResponse(err(-32600, 'Invalid request: not JSON-RPC 2.0', id), 400)
      }

      // Check method
      if (payload.method === 'tools/list') {
        return jsonResponse(ok({ tools: TOOLS }, id))
      }

      if (payload.method === 'tools/call') {
        const params = payload.params as Record<string, unknown> | undefined
        if (!params || typeof params.name !== 'string') {
          return jsonResponse(err(-32602, 'Invalid params: "name" must be a string', id), 400)
        }
        const toolName = params.name
        const toolArgs = (params.arguments as Record<string, unknown>) || {}
        const executionResult = await handleCallTool(env, toolName, toolArgs)
        return jsonResponse(ok(executionResult, id))
      }

      // Support calling tools directly by name as a fallback JSON-RPC shortcut
      const matchesTool = TOOLS.some(t => t.name === payload.method)
      if (matchesTool) {
        const toolArgs = payload.params || {}
        const executionResult = await handleCallTool(env, payload.method, toolArgs)
        return jsonResponse(ok(executionResult, id))
      }

      return jsonResponse(err(-32601, `Method not found: ${payload.method}`, id), 404)
    } catch (e) {
      return jsonResponse(err(-32603, `Internal server error: ${String(e)}`), 500)
    }
  }
}
