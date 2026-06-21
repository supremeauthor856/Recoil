import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, ChevronRight, Plus, Loader2 } from 'lucide-react'
import { Character } from '../../../shared/types/database'
import { INTENSITY_DIMENSIONS, RELATIONSHIP_TYPES, RELATIONSHIP_TYPE_LABELS, CharacterRelationship } from '../types'
import { IntensitySlider } from './IntensitySlider'
import { RelationshipTypeBadge } from './RelationshipTypeBadge'
import { cn } from '../../../shared/utils/cn'

interface RelationshipDetailPanelProps {
  relationship: CharacterRelationship | null
  characterA: Character | null
  characterB: Character | null
  onClose: () => void
  onUpdate: (id: string, updates: Partial<CharacterRelationship>) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export function RelationshipDetailPanel({
  relationship,
  characterA,
  characterB,
  onClose,
  onUpdate,
  onDelete,
}: RelationshipDetailPanelProps) {
  if (!relationship) return null

  // Local state for debounced fields
  const [dynamicLabel, setDynamicLabel] = useState(relationship.dynamic_label || '')
  const [dynamicDesc, setDynamicDesc] = useState(relationship.dynamic_description || '')
  const [arcStage, setArcStage] = useState(relationship.arc_stage || '')
  const [evolutionNotes, setEvolutionNotes] = useState(relationship.evolution_notes || '')
  const [relType, setRelType] = useState(relationship.relationship_type)

  // Local state for tags
  const [tags, setTags] = useState<string[]>(relationship.tags || [])
  const [newTagInput, setNewTagInput] = useState('')

  // Local state for dimensions
  const [dimensions, setDimensions] = useState<Record<string, number>>({
    emotional_closeness: relationship.emotional_closeness,
    conflict_level: relationship.conflict_level,
    trust: relationship.trust,
    romantic_tension: relationship.romantic_tension,
    power_imbalance: relationship.power_imbalance,
    loyalty: relationship.loyalty,
    dependency: relationship.dependency,
    fear_factor: relationship.fear_factor,
    respect_level: relationship.respect_level,
    unspoken_tension: relationship.unspoken_tension,
    narrative_importance: relationship.narrative_importance,
    shared_history_weight: relationship.shared_history_weight,
  })

  // Save State status indicators
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Track the previous relationship id to prevent wrong triggers during load
  const prevIdRef = useRef<string>(relationship.id)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync state with prop updates if the relationship changes
  useEffect(() => {
    if (prevIdRef.current !== relationship.id) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      prevIdRef.current = relationship.id
      setDynamicLabel(relationship.dynamic_label || '')
      setDynamicDesc(relationship.dynamic_description || '')
      setArcStage(relationship.arc_stage || '')
      setEvolutionNotes(relationship.evolution_notes || '')
      setRelType(relationship.relationship_type)
      setTags(relationship.tags || [])
      setDimensions({
        emotional_closeness: relationship.emotional_closeness,
        conflict_level: relationship.conflict_level,
        trust: relationship.trust,
        romantic_tension: relationship.romantic_tension,
        power_imbalance: relationship.power_imbalance,
        loyalty: relationship.loyalty,
        dependency: relationship.dependency,
        fear_factor: relationship.fear_factor,
        respect_level: relationship.respect_level,
        unspoken_tension: relationship.unspoken_tension,
        narrative_importance: relationship.narrative_importance,
        shared_history_weight: relationship.shared_history_weight,
      })
      setSaveStatus('idle')
    }
  }, [relationship])

  // Trigger Debounced Auto-Saves
  const triggerUpdate = (updatedFields: Partial<CharacterRelationship>) => {
    setSaveStatus('saving')
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        await onUpdate(relationship.id, updatedFields)
        setSaveStatus('saved')
        setTimeout(() => {
          setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev))
        }, 3000)
      } catch (err) {
        console.error('Failed to auto-save:', err)
        setSaveStatus('error')
      }
    }, 1000)
  }

  // Handle individual slider updates
  const handleDimensionChange = (key: string, val: number) => {
    setDimensions((prev) => ({ ...prev, [key]: val }))
    triggerUpdate({ [key]: val } as Partial<CharacterRelationship>)
  }

  // Handle standard textbox updates
  const handleFieldChange = (key: string, val: string) => {
    if (key === 'dynamic_label') {
      setDynamicLabel(val)
    } else if (key === 'dynamic_description') {
      setDynamicDesc(val)
    } else if (key === 'arc_stage') {
      setArcStage(val)
    } else if (key === 'evolution_notes') {
      setEvolutionNotes(val)
    }
    triggerUpdate({ [key]: val })
  }

  const handleRelationshipTypeChange = (type: any) => {
    setRelType(type)
    triggerUpdate({ relationship_type: type })
  }

  // Tags handlings
  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newTagInput.trim().toLowerCase()
    if (!trimmed) return
    if (tags.includes(trimmed)) {
      setNewTagInput('')
      return
    }

    const updated = [...tags, trimmed]
    setTags(updated)
    setNewTagInput('')
    triggerUpdate({ tags: updated })
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove)
    setTags(updated)
    triggerUpdate({ tags: updated })
  }

  // Delete flow trigger
  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(relationship.id)
      onClose()
    } catch (err) {
      console.error('Failed to delete relationship:', err)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div
      className={cn(
        'w-[325px] h-full flex flex-col bg-[var(--color-bg-elevated)] border-l border-[var(--color-border-subtle)]/40 relative select-none shrink-0 z-40 shadow-xl overflow-hidden animate-slide-in',
        'absolute right-0 top-0 sm:relative'
      )}
    >
      {/* 1. Header (48px) */}
      <div className="h-[48px] px-4 border-b border-[var(--color-border-subtle)]/30 flex items-center justify-between shrink-0">
        <RelationshipTypeBadge type={relType} size="md" />

        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-[10px] text-indigo-400 flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[10px] text-emerald-400 font-medium">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-[10px] text-rose-400 font-medium">Save Error</span>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Scrollable Container Body */}
      <div className="flex-1 overflow-y-auto scrollbar-custom p-3.5 space-y-4 pb-20">
        {/* CHARACTER PAIR ROW */}
        <div className="flex items-center justify-between bg-[var(--color-bg-base)]/50 border border-[var(--color-border-subtle)]/30 rounded-xl p-3">
          {/* Char A info */}
          <Link
            to={`/verse/${relationship.verse_id}/characters/${characterA?.id}`}
            className="flex-1 flex flex-col items-center gap-1.5 hover:opacity-85 transition-opacity min-w-0"
          >
            {characterA?.avatar_url || characterA?.reference_image_url ? (
              <img
                src={characterA.avatar_url || characterA.reference_image_url || ''}
                alt={characterA.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-[var(--color-border-subtle)]/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-900 border border-indigo-700 font-bold flex items-center justify-center text-sm text-indigo-100 uppercase">
                {characterA?.name.charAt(0)}
              </div>
            )}
            <span className="text-[11px] font-semibold text-[var(--color-text-primary)] truncate text-center w-full">
              {characterA?.name}
            </span>
          </Link>

          {/* Connection arrow */}
          <ChevronRight size={16} className="text-[var(--color-text-muted)] shrink-0 px-1" />

          {/* Char B info */}
          <Link
            to={`/verse/${relationship.verse_id}/characters/${characterB?.id}`}
            className="flex-1 flex flex-col items-center gap-1.5 hover:opacity-85 transition-opacity min-w-0"
          >
            {characterB?.avatar_url || characterB?.reference_image_url ? (
              <img
                src={characterB.avatar_url || characterB.reference_image_url || ''}
                alt={characterB.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-[var(--color-border-subtle)]/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-800 font-bold flex items-center justify-center text-sm text-emerald-100 uppercase">
                {characterB?.name.charAt(0)}
              </div>
            )}
            <span className="text-[11px] font-semibold text-[var(--color-text-primary)] truncate text-center w-full">
              {characterB?.name}
            </span>
          </Link>
        </div>

        {/* CLASSIFICATION TYPE */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">
            RELATIONSHIP MAIN TYPE
          </label>
          <select
            value={relType}
            onChange={(e) => handleRelationshipTypeChange(e.target.value as any)}
            className="w-full h-[32px] px-2 text-[12px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/45 focus:border-[var(--color-accent-highlight)]/70 focus:outline-none transition-colors rounded-lg font-medium text-[var(--color-text-primary)]"
          >
            {RELATIONSHIP_TYPES.map((type) => (
              <option key={type} value={type}>
                {RELATIONSHIP_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {/* DYNAMIC LABELS */}
        <div className="space-y-3.5">
          {/* Label alias */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">
              DYNAMIC LABEL / ALIAS
            </label>
            <input
              type="text"
              placeholder="e.g. secret keepers, toxic rivals..."
              value={dynamicLabel}
              onChange={(e) => handleFieldChange('dynamic_label', e.target.value)}
              className="w-full h-[34px] px-3 text-[12px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/45 focus:border-[var(--color-accent-highlight)]/70 focus:outline-none rounded-lg text-[var(--color-text-primary)] font-medium"
            />
          </div>

          {/* Description summary */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">
              NARRATIVE SYNOPSIS
            </label>
            <textarea
              rows={3}
              placeholder="Explain how their interactions currently manifest..."
              value={dynamicDesc}
              onChange={(e) => handleFieldChange('dynamic_description', e.target.value)}
              className="w-full p-2.5 text-[12px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/45 focus:border-[var(--color-accent-highlight)]/70 focus:outline-none rounded-lg text-[var(--color-text-primary)] font-medium leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* TWELVE INTENSITY DIMENSIONS GRID */}
        <div className="space-y-2 pt-2 border-t border-[var(--color-border-subtle)]/20">
          <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block mb-1">
            INTENSITY DIMENSIONS
          </label>
          <div className="space-y-4">
            {INTENSITY_DIMENSIONS.map((dim) => (
              <IntensitySlider
                key={dim.key}
                dimension={dim}
                value={dimensions[dim.key as string] ?? 0}
                onChange={(val) => handleDimensionChange(dim.key as string, val)}
              />
            ))}
          </div>
        </div>

        {/* ARC EVOLUTION */}
        <div className="space-y-3.5 pt-4 border-t border-[var(--color-border-subtle)]/20">
          <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block">
            ARC EVOLUTION
          </label>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--color-text-muted)] font-medium">ARC STAGE</label>
            <input
              type="text"
              placeholder="e.g. mutual healing, betrayal arc..."
              value={arcStage}
              onChange={(e) => handleFieldChange('arc_stage', e.target.value)}
              className="w-full h-[32px] px-3 text-[12px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/45 focus:border-[var(--color-accent-highlight)]/70 focus:outline-none rounded-lg text-[var(--color-text-primary)]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[var(--color-text-muted)] font-medium">EVOLUTION NOTES</label>
            <textarea
              rows={4}
              placeholder="How did this bond evolve... what milestones changed it?"
              value={evolutionNotes}
              onChange={(e) => handleFieldChange('evolution_notes', e.target.value)}
              className="w-full p-2.5 text-[12px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/45 focus:border-[var(--color-accent-highlight)]/70 focus:outline-none rounded-lg text-[var(--color-text-primary)] leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* CUSTOM TAGS EDITOR */}
        <div className="space-y-2 pt-4 border-t border-[var(--color-border-subtle)]/20">
          <label className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase block">
            CLASSIFICATION SYSTEM TAGS
          </label>

          <form onSubmit={handleAddTag} className="flex gap-1.5">
            <input
              type="text"
              maxLength={20}
              placeholder="Type tag and press enter..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              className="flex-1 h-[30px] px-2.5 text-[11px] bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/45 focus:border-[var(--color-accent-highlight)]/70 focus:outline-none rounded-lg text-[var(--color-text-primary)]"
            />
            <button
              type="submit"
              className="h-[30px] px-3.5 bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)]/45 rounded-lg text-xs font-semibold flex items-center justify-center transition-all shrink-0"
            >
              Add
            </button>
          </form>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/20 px-2.5 py-0.5 rounded-md text-[10px] font-mono text-[var(--color-text-secondary)]"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[var(--color-text-muted)] hover:text-rose-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[10.5px] text-[var(--color-text-muted)] italic block pt-1">
              No tags applied yet. Use tags for category filtering.
            </span>
          )}
        </div>

        {/* DELETE ACTION BAR */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)]/20">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full h-9 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 rounded-lg text-xs font-semibold flex items-center justify-center transition-all duration-150"
          >
            Delete Relationship
          </button>
        </div>
      </div>

      {/* 4. RELATIONAL CONFIRMATION DELETION MODAL */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-[#0A0A0E]/90 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 w-full max-w-[280px] space-y-4 shadow-2xl">
            <div className="space-y-1.5">
              <h4 className="text-[13px] font-bold text-[var(--color-text-primary)]">
                Delete Relationship?
              </h4>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                Are you absolutely sure you want to delete this link? This will wipe all its intensity indexes and narrative history permanently.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="h-8 px-3.5 bg-transparent text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="h-8 px-4 bg-rose-600 hover:bg-rose-500 text-[11px] text-white font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={10} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
