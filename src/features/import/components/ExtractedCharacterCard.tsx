import React, { useState } from 'react'
import { ExtractedCharacter } from '../types'
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

interface ExtractedCharacterCardProps {
  character: ExtractedCharacter
  onToggle: () => void
  onResolveDuplicate: (id: string, action: 'skip' | 'update' | 'create-new') => void
  existingCharacterName: string | null
}

const EXTRACTED_SCHEMA_KEYS = [
  'full_name', 'pronouns', 'age', 'species', 'nationality', 'occupation',
  'height', 'weight', 'hair_color', 'hair_style', 'eye_color', 'skin_tone', 'body_type',
  'distinguishing_features', 'style_and_fashion', 'appearance_notes', 'personality_summary',
  'personality_traits', 'likes', 'dislikes', 'fears', 'desires', 'habits', 'quirks',
  'core_wound', 'love_language', 'deepest_desire', 'biggest_fear', 'power_origin',
  'power_origin_details', 'alignment', 'backstory', 'early_life', 'defining_moments',
  'narrative_role', 'character_arc_stage', 'aesthetic_vibe', 'contradictions',
  'affiliations', 'notable_quotes', 'notes'
]

export function ExtractedCharacterCard({
  character,
  onToggle,
  onResolveDuplicate,
  existingCharacterName,
}: ExtractedCharacterCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Calculate field completeness
  const totalAvailable = EXTRACTED_SCHEMA_KEYS.length
  let extractedCount = 0
  EXTRACTED_SCHEMA_KEYS.forEach(k => {
    const val = (character as any)[k]
    if (val !== undefined && val !== null) {
      if (typeof val === 'string' && val.trim().length > 0) extractedCount++
      else if (Array.isArray(val) && val.length > 0) extractedCount++
    }
  })

  const isDuplicate = character._status === 'duplicate'
  const isIncluded = character._status === 'included'

  const truncate = (str: string, max: number) => {
    if (str.length <= max) return str
    return str.slice(0, max) + '...'
  }

  const formatLabel = (key: string) => {
    return key.replace(/_/g, ' ').toUpperCase()
  }

  return (
    <div className="bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)]/30 p-5 mb-4 shadow-sm select-none transition-colors">
      <div className="flex items-start gap-4">
        {/* Toggle checkbox */}
        <div className="pt-1 select-none">
          <input
            id={`checkbox-char-${character._id}`}
            type="checkbox"
            checked={character._status !== 'excluded'}
            onChange={onToggle}
            className="w-4 h-4 text-indigo-600 border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] rounded shadow-sm focus:ring-indigo-500 focus:ring-2 cursor-pointer"
          />
        </div>

        <div className="flex-1 space-y-1">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <label htmlFor={`checkbox-char-${character._id}`} className="text-sm font-bold text-[var(--color-text-primary)] cursor-pointer hover:text-indigo-400">
              {character.name}
            </label>
            <span className="text-[10px] font-mono font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-subtle)] px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)]/15">
              {extractedCount} of {totalAvailable} attributes found
            </span>
          </div>

          {/* Subtitle properties */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-text-secondary)] font-medium">
            {character.pronouns && <span>Pronouns: <b>{character.pronouns}</b></span>}
            {character.species && <span>Species: <b>{character.species}</b></span>}
            {character.age && <span>Age: <b>{character.age}</b></span>}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 pt-1.5 pb-1">
            {character.narrative_role && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
                ROLE: {character.narrative_role}
              </span>
            )}
            {character.character_arc_stage && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-purple-500/10 border border-purple-500/25 text-purple-400">
                ARC: {character.character_arc_stage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate Resolution Warning Alert */}
      {isDuplicate && (
        <div className="mt-4 p-4 bg-amber-950/20 border border-amber-600/30 rounded-2xl space-y-3.5">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={15} />
            <div>
              <p className="text-xs font-semibold text-amber-300">Duplicate Name Detected</p>
              <p className="text-xs text-amber-400/90 mt-0.5">A character named &apos;{existingCharacterName}&apos; already exists down in this verse.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => onResolveDuplicate(character._id, 'skip')}
              className="px-3.5 py-1.5 rounded-lg text-[10px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border border-transparent hover:bg-[var(--color-bg-subtle)] bg-[var(--color-bg-subtle)]/10"
            >
              Skip Import
            </button>
            <button
              type="button"
              onClick={() => onResolveDuplicate(character._id, 'update')}
              className="px-3.5 py-1.5 rounded-lg text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 shadow-sm"
            >
              Update Existing
            </button>
            <button
              type="button"
              onClick={() => onResolveDuplicate(character._id, 'create-new')}
              className="px-3.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/30 shadow-sm"
            >
              Create as New Dupe
            </button>
          </div>
        </div>
      )}

      {/* Expanded details clicker */}
      <div className="mt-3.5 pt-3.5 border-t border-[var(--color-border-subtle)]/15">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={13} />
              <span>Hide extracted attributes</span>
            </>
          ) : (
            <>
              <ChevronDown size={13} />
              <span>Show extracted attributes</span>
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--color-bg-subtle)] p-4 rounded-xl border border-[var(--color-border-subtle)]/20 animate-fade-in text-xs">
            {EXTRACTED_SCHEMA_KEYS.map(key => {
              const value = (character as any)[key]
              if (value === undefined || value === null) return null

              let renderedValue = ''
              if (typeof value === 'string') {
                if (value.trim().length === 0) return null
                renderedValue = truncate(value, 180)
              } else if (Array.isArray(value)) {
                if (value.length === 0) return null
                renderedValue = value.join(', ')
              } else {
                return null
              }

              return (
                <div key={key} className="space-y-1 min-w-0">
                  <span className="text-[9px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">
                    {formatLabel(key)}
                  </span>
                  <p className="font-medium text-[var(--color-text-primary)] leading-normal whitespace-pre-wrap break-words">
                    {renderedValue}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
