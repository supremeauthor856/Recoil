import React, { useState, useEffect, useMemo } from 'react'
import { Check, Loader2, AlertCircle, Plus, X, Users, Link as LinkIcon, Search, Tag } from 'lucide-react'
import { LoreEntry, LoreCategory, LORE_CATEGORY_LABELS, LORE_CATEGORY_COLORS } from '../types'
import { Character } from '../../../shared/types/database'
import { getCharacters } from '../../../services/characterService'
import { loreService } from '../../../services/loreService'
import { getSubSeries } from '../../../services/verseService'
import { SubSeries } from '../../../shared/types/database'
import { Badge } from '../../../shared/components/ui/Badge'
import { SaveStatus } from '../hooks/useLoreEntry'

interface LoreMetadataPanelProps {
  entry: LoreEntry
  updateField: (field: keyof LoreEntry, value: any) => void
  updateArrayField: (field: 'tags' | 'linked_character_ids' | 'linked_lore_ids', value: string[]) => void
  saveStatus: SaveStatus
  linkedCharacters: Character[]
  linkedLore: LoreEntry[]
}

export const LoreMetadataPanel: React.FC<LoreMetadataPanelProps> = ({
  entry,
  updateField,
  updateArrayField,
  saveStatus,
  linkedCharacters,
  linkedLore,
}) => {
  const [subSeriesList, setSubSeriesList] = useState<SubSeries[]>([])
  const [allCharactersList, setAllCharactersList] = useState<Character[]>([])
  const [allLoreList, setAllLoreList] = useState<LoreEntry[]>([])

  const [tagInput, setTagInput] = useState('')
  const [charSearchQuery, setCharSearchQuery] = useState('')
  const [loreSearchQuery, setLoreSearchQuery] = useState('')

  const [isCharDropdownOpen, setIsCharDropdownOpen] = useState(false)
  const [isLoreDropdownOpen, setIsLoreDropdownOpen] = useState(false)

  // Fetch verse resources
  useEffect(() => {
    if (entry?.verse_id) {
      getSubSeries(entry.verse_id)
        .then(setSubSeriesList)
        .catch((err) => console.error('Failed to load sub-series', err))

      getCharacters({ verseId: entry.verse_id })
        .then(setAllCharactersList)
        .catch((err) => console.error('Failed to load characters', err))

      loreService.getEntries(entry.verse_id)
        .then((list) => setAllLoreList(list.filter((l) => l.id !== entry.id)))
        .catch((err) => console.error('Failed to load other lore entries', err))
    }
  }, [entry?.verse_id, entry?.id])

  // Save Status Indicator Block
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin text-[var(--color-accent-primary)]" />
            <span>Saving...</span>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-success)] font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Saved</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-error)] font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed to save</span>
          </div>
        )
      default:
        return (
          <div className="text-[11px] text-[var(--color-text-muted)]">
            All changes saved
          </div>
        )
    }
  }

  // Tags handers
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = tagInput.trim().toLowerCase()
    if (!trimmed) return

    const currentTags = entry.tags || []
    if (!currentTags.includes(trimmed)) {
      updateArrayField('tags', [...currentTags, trimmed])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = entry.tags || []
    updateArrayField('tags', currentTags.filter((t) => t !== tagToRemove))
  }

  // Character Linking handlers
  const filteredAvailableCharacters = useMemo(() => {
    const linkedIds = new Set(entry.linked_character_ids || [])
    return allCharactersList
      .filter((char) => !linkedIds.has(char.id))
      .filter((char) =>
        char.name.toLowerCase().includes(charSearchQuery.toLowerCase())
      )
  }, [allCharactersList, entry.linked_character_ids, charSearchQuery])

  const handleLinkCharacter = (charId: string) => {
    const currentList = entry.linked_character_ids || []
    if (!currentList.includes(charId)) {
      updateArrayField('linked_character_ids', [...currentList, charId])
    }
    setCharSearchQuery('')
    setIsCharDropdownOpen(false)
  }

  const handleUnlinkCharacter = (charId: string) => {
    const currentList = entry.linked_character_ids || []
    updateArrayField('linked_character_ids', currentList.filter((id) => id !== charId))
  }

  // Lore Linking handlers
  const filteredAvailableLore = useMemo(() => {
    const linkedIds = new Set(entry.linked_lore_ids || [])
    return allLoreList
      .filter((item) => item.id !== entry.id)
      .filter((item) => !linkedIds.has(item.id))
      .filter((item) =>
        item.title.toLowerCase().includes(loreSearchQuery.toLowerCase())
      )
  }, [allLoreList, entry.linked_lore_ids, entry.id, loreSearchQuery])

  const handleLinkLore = (targetId: string) => {
    const currentList = entry.linked_lore_ids || []
    if (!currentList.includes(targetId)) {
      updateArrayField('linked_lore_ids', [...currentList, targetId])
    }
    setLoreSearchQuery('')
    setIsLoreDropdownOpen(false)
  }

  const handleUnlinkLore = (targetId: string) => {
    const currentList = entry.linked_lore_ids || []
    updateArrayField('linked_lore_ids', currentList.filter((id) => id !== targetId))
  }

  return (
    <div className="flex flex-col gap-6 w-full select-none">
      {/* Save Status Block */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border-subtle)]/50 bg-[var(--color-bg-subtle)]/20">
        <span className="text-[11px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          Status
        </span>
        {renderSaveStatus()}
      </div>

      {/* Category selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">
          Category
        </label>
        <select
          value={entry.category}
          onChange={(e) => updateField('category', e.target.value as LoreCategory)}
          className="w-full h-9 px-3 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] cursor-pointer"
        >
          {Object.entries(LORE_CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Sub-series selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">
          Sub-series
        </label>
        <select
          value={entry.sub_series_id || ''}
          onChange={(e) => updateField('sub_series_id', e.target.value || null)}
          className="w-full h-9 px-3 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] cursor-pointer"
        >
          <option value="">No sub-series</option>
          {subSeriesList.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Pinned toggle */}
      <div className="flex items-center justify-between py-2 border-y border-[var(--color-border-subtle)]/30">
        <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">
          Pinned to top
        </label>
        <button
          type="button"
          onClick={() => updateField('is_pinned', !entry.is_pinned)}
          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            entry.is_pinned ? 'bg-[var(--color-accent-primary)]' : 'bg-[var(--color-border-strong)]/30'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              entry.is_pinned ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Tags section */}
      <div className="flex flex-col gap-2">
        <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">
          Tags
        </label>
        <form onSubmit={handleAddTag} className="relative">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Type tag & press Enter..."
            className="w-full h-8 pl-8 pr-3 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[12px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
          />
          <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        </form>

        <div className="flex flex-wrap gap-1.5 mt-1">
          {entry.tags?.length > 0 ? (
            entry.tags.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-medium bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]/70"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="p-0.5 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-[11px] text-[var(--color-text-muted)] italic">
              No tags applied
            </span>
          )}
        </div>
      </div>

      {/* Linked Characters Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            Characters
          </label>
          {isCharDropdownOpen ? (
            <button
              onClick={() => setIsCharDropdownOpen(false)}
              className="text-[11px] text-[var(--color-accent-primary)] font-medium hover:underline cursor-pointer"
            >
              Close
            </button>
          ) : (
            <button
              onClick={() => setIsCharDropdownOpen(true)}
              className="text-[11px] text-[var(--color-accent-primary)] font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Link
            </button>
          )}
        </div>

        {/* Quick Link Search Dropdown */}
        {isCharDropdownOpen && (
          <div className="border border-[var(--color-border-subtle)] rounded-lg p-2 bg-[var(--color-bg-subtle)] flex flex-col gap-1.5 shadow-inner">
            <div className="relative">
              <input
                type="text"
                value={charSearchQuery}
                onChange={(e) => setCharSearchQuery(e.target.value)}
                placeholder="Search character..."
                className="w-full h-8 pl-7 pr-3 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--color-text-muted)]" />
            </div>

            <div className="max-h-[120px] overflow-y-auto flex flex-col gap-0.5 scrollbar-custom pr-1">
              {filteredAvailableCharacters.length > 0 ? (
                filteredAvailableCharacters.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleLinkCharacter(char.id)}
                    className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer truncate"
                  >
                    {char.name}
                  </button>
                ))
              ) : (
                <span className="text-[10px] text-[var(--color-text-muted)] italic p-1">
                  No other characters found
                </span>
              )}
            </div>
          </div>
        )}

        {/* Linked Characters List */}
        <div className="flex flex-col gap-1">
          {linkedCharacters.length > 0 ? (
            linkedCharacters.map((char) => (
              <div
                key={char.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md border border-[var(--color-border-subtle)]/50 bg-[var(--color-bg-elevated)] text-[12px] text-[var(--color-text-primary)] hover:border-[var(--color-border-default)] transition-all"
              >
                <span className="truncate font-medium">{char.name}</span>
                <button
                  type="button"
                  onClick={() => handleUnlinkCharacter(char.id)}
                  className="p-0.5 rounded-full hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                  title="Remove link"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : (
            <span className="text-[11px] text-[var(--color-text-muted)] italic pl-1">
              No characters linked
            </span>
          )}
        </div>
      </div>

      {/* Linked Lore Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            Linked Lore
          </label>
          {isLoreDropdownOpen ? (
            <button
              onClick={() => setIsLoreDropdownOpen(false)}
              className="text-[11px] text-[var(--color-accent-primary)] font-medium hover:underline cursor-pointer"
            >
              Close
            </button>
          ) : (
            <button
              onClick={() => setIsLoreDropdownOpen(true)}
              className="text-[11px] text-[var(--color-accent-primary)] font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Link
            </button>
          )}
        </div>

        {/* Quick Link Search Dropdown */}
        {isLoreDropdownOpen && (
          <div className="border border-[var(--color-border-subtle)] rounded-lg p-2 bg-[var(--color-bg-subtle)] flex flex-col gap-1.5 shadow-inner">
            <div className="relative">
              <input
                type="text"
                value={loreSearchQuery}
                onChange={(e) => setLoreSearchQuery(e.target.value)}
                placeholder="Search other lore..."
                className="w-full h-8 pl-7 pr-3 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--color-text-muted)]" />
            </div>

            <div className="max-h-[120px] overflow-y-auto flex flex-col gap-0.5 scrollbar-custom pr-1">
              {filteredAvailableLore.length > 0 ? (
                filteredAvailableLore.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleLinkLore(item.id)}
                    className="w-full text-left px-2 py-1 text-[11px] rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer truncate"
                  >
                    {item.title}
                  </button>
                ))
              ) : (
                <span className="text-[10px] text-[var(--color-text-muted)] italic p-1">
                  No other lore found
                </span>
              )}
            </div>
          </div>
        )}

        {/* Linked Lore List */}
        <div className="flex flex-col gap-1">
          {linkedLore.length > 0 ? (
            linkedLore.map((item) => {
              const catColor = LORE_CATEGORY_COLORS[item.category] || '#6B7280'
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md border border-[var(--color-border-subtle)]/50 bg-[var(--color-bg-elevated)] text-[12px] text-[var(--color-text-primary)] hover:border-[var(--color-border-default)] transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: catColor }}
                    />
                    <span className="truncate font-medium">{item.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnlinkLore(item.id)}
                    className="p-0.5 rounded-full hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                    title="Remove link"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })
          ) : (
            <span className="text-[11px] text-[var(--color-text-muted)] italic pl-1">
              No linked lore entries
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
export default LoreMetadataPanel
