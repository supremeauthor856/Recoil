import React, { useState } from 'react'
import { Pin, Star, Tags, AlertTriangle, Users, AlertCircle, Check } from 'lucide-react'
import { WritingPiece, WritingStatus, WRITING_STATUSES, WRITING_STATUS_LABELS } from '../types'
import { Character } from '../../../shared/types/database'

interface WritingMetadataPanelProps {
  piece: WritingPiece
  onUpdatePiece: (data: Partial<WritingPiece>) => Promise<void>
  characters: Character[]
}

export const WritingMetadataPanel: React.FC<WritingMetadataPanelProps> = ({
  piece,
  onUpdatePiece,
  characters,
}) => {
  const [title, setTitle] = useState(piece.title)
  const [summary, setSummary] = useState(piece.summary || '')
  const [newTag, setNewTag] = useState('')
  const [newWarning, setNewWarning] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [saveNotify, setSaveNotify] = useState(false)

  const handleStatusChange = async (status: WritingStatus) => {
    setIsUpdating(true)
    try {
      await onUpdatePiece({ status })
      triggerSaveNotification()
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePinnedToggle = async () => {
    setIsUpdating(true)
    try {
      await onUpdatePiece({ is_pinned: !piece.is_pinned })
      triggerSaveNotification()
    } catch (err) {
      console.error('Failed to toggle pin:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const triggerSaveNotification = () => {
    setSaveNotify(true)
    setTimeout(() => setSaveNotify(false), 2000)
  }

  const handleBlurSave = async () => {
    if (title.trim() === piece.title && summary.trim() === (piece.summary || '')) return
    setIsUpdating(true)
    try {
      await onUpdatePiece({
        title: title.trim() || piece.title,
        summary: summary.trim() ? summary.trim() : null,
      })
      triggerSaveNotification()
    } catch (err) {
      console.error('Failed to update basic meta:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim()) return
    const tag = newTag.trim().toLowerCase()
    if (piece.tags.includes(tag)) {
      setNewTag('')
      return
    }
    const updatedTags = [...piece.tags, tag]
    setIsUpdating(true)
    try {
      await onUpdatePiece({ tags: updatedTags })
      setNewTag('')
      triggerSaveNotification()
    } catch (err) {
      console.error('Failed to add tag:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = piece.tags.filter((t) => t !== tagToRemove)
    setIsUpdating(true)
    try {
      await onUpdatePiece({ tags: updatedTags })
      triggerSaveNotification()
    } catch (err) {
      console.error('Failed to remove tag:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddWarning = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWarning.trim()) return
    const wrn = newWarning.trim()
    if (piece.content_warnings.includes(wrn)) {
      setNewWarning('')
      return
    }
    const updatedWarnings = [...piece.content_warnings, wrn]
    setIsUpdating(true)
    try {
      await onUpdatePiece({ content_warnings: updatedWarnings })
      setNewWarning('')
      triggerSaveNotification()
    } catch (err) {
      console.error('Failed to add content warning:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveWarning = async (wrnToRemove: string) => {
    const updatedWarnings = piece.content_warnings.filter((w) => w !== wrnToRemove)
    setIsUpdating(true)
    try {
      await onUpdatePiece({ content_warnings: updatedWarnings })
      triggerSaveNotification()
    } catch (err) {
      console.error('Failed to remove content warning:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCharacterLinkToggle = async (charId: string) => {
    const linked = [...piece.linked_character_ids]
    const updated = linked.includes(charId)
      ? linked.filter((id) => id !== charId)
      : [...linked, charId]

    setIsUpdating(true)
    try {
      await onUpdatePiece({ linked_character_ids: updated })
      triggerSaveNotification()
    } catch (err) {
      console.error('Failed to link character:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div
      id="writing-metadata-panel"
      className="flex flex-col w-72 bg-bg-sidebar border-l border-border-default h-full overflow-y-auto scrollbar-custom p-4 space-y-6"
    >
      <div className="flex items-center justify-between border-b border-border-default pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Workspace Meta</h3>
        {saveNotify && (
          <span id="meta-save-toast" className="text-[10px] text-success flex items-center gap-1 font-mono">
            <Check className="h-3 w-3" /> Auto-saved
          </span>
        )}
      </div>

      {/* Basic editable details */}
      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-1">
          <label htmlFor="meta-title-input" className="block text-xs font-semibold text-text-secondary">
            Title
          </label>
          <input
            id="meta-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlurSave}
            placeholder="Title of piece..."
            className="w-full rounded-md border border-border-default bg-bg-base px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent-primary transition-colors"
          />
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label htmlFor="meta-status-select" className="block text-xs font-semibold text-text-secondary">
            Workflow Status
          </label>
          <select
            id="meta-status-select"
            value={piece.status}
            onChange={(e) => handleStatusChange(e.target.value as WritingStatus)}
            disabled={isUpdating}
            className="w-full rounded-md border border-border-default bg-bg-base px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent-primary transition-colors disabled:opacity-50"
          >
            {WRITING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {WRITING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Pin to top */}
        <button
          id="meta-pin-toggle-btn"
          onClick={handlePinnedToggle}
          disabled={isUpdating}
          className={`w-full flex items-center justify-center gap-2 rounded-md border p-2 text-xs font-medium transition-all cursor-pointer ${
            piece.is_pinned
              ? 'bg-accent-primary-dim border-accent-primary text-accent-highlight'
              : 'border-border-default text-text-secondary hover:bg-bg-hover'
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${piece.is_pinned ? 'fill-accent-highlight text-accent-highlight' : ''}`} />
          <span>{piece.is_pinned ? 'Pinned to Verse top' : 'Pin to Verse top'}</span>
        </button>

        {/* Summary text */}
        <div className="space-y-1">
          <label htmlFor="meta-summary-text" className="block text-xs font-semibold text-text-secondary">
            Logs / Story Summary
          </label>
          <textarea
            id="meta-summary-text"
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            onBlur={handleBlurSave}
            placeholder="Plot threads or outline snippets..."
            className="w-full rounded-md border border-border-default bg-bg-base p-2.5 text-xs text-text-primary outline-none resize-none focus:border-accent-primary transition-colors"
          />
        </div>
      </div>

      {/* Linked Characters */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-text-muted" />
          Linked Characters
        </h4>
        <div
          id="meta-char-grid"
          className="max-h-40 border border-border-default rounded-md bg-bg-base/30 overflow-y-auto index-scroller p-2 space-y-1"
        >
          {characters.length === 0 ? (
            <p id="no-characters-warn" className="text-[10px] text-text-muted italic p-2 text-center">
              No characters in this verse to link.
            </p>
          ) : (
            characters.map((char) => {
              const isLinked = piece.linked_character_ids.includes(char.id)
              return (
                <button
                  key={char.id}
                  id={`link-char-${char.id}`}
                  onClick={() => handleCharacterLinkToggle(char.id)}
                  disabled={isUpdating}
                  className={`w-full flex items-center justify-between text-left rounded-md p-1.5 text-xs transition-colors cursor-pointer ${
                    isLinked
                      ? 'bg-accent-primary-dim/45 text-text-primary'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                >
                  <span className="truncate">{char.name}</span>
                  {isLinked && <Check className="h-3.5 w-3.5 text-accent-highlight" />}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Tags section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <Tags className="h-3.5 w-3.5 text-text-muted" />
          Tags
        </h4>

        {/* Selected Tags list */}
        <div id="meta-tags-container" className="flex flex-wrap gap-1.5">
          {piece.tags.map((tag) => (
            <span
              key={tag}
              id={`tag-pill-${tag}`}
              onClick={() => handleRemoveTag(tag)}
              className="group inline-flex items-center gap-1 rounded-full bg-bg-base border border-border-default px-2 py-0.5 text-[10px] font-mono text-text-secondary hover:border-error hover:text-error transition-colors cursor-pointer"
              title="Click to remove tag"
            >
              #{tag}
              <span className="text-text-muted group-hover:text-error">×</span>
            </span>
          ))}
          {piece.tags.length === 0 && (
            <span id="no-tags-guide" className="text-[10px] text-text-muted italic">
              No tags assigned.
            </span>
          )}
        </div>

        {/* Add Tag inline form */}
        <form onSubmit={handleAddTag} className="flex gap-2">
          <input
            id="new-tag-input"
            type="text"
            placeholder="Add tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="flex-1 rounded-md border border-border-default bg-bg-base px-2 py-1 text-xs text-text-primary outline-none focus:border-accent-primary transition-colors"
          />
        </form>
      </div>

      {/* Content Warnings */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-text-muted" />
          Content Warnings
        </h4>

        {/* Selected Warnings list */}
        <div id="meta-warnings-container" className="flex flex-wrap gap-1.5">
          {piece.content_warnings.map((warning) => (
            <span
              key={warning}
              id={`warning-pill-${warning}`}
              onClick={() => handleRemoveWarning(warning)}
              className="group inline-flex items-center gap-1 rounded-md bg-warning-dim border border-warning/20 px-2 py-0.5 text-[10px] text-warning hover:border-error hover:text-error hover:bg-error-dim transition-colors cursor-pointer"
              title="Click to remove warning"
            >
              <AlertCircle className="h-2.5 w-2.5 shrink-0" />
              {warning}
              <span className="text-text-muted group-hover:text-error font-bold ml-0.5">×</span>
            </span>
          ))}
          {piece.content_warnings.length === 0 && (
            <span id="no-warnings-guide" className="text-[10px] text-text-muted italic">
              No content warnings listed.
            </span>
          )}
        </div>

        {/* Add warning inline form */}
        <form onSubmit={handleAddWarning} className="flex gap-2">
          <input
            id="new-warning-input"
            type="text"
            placeholder="e.g. Gore, Violence..."
            value={newWarning}
            onChange={(e) => setNewWarning(e.target.value)}
            className="flex-1 rounded-md border border-border-default bg-bg-base px-2 py-1 text-xs text-text-primary outline-none focus:border-accent-primary transition-colors"
          />
        </form>
      </div>
    </div>
  )
}
export default WritingMetadataPanel
