export interface ExtractedChubCharacter {
  name: string
  description?: string
  personality_summary?: string
  backstory?: string
  personality_traits?: string[]
  tags?: string[]
  notes?: string
  species?: string
  age?: string
  gender?: string
  role?: string
  is_oc?: boolean

  // Detailed profile fields supported by Recoil
  full_name?: string
  pronouns?: string
  nationality?: string
  occupation?: string
  height?: string
  weight?: string
  hair_color?: string
  hair_style?: string
  eye_color?: string
  skin_tone?: string
  body_type?: string
  distinguishing_features?: string
  style_and_fashion?: string
  appearance_notes?: string
  likes?: string[]
  dislikes?: string[]
  fears?: string[]
  desires?: string[]
  habits?: string[]
  quirks?: string[]
  core_wound?: string
  love_language?: string
  deepest_desire?: string
  biggest_fear?: string
  power_origin?: string
  power_origin_details?: string
  alignment?: string
  early_life?: string
  defining_moments?: string
  narrative_role?: string
  character_arc_stage?: string
  aesthetic_vibe?: string
  contradictions?: string[]
  affiliations?: string[]
  notable_quotes?: string[]

  // Greetings and scenes
  greetings?: { title: string; type: 'scene' | 'dialogue'; content: string }[]
}

export interface ExtractedChubLore {
  title: string
  content: string
  category: string
  tags?: string[]
}

export interface ExtractedChubData {
  verseName: string
  verseDescription?: string
  characters: ExtractedChubCharacter[]
  loreEntries: ExtractedChubLore[]
}

// Escapes special characters for regex safety
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper to clean up bracketed descriptors
function cleanValue(val: string): string {
  return val.replace(/^["'(\s]+|["')\s]+$/g, '').trim();
}

// Extractor using W++, YAML, and key-value formats
function extractFieldsFromText(text: string, character: Partial<ExtractedChubCharacter>) {
  if (!text) return

  const fields = [
    { keys: ['age'], target: 'age' },
    { keys: ['species', 'race'], target: 'species' },
    { keys: ['gender', 'sex'], target: 'gender' },
    { keys: ['pronouns'], target: 'pronouns' },
    { keys: ['nationality', 'origin'], target: 'nationality' },
    { keys: ['occupation', 'job', 'class', 'role'], target: 'occupation' },
    { keys: ['height'], target: 'height' },
    { keys: ['weight'], target: 'weight' },
    { keys: ['hair', 'hair_color'], target: 'hair_color' },
    { keys: ['hair_style'], target: 'hair_style' },
    { keys: ['eyes', 'eye_color'], target: 'eye_color' },
    { keys: ['skin', 'skin_tone'], target: 'skin_tone' },
    { keys: ['body_type', 'physique'], target: 'body_type' },
    { keys: ['distinguishing_features', 'scars', 'tattoos'], target: 'distinguishing_features' },
    { keys: ['style', 'fashion', 'clothing'], target: 'style_and_fashion' },
    { keys: ['likes', 'hobbies'], target: 'likes', isArray: true },
    { keys: ['dislikes', 'hates'], target: 'dislikes', isArray: true },
    { keys: ['fears', 'phobias'], target: 'fears', isArray: true },
    { keys: ['desires', 'wants', 'goals'], target: 'desires', isArray: true },
    { keys: ['habits'], target: 'habits', isArray: true },
    { keys: ['quirks'], target: 'quirks', isArray: true },
    { keys: ['alignment'], target: 'alignment' },
    { keys: ['wound', 'core_wound', 'trauma'], target: 'core_wound' },
    { keys: ['deepest_desire'], target: 'deepest_desire' },
    { keys: ['biggest_fear'], target: 'biggest_fear' },
    { keys: ['love_language'], target: 'love_language' },
    { keys: ['vibe', 'aesthetic'], target: 'aesthetic_vibe' },
    { keys: ['role', 'narrative_role'], target: 'narrative_role' },
  ]

  for (const field of fields) {
    for (const key of field.keys) {
      // 1. W++ format: key("value") or key(value)
      const wppRegex = new RegExp(`\\b${escapeRegExp(key)}\\s*\\(\\s*"([^"]+)"\\s*\\)`, 'i')
      const wppMatch = text.match(wppRegex)
      if (wppMatch && wppMatch[1]) {
        setField(character, field.target, cleanValue(wppMatch[1]), field.isArray)
        continue
      }

      const wppNoQuotesRegex = new RegExp(`\\b${escapeRegExp(key)}\\s*\\(\\s*([^)]+)\\s*\\)`, 'i')
      const wppNoQuotesMatch = text.match(wppNoQuotesRegex)
      if (wppNoQuotesMatch && wppNoQuotesMatch[1] && !wppNoQuotesMatch[1].includes('"')) {
        setField(character, field.target, cleanValue(wppNoQuotesMatch[1]), field.isArray)
        continue
      }

      // 2. Key-Value style: Key: Value (handling optional Markdown bullet points)
      const kvRegex = new RegExp(`(?:^|\\n)\\s*[-*]?\\s*\\b${escapeRegExp(key)}\\b\\s*:\\s*([^\\n]+)`, 'i')
      const kvMatch = text.match(kvRegex)
      if (kvMatch && kvMatch[1]) {
        setField(character, field.target, cleanValue(kvMatch[1]), field.isArray)
        continue
      }
    }
  }
}

function setField(char: any, field: string, val: string, isArray?: boolean) {
  if (!val) return
  if (isArray) {
    const items = val
      .split(/[,+;\n]/)
      .map(t => t.replace(/[[\]'"]/g, '').trim())
      .filter(Boolean)
    if (items.length > 0) {
      char[field] = Array.from(new Set([...(char[field] || []), ...items]))
    }
  } else {
    if (!char[field]) {
      char[field] = val
    }
  }
}

// Maps a generic lore content string to an appropriate Recoil category
export function mapToLoreCategory(title: string, content: string): string {
  let category = 'other'
  const normalizedTitle = title.toLowerCase()
  const normalizedContent = content.toLowerCase()
  const fullSearchText = `${normalizedTitle} ${normalizedContent}`

  if (
    fullSearchText.includes('rule') ||
    fullSearchText.includes('law') ||
    fullSearchText.includes('magic system') ||
    fullSearchText.includes('mechanic') ||
    fullSearchText.includes('lorebook-rules')
  ) {
    category = 'world-rules'
  } else if (
    fullSearchText.includes('history') ||
    fullSearchText.includes('past') ||
    fullSearchText.includes('timeline') ||
    fullSearchText.includes('war') ||
    fullSearchText.includes('era') ||
    fullSearchText.includes('century') ||
    fullSearchText.includes('year')
  ) {
    category = 'history'
  } else if (
    fullSearchText.includes('faction') ||
    fullSearchText.includes('group') ||
    fullSearchText.includes('guild') ||
    fullSearchText.includes('clan') ||
    fullSearchText.includes('organization') ||
    fullSearchText.includes('army') ||
    fullSearchText.includes('cult') ||
    fullSearchText.includes('house') ||
    fullSearchText.includes('company')
  ) {
    category = 'faction'
  } else if (
    fullSearchText.includes('location') ||
    fullSearchText.includes('city') ||
    fullSearchText.includes('town') ||
    fullSearchText.includes('land') ||
    fullSearchText.includes('kingdom') ||
    fullSearchText.includes('world') ||
    fullSearchText.includes('place') ||
    fullSearchText.includes('continent') ||
    fullSearchText.includes('castle') ||
    fullSearchText.includes('room') ||
    fullSearchText.includes('building')
  ) {
    category = 'location'
  } else if (
    fullSearchText.includes('item') ||
    fullSearchText.includes('weapon') ||
    fullSearchText.includes('sword') ||
    fullSearchText.includes('artifact') ||
    fullSearchText.includes('relic') ||
    fullSearchText.includes('shield') ||
    fullSearchText.includes('ring') ||
    fullSearchText.includes('book') ||
    fullSearchText.includes('device')
  ) {
    category = 'item'
  } else if (
    fullSearchText.includes('event') ||
    fullSearchText.includes('ceremony') ||
    fullSearchText.includes('festival') ||
    fullSearchText.includes('holiday') ||
    fullSearchText.includes('battle') ||
    fullSearchText.includes('incident') ||
    fullSearchText.includes('anniversary')
  ) {
    category = 'event'
  } else if (
    fullSearchText.includes('creature') ||
    fullSearchText.includes('beast') ||
    fullSearchText.includes('monster') ||
    fullSearchText.includes('animal') ||
    fullSearchText.includes('dragon') ||
    fullSearchText.includes('demon') ||
    fullSearchText.includes('species') ||
    fullSearchText.includes('alien')
  ) {
    category = 'creature'
  } else if (
    fullSearchText.includes('tech') ||
    fullSearchText.includes('machine') ||
    fullSearchText.includes('engine') ||
    fullSearchText.includes('cyber') ||
    fullSearchText.includes('ai') ||
    fullSearchText.includes('robot') ||
    fullSearchText.includes('computer')
  ) {
    category = 'technology'
  } else if (
    fullSearchText.includes('culture') ||
    fullSearchText.includes('tradition') ||
    fullSearchText.includes('custom') ||
    fullSearchText.includes('religion') ||
    fullSearchText.includes('god') ||
    fullSearchText.includes('belief') ||
    fullSearchText.includes('dress') ||
    fullSearchText.includes('ritual') ||
    fullSearchText.includes('art') ||
    fullSearchText.includes('food')
  ) {
    category = 'culture'
  } else if (
    fullSearchText.includes('concept') ||
    fullSearchText.includes('idea') ||
    fullSearchText.includes('philosophy') ||
    fullSearchText.includes('theory') ||
    fullSearchText.includes('definition')
  ) {
    category = 'concept'
  }

  return category
}

export function parseChubJson(jsonStr: string): ExtractedChubData | null {
  try {
    const root = JSON.parse(jsonStr)
    if (!root || typeof root !== 'object') return null

    const characters: ExtractedChubCharacter[] = []
    const loreEntries: ExtractedChubLore[] = []
    const extractedNames = new Set<string>()

    let mainVerseName = 'New Imported Universe'
    let mainVerseDescription = ''

    // Helper to extract a character card object
    function processCharacterObject(obj: any) {
      if (!obj || typeof obj !== 'object') return null
      const name = (obj.name || '').trim()
      if (!name || extractedNames.has(name.toLowerCase())) return null

      extractedNames.add(name.toLowerCase())

      // Map basic descriptions
      const char: ExtractedChubCharacter = {
        name,
        description: (obj.description || '').trim(),
        backstory: (obj.backstory || obj.description || '').trim(),
        personality_summary: (obj.personality || '').trim(),
      }

      // W++ or key-value extractions from all main text fields
      const searchFields = [obj.description, obj.personality, obj.scenario, obj.creator_notes]
      for (const f of searchFields) {
        if (f) extractFieldsFromText(f, char)
      }

      // Construct notes
      const notesParts = []
      if (obj.scenario) {
        notesParts.push(`**Scenario / Roleplay Setting**\n${obj.scenario.trim()}`)
      }
      if (obj.first_mes) {
        notesParts.push(`**First Greeting / Message**\n${obj.first_mes.trim()}`)
      }
      if (obj.creator_notes) {
        notesParts.push(`**Creator Notes**\n${obj.creator_notes.trim()}`)
      }
      if (obj.system_prompt) {
        notesParts.push(`**System Prompt**\n${obj.system_prompt.trim()}`)
      }
      if (obj.post_history_instructions) {
        notesParts.push(`**Post-History Instructions**\n${obj.post_history_instructions.trim()}`)
      }
      if (notesParts.length > 0) {
        char.notes = notesParts.join('\n\n')
      }

      // Tags
      if (Array.isArray(obj.tags)) {
        char.tags = obj.tags.map((t: any) => String(t).trim())
      }

      // Greetings and scenes
      const greetingsList: { title: string; type: 'scene' | 'dialogue'; content: string }[] = []
      if (obj.first_mes && typeof obj.first_mes === 'string') {
        greetingsList.push({
          title: 'First Greeting',
          type: 'scene',
          content: obj.first_mes.trim(),
        })
      }

      // Alternate greetings (array of strings)
      const altGreetings = obj.alternate_greetings || obj.alt_greetings
      if (Array.isArray(altGreetings)) {
        altGreetings.forEach((alt: any, index: number) => {
          if (alt && typeof alt === 'string') {
            greetingsList.push({
              title: `Alternate Greeting ${index + 1}`,
              type: 'scene',
              content: alt.trim(),
            })
          }
        })
      }

      // Example dialogues/messages
      if (obj.mes_example && typeof obj.mes_example === 'string' && obj.mes_example.trim()) {
        greetingsList.push({
          title: 'Example Conversation',
          type: 'dialogue',
          content: obj.mes_example.trim(),
        })
      }

      if (greetingsList.length > 0) {
        char.greetings = greetingsList
      }

      // Try to read nested worldbook/character_book
      const charBook = obj.character_book || obj.world_book || obj.lorebook
      if (charBook && Array.isArray(charBook.entries)) {
        processLorebookEntries(charBook.entries)
      }

      return char
    }

    // Helper to parse lorebook / worldbook entries
    function processLorebookEntries(entries: any[]) {
      entries.forEach((entry: any, index: number) => {
        if (!entry || typeof entry !== 'object') return
        const content = (entry.content || '').trim()
        if (!content) return

        const keys = Array.isArray(entry.keys) ? entry.keys : []
        let title = (entry.name || entry.comment || '').trim()
        if (!title && keys.length > 0) {
          title = keys[0].charAt(0).toUpperCase() + keys[0].slice(1)
        }
        if (!title) {
          title = `Lore Entry ${index + 1}`
        }

        // Check if this lore entry is actually an auxiliary character card
        const contentLower = content.toLowerCase()
        const isAuxCharacter =
          keys.some(k => ['character', 'npc', 'companion', 'hero', 'villain', 'profile'].includes(String(k).toLowerCase())) ||
          title.toLowerCase().includes('npc profile') ||
          title.toLowerCase().includes('character profile') ||
          contentLower.includes('[character(') ||
          contentLower.includes('[npc(') ||
          (contentLower.includes('age:') && contentLower.includes('gender:') && contentLower.includes('personality:'))

        if (isAuxCharacter) {
          // Attempt to extract as a full character!
          const auxChar: ExtractedChubCharacter = {
            name: title,
            description: content,
            backstory: content,
          }
          // Scan for attributes
          extractFieldsFromText(content, auxChar)
          
          // Split notes / content details if any
          if (!extractedNames.has(title.toLowerCase())) {
            extractedNames.add(title.toLowerCase())
            characters.push(auxChar)
          }
        } else {
          // Create standard lore entry
          const category = mapToLoreCategory(title, content)
          loreEntries.push({
            title,
            content,
            category,
            tags: keys.map(String),
          })
        }
      })
    }

    // Main Recursive Scanner to find all cards inside the imported JSON
    function recursiveScan(node: any) {
      if (!node || typeof node !== 'object') return

      // Is this node a V2 card container or direct character card?
      if (node.spec === 'chara_card_v2' && node.data) {
        if (node.data.name) {
          const mainChar = processCharacterObject(node.data)
          if (mainChar) characters.push(mainChar)
        }
        // Scan other elements of V2 card
        return
      }

      // Check standard keys for a character card
      if (typeof node.name === 'string' && (node.description || node.personality || node.first_mes)) {
        const char = processCharacterObject(node)
        if (char) characters.push(char)
      }

      // Check for standalone character_book / world_book lists
      if (node.entries && Array.isArray(node.entries)) {
        processLorebookEntries(node.entries)
      }

      // Recursively inspect arrays and nested objects
      if (Array.isArray(node)) {
        node.forEach(item => recursiveScan(item))
      } else {
        for (const key of Object.keys(node)) {
          // Avoid scanning raw text strings
          if (typeof node[key] === 'object') {
            recursiveScan(node[key])
          }
        }
      }
    }

    // Execute scan
    recursiveScan(root)

    // Parse the unstructured description, personality, scenario, and creator notes for secondary characters!
    const targetObj = root.data || root
    const unstructuredTexts = [
      targetObj.description,
      targetObj.personality,
      targetObj.scenario,
      targetObj.creator_notes,
      targetObj.system_prompt
    ].filter(Boolean) as string[]

    const secondaryChars: ExtractedChubCharacter[] = []
    for (const text of searchFieldsTexts(targetObj)) {
      const found = scanTextForSecondaryCharacters(text, extractedNames)
      for (const fc of found) {
        // Double check if similar to any existing character in `characters` or `secondary`
        let merged = false
        for (const existing of characters) {
          if (areNamesSimilar(existing.name, fc.name)) {
            mergeCharacters(existing, fc)
            isMerged(existing, fc)
            isExistingInPrimary(existing, fc)
            merged = true
            break
          }
        }
        if (!merged) {
          for (const existing of secondaryChars) {
            if (areNamesSimilar(existing.name, fc.name)) {
              mergeCharacters(existing, fc)
              merged = true
              break
            }
          }
          if (!merged) {
            secondaryChars.push(fc)
          }
        }
      }
    }

    // Push non-duplicated secondary characters to main characters list
    for (const sc of secondaryChars) {
      if (!extractedNames.has(sc.name.toLowerCase())) {
        extractedNames.add(sc.name.toLowerCase())
        characters.push(sc)
      }
    }

    // Fallback: If absolutely no characters were parsed, but there's a title and description, create a skeleton
    if (characters.length === 0 && root.name) {
      characters.push({
        name: String(root.name),
        description: root.description ? String(root.description) : '',
        backstory: root.description ? String(root.description) : '',
      })
    }

    // Auto-create lore entries from description/scenario of the card to fully represent the entire verse lore
    if (targetObj.description && targetObj.description.trim()) {
      loreEntries.push({
        title: 'Universe Overview',
        content: targetObj.description.trim(),
        category: 'world-rules',
        tags: ['overview', 'worldbuilding']
      })
    }
    if (targetObj.scenario && targetObj.scenario.trim()) {
      loreEntries.push({
        title: 'Scenario & Context',
        content: targetObj.scenario.trim(),
        category: 'concept',
        tags: ['setting', 'roleplay']
      })
    }
    if (targetObj.system_prompt && targetObj.system_prompt.trim()) {
      loreEntries.push({
        title: 'System Prompt & Narrative Guidelines',
        content: targetObj.system_prompt.trim(),
        category: 'world-rules',
        tags: ['meta', 'guidelines']
      })
    }
    if (targetObj.creator_notes && targetObj.creator_notes.trim()) {
      loreEntries.push({
        title: 'Creator Notes',
        content: targetObj.creator_notes.trim(),
        category: 'concept',
        tags: ['author-notes']
      })
    }

    // Determine main verse name
    if (characters.length > 0) {
      const firstChar = characters[0]
      mainVerseName = firstChar.name.endsWith(' Universe') || firstChar.name.endsWith(' Compendium')
        ? firstChar.name
        : `${firstChar.name} Universe`
      mainVerseDescription = firstChar.description || `The creative universe of ${firstChar.name}.`
    } else if (root.name) {
      mainVerseName = String(root.name)
      mainVerseDescription = root.description ? String(root.description) : ''
    }

    return {
      verseName: mainVerseName,
      verseDescription: mainVerseDescription,
      characters,
      loreEntries,
    }
  } catch (e) {
    console.error('Error parsing Chub JSON:', e)
    return null
  }
}

// Helpers for secondary character scanning
function areNamesSimilar(nameA: string, nameB: string): boolean {
  const cleanA = nameA.trim().toLowerCase()
  const cleanB = nameB.trim().toLowerCase()
  if (cleanA === cleanB) return true

  // Ignore suffixes like "(Physical)" or "(Avatar)" when comparing
  const normA = cleanA.replace(/\s*\([^)]+\)/g, '').trim()
  const normB = cleanB.replace(/\s*\([^)]+\)/g, '').trim()
  if (normA === normB) return true

  const wordsA = normA.split(/\s+/)
  const wordsB = normB.split(/\s+/)

  if (wordsA.length === 1 && wordsB.length > 1) {
    return wordsB[0] === wordsA[0]
  }
  if (wordsB.length === 1 && wordsA.length > 1) {
    return wordsA[0] === wordsB[0]
  }

  return false
}

function mergeCharacters(target: ExtractedChubCharacter, source: ExtractedChubCharacter) {
  if (source.description && !target.description?.includes(source.description)) {
    target.description = (target.description ? target.description + '\n\n' : '') + source.description
  }
  if (source.backstory && !target.backstory?.includes(source.backstory)) {
    target.backstory = (target.backstory ? target.backstory + '\n\n' : '') + source.backstory
  }
  if (source.personality_summary && !target.personality_summary?.includes(source.personality_summary)) {
    target.personality_summary = (target.personality_summary ? target.personality_summary + '\n\n' : '') + source.personality_summary
  }
  if (source.notes && !target.notes?.includes(source.notes)) {
    target.notes = (target.notes ? target.notes + '\n\n' : '') + source.notes
  }
  if (source.species && !target.species) target.species = source.species
  if (source.age && !target.age) target.age = source.age
  if (source.gender && !target.gender) target.gender = source.gender
  if (source.role && !target.role) target.role = source.role

  // merge greetings
  if (source.greetings && source.greetings.length > 0) {
    const tG = target.greetings || []
    for (const g of source.greetings) {
      if (!tG.some(x => x.title === g.title || x.content === g.content)) {
        tG.push(g)
      }
    }
    target.greetings = tG
  }

  // merge array fields
  const arrays: (keyof ExtractedChubCharacter)[] = ['personality_traits', 'tags', 'likes', 'dislikes', 'fears', 'desires', 'habits', 'quirks', 'contradictions', 'affiliations', 'notable_quotes']
  for (const arrField of arrays) {
    const sArr = source[arrField] as any[] | undefined
    if (sArr && Array.isArray(sArr)) {
      const tArr = (target[arrField] || []) as any[]
      (target as any)[arrField] = Array.from(new Set([...tArr, ...sArr]))
    }
  }
}

function parseMetaIntoCharacter(meta: string, char: ExtractedChubCharacter) {
  if (!meta) return

  const parts = meta.split(/[,;]/)
  for (const part of parts) {
    const trimmed = part.trim()
    if (/^race\s*:\s*(.*)/i.test(trimmed)) {
      char.species = trimmed.replace(/^race\s*:\s*/i, '').trim()
    } else if (/^species\s*:\s*(.*)/i.test(trimmed)) {
      char.species = trimmed.replace(/^species\s*:\s*/i, '').trim()
    } else if (/^gender\s*:\s*(.*)/i.test(trimmed)) {
      char.gender = trimmed.replace(/^gender\s*:\s*/i, '').trim()
    } else if (/^age\s*:\s*(.*)/i.test(trimmed)) {
      char.age = trimmed.replace(/^age\s*:\s*/i, '').trim()
    } else if (/^role\s*:\s*(.*)/i.test(trimmed)) {
      char.role = trimmed.replace(/^role\s*:\s*/i, '').trim()
    } else if (/original character/i.test(trimmed)) {
      char.tags = Array.from(new Set([...(char.tags || []), 'OC']))
    }
  }
}

function scanTextForSecondaryCharacters(text: string, existingNames: Set<string>): ExtractedChubCharacter[] {
  const list: ExtractedChubCharacter[] = []
  if (!text) return list

  const lines = text.split('\n')

  const patternBoldWithDash = /^\s*\*+\s*([^*(){}\n:—]{2,50})\s*\*+\s*(?:\(([^)]+)\))?\s*(?:—|-|:)\s*([\s\S]+)$/
  const patternBoldWithColon = /^\s*(?:[-*]\s*)?_?_?\*+\s*([^*(){}\n:—]{2,50})\s*\*+\s*:\s*([\s\S]+)$/
  const patternNormalWithDash = /^\s*(?:[-*]\s*)?([A-Z][A-Za-z0-9'\s]{2,40})(?:\s*\(([^)]+)\))?\s*(?:—|-)\s*([\s\S]+)$/
  const patternNormalWithColon = /^\s*(?:[-*]\s*)?([A-Z][A-Za-z0-9'\s]{2,40})\s*:\s*([\s\S]+)$/

  for (let line of lines) {
    line = line.trim()
    if (!line) continue

    const isHeaderWord = /^(the cast|alternate forms|group dynamics|scenario|background|personality|roles|notes|instructions|greetings|rules|compendium|overview|lore|important|decision)/i.test(line)
    if (isHeaderWord) continue

    let matchName = ''
    let matchMeta = ''
    let matchDesc = ''

    const m1 = line.match(patternBoldWithDash)
    if (m1) {
      matchName = m1[1].trim()
      matchMeta = m1[2] ? m1[2].trim() : ''
      matchDesc = m1[3].trim()
    } else {
      const m2 = line.match(patternBoldWithColon)
      if (m2) {
        matchName = m2[1].trim()
        matchDesc = m2[2].trim()
      } else {
        const m3 = line.match(patternNormalWithDash)
        if (m3) {
          matchName = m3[1].trim()
          matchMeta = m3[2] ? m3[2].trim() : ''
          matchDesc = m3[3].trim()
        } else {
          const m4 = line.match(patternNormalWithColon)
          if (m4) {
            matchName = m4[1].trim()
            matchDesc = m4[2].trim()
          }
        }
      }
    }

    if (matchName) {
      if (
        matchName.length >= 2 &&
        matchName.length <= 40 &&
        !/^(yes|no|none|true|false|example|and|or|but|the|this|that|your|my|with|start|first|alternate|scanned)$/i.test(matchName) &&
        !/[#\[\]{}]/.test(matchName)
      ) {
        let isExisting = false
        for (const existing of list) {
          if (areNamesSimilar(existing.name, matchName)) {
            mergeCharacters(existing, {
              name: matchName,
              description: matchDesc,
              backstory: matchDesc,
            })
            if (matchMeta) {
              parseMetaIntoCharacter(matchMeta, existing)
            }
            extractFieldsFromText(matchDesc, existing)
            isExisting = true
            break
          }
        }

        if (!isExisting) {
          const newChar: ExtractedChubCharacter = {
            name: matchName,
            description: matchDesc,
            backstory: matchDesc,
            is_oc: true,
          }
          if (matchMeta) {
            parseMetaIntoCharacter(matchMeta, newChar)
          }
          extractFieldsFromText(matchDesc, newChar)
          list.push(newChar)
        }
      }
    }
  }

  return list
}

function searchFieldsTexts(target: any): string[] {
  return [
    target.description,
    target.personality,
    target.scenario,
    target.creator_notes,
    target.system_prompt
  ].filter(Boolean) as string[]
}

function isMerged(existing: any, fc: any) {}
function isExistingInPrimary(existing: any, fc: any) {}

