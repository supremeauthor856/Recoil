import React, { useState, useEffect } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import { Character } from '../../../shared/types/database'
import { RELATIONSHIP_TYPES, RELATIONSHIP_TYPE_LABELS, RelationshipType, CharacterRelationship } from '../types'
import { RelationshipTypeBadge } from './RelationshipTypeBadge'
import { cn } from '../../../shared/utils/cn'

interface RelationshipCreateModalProps {
  isOpen: boolean
  onClose: () => void
  verseId: string
  characters: Character[]
  existingRelationships: CharacterRelationship[]
  preSelectedA?: string
  preSelectedB?: string
  onCreate: (data: {
    verse_id: string
    character_a_id: string
    character_b_id: string
    relationship_type: RelationshipType
    dynamic_label?: string
  }) => Promise<unknown>
}

export function RelationshipCreateModal({
  isOpen,
  onClose,
  verseId,
  characters,
  existingRelationships,
  preSelectedA = '',
  preSelectedB = '',
  onCreate,
}: RelationshipCreateModalProps) {
  if (!isOpen) return null

  // Selection state
  const [charA, setCharA] = useState(preSelectedA)
  const [charB, setCharB] = useState(preSelectedB)
  const [selType, setSelType] = useState<RelationshipType | null>(null)
  const [dynamicLabel, setDynamicLabel] = useState('')

  // Search states for dropdown filtering
  const [searchA, setSearchA] = useState('')
  const [searchB, setSearchB] = useState('')

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Clear states on opening
  useEffect(() => {
    setCharA(preSelectedA)
    setCharB(preSelectedB)
    setSelType(null)
    setDynamicLabel('')
    setSearchA('')
    setSearchB('')
    setErrorMsg(null)
  }, [isOpen, preSelectedA, preSelectedB])

  // Filter lists based on search
  const filteredCharsA = characters.filter((c) =>
    c.name.toLowerCase().includes(searchA.toLowerCase())
  )
  const filteredCharsB = characters.filter((c) =>
    c.name.toLowerCase().includes(searchB.toLowerCase())
  )

  // Duplication check client-side
  const isDuplicate = () => {
    if (!charA || !charB) return false
    return existingRelationships.some(
      (rel) =>
        (rel.character_a_id === charA && rel.character_b_id === charB) ||
        (rel.character_a_id === charB && rel.character_b_id === charA)
    )
  }

  const checkValidationMsg = () => {
    if (!charA || !charB) return null
    if (charA === charB) return 'Character A and Character B must be different.'
    if (isDuplicate()) return 'A relationship between these characters already exists.'
    return null
  }

  const validationError = checkValidationMsg()
  const isValid = charA && charB && selType && !validationError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || isSubmitting) return

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      await onCreate({
        verse_id: verseId,
        character_a_id: charA,
        character_b_id: charB,
        relationship_type: selType,
        dynamic_label: dynamicLabel.trim() || undefined,
      })
      onClose()
    } catch (err: unknown) {
      console.error(err)
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during creation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050508]/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/45 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* 1. HEADER */}
        <div className="h-[56px] px-5 border-b border-[var(--color-border-subtle)]/30 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">New Relationship</h3>
          <button
            onClick={onClose}
            className="p-1 px-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* 2. FORM CONTENTS */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* CHARACTER SELECT PAIR ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CHARACTER A */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
                CHARACTER A
              </label>
              
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Filter name..."
                  value={searchA}
                  onChange={(e) => setSearchA(e.target.value)}
                  className="w-full h-[32px] pl-8 pr-3 text-[11px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/35 focus:outline-none focus:border-[var(--color-accent-highlight)]/60 rounded-md text-[var(--color-text-primary)]"
                />
              </div>

              <select
                value={charA}
                onChange={(e) => setCharA(e.target.value)}
                className="w-full h-[34px] px-2.5 text-[12px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/40 rounded-lg text-[var(--color-text-primary)] font-medium focus:outline-none"
              >
                <option value="">-- Choose Character A --</option>
                {filteredCharsA.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            </div>

            {/* CHARACTER B */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
                CHARACTER B
              </label>

              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Filter name..."
                  value={searchB}
                  onChange={(e) => setSearchB(e.target.value)}
                  className="w-full h-[32px] pl-8 pr-3 text-[11px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/35 focus:outline-none focus:border-[var(--color-accent-highlight)]/60 rounded-md text-[var(--color-text-primary)]"
                />
              </div>

              <select
                value={charB}
                onChange={(e) => setCharB(e.target.value)}
                className="w-full h-[34px] px-2.5 text-[12px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/40 rounded-lg text-[var(--color-text-primary)] font-medium focus:outline-none"
              >
                <option value="">-- Choose Character B --</option>
                {filteredCharsB.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation error feedback */}
          {validationError && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11.5px] rounded-lg font-medium">
              {validationError}
            </div>
          )}

          {/* RELATIONSHIP MAIN TYPE GRID */}
          <div className="space-y-2 border-t border-[var(--color-border-subtle)]/15 pt-4">
            <label className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
              RELATIONSHIP MAIN CATEGORY
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {RELATIONSHIP_TYPES.map((type) => {
                const label = RELATIONSHIP_TYPE_LABELS[type]
                const isSelected = selType === type

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelType(type)}
                    className={cn(
                      'flex flex-col items-start gap-1 p-2.5 rounded-xl border border-[var(--color-border-subtle)]/35 bg-[var(--color-bg-base)]/40 hover:bg-[var(--color-bg-base)] hover:border-[var(--color-border-default)]/60 transition-all text-left group',
                      isSelected &&
                        'bg-indigo-500/15 border-indigo-500/70 hover:bg-indigo-500/20 hover:border-indigo-500'
                    )}
                  >
                    <RelationshipTypeBadge type={type} size="sm" className="mb-0.5" />
                    <span
                      className={cn(
                        'text-[10px] font-semibold text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transform duration-150',
                        isSelected && 'text-indigo-200'
                      )}
                    >
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* DYNAMIC LABEL / ALIAS */}
          <div className="space-y-1.5 border-t border-[var(--color-border-subtle)]/15 pt-4">
            <label className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
              DYNAMIC LABEL / ALIAS (OPTIONAL)
            </label>
            <input
              type="text"
              placeholder="e.g. mutual healing, betrayal arc, one-sided rivals..."
              value={dynamicLabel}
              onChange={(e) => setDynamicLabel(e.target.value)}
              className="w-full h-[36px] px-3.5 text-[12px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/45 focus:border-[var(--color-accent-highlight)]/70 focus:outline-none rounded-xl text-[var(--color-text-primary)] font-medium"
            />
          </div>
        </form>

        {/* 3. FOOTER BUTTONS */}
        <div className="h-[64px] px-5 border-t border-[var(--color-border-subtle)]/30 bg-[var(--color-bg-base)]/40 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 px-4 rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={cn(
              'h-9 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/30 disabled:text-indigo-400/40 disabled:border-transparent rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 shadow-md border-t border-white/10'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Creating...
              </>
            ) : (
              'Create Relationship'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
