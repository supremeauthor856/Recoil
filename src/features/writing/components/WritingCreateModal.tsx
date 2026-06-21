import React, { useState } from 'react'
import { X, Feather } from 'lucide-react'
import { SubSeries } from '../../../shared/types/database'
import { CreateWritingInput, WritingType, WRITING_TYPES, WRITING_TYPE_LABELS } from '../types'

interface WritingCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateWritingInput) => Promise<void>
  subSeries: SubSeries[]
  verseId: string
}

export const WritingCreateModal: React.FC<WritingCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  subSeries,
  verseId,
}) => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<WritingType>('short-story')
  const [subSeriesId, setSubSeriesId] = useState<string>('')
  const [summary, setSummary] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        verse_id: verseId,
        title: title.trim(),
        type,
        sub_series_id: subSeriesId ? subSeriesId : null,
        summary: summary.trim() ? summary.trim() : undefined,
      })
      // Reset form
      setTitle('')
      setType('short-story')
      setSubSeriesId('')
      setSummary('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      id="writing-create-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div
        id="writing-create-modal"
        className="w-full max-w-lg rounded-xl border border-border-strong bg-bg-elevated shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
          <div className="flex items-center gap-2">
            <Feather className="h-5 w-5 text-accent-highlight" />
            <h2 className="text-md font-semibold text-text-primary">Create New Writing Piece</h2>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div id="modal-error-banner" className="rounded-lg bg-error-dim border border-error/20 p-3 text-xs text-error font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="title-input" className="block text-xs font-medium text-text-secondary">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title-input"
              type="text"
              required
              placeholder="e.g. A New Dawn, Whispers of the Void"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-bg-base px-3.5 py-2 text-sm text-text-primary shadow-xs outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="type-select" className="block text-xs font-medium text-text-secondary">
                Writing Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type-select"
                value={type}
                onChange={(e) => setType(e.target.value as WritingType)}
                className="w-full rounded-lg border border-border-default bg-bg-base px-3.5 py-2 text-sm text-text-primary shadow-xs outline-none focus:border-accent-primary transition-colors"
              >
                {WRITING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {WRITING_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="subseries-select" className="block text-xs font-medium text-text-secondary">
                Parent Campaign/Sub-Series
              </label>
              <select
                id="subseries-select"
                value={subSeriesId}
                onChange={(e) => setSubSeriesId(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-bg-base px-3.5 py-2 text-sm text-text-primary shadow-xs outline-none focus:border-accent-primary transition-colors"
              >
                <option value="">None (Stand-alone Piece)</option>
                {subSeries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="summary-textarea" className="block text-xs font-medium text-text-secondary">
              Summary / Pitch
            </label>
            <textarea
              id="summary-textarea"
              rows={3}
              placeholder="Brief overview of the writing piece..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-lg border border-border-default bg-bg-base px-3.5 py-2 text-sm text-text-primary shadow-xs outline-none resize-none focus:border-accent-primary transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
            <button
              id="cancel-create-btn"
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-create-btn"
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-accent-primary hover:bg-accent-primary-hover disabled:bg-text-disabled text-text-primary px-4 py-2 text-sm font-medium shadow-sm transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Piece'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
