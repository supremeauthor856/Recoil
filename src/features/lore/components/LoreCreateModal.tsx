import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { LoreCategory, LORE_CATEGORIES, LORE_CATEGORY_LABELS } from '../types'
import { loreService } from '../../../services/loreService'
import { getSubSeries } from '../../../services/verseService'
import { SubSeries } from '../../../shared/types/database'
import { Modal } from '../../../shared/components/ui/Modal'
import { Input } from '../../../shared/components/ui/Input'
import { Textarea } from '../../../shared/components/ui/Textarea'
import { Button } from '../../../shared/components/ui/Button'
import { LoreCategoryBadge } from './LoreCategoryBadge'
import { useUIStore } from '../../../store/uiStore'

interface LoreCreateModalProps {
  isOpen: boolean
  onClose: () => void
  verseId: string
  defaultCategory?: LoreCategory
  onCreated?: (newId: string) => void
}

export const LoreCreateModal: React.FC<LoreCreateModalProps> = ({
  isOpen,
  onClose,
  verseId,
  defaultCategory,
  onCreated,
}) => {
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<LoreCategory>('other')
  const [subSeriesId, setSubSeriesId] = useState<string>('')
  const [summary, setSummary] = useState('')
  const [subSeriesList, setSubSeriesList] = useState<SubSeries[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync default category if provided
  useEffect(() => {
    if (defaultCategory) {
      setCategory(defaultCategory)
    } else {
      setCategory('other')
    }
  }, [defaultCategory, isOpen])

  // Fetch sub-series list
  useEffect(() => {
    if (isOpen && verseId) {
      getSubSeries(verseId)
        .then(setSubSeriesList)
        .catch((err) => console.error('Failed to load sub-series', err))
    }
  }, [verseId, isOpen])

  // Reset fields on open
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setSummary('')
      setSubSeriesId('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const entry = await loreService.createEntry({
        verse_id: verseId,
        title: title.trim(),
        category,
        sub_series_id: subSeriesId || null,
        summary: summary.trim() || undefined,
        content: '', // empty TipTap document at start
      })

      addToast({
        title: 'Lore entry created',
        type: 'success',
      })

      onClose()
      if (onCreated) {
        onCreated(entry.id)
      } else {
        navigate(`/verse/${verseId}/lore/${entry.id}`)
      }
    } catch (err: any) {
      console.error(err)
      addToast({
        title: err.message || 'Failed to create lore entry',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!title.trim() || isSubmitting}
      >
        Create Entry
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Lore Entry"
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title & Live Preview badge */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">
              Title *
            </label>
            <div className="scale-95 origin-right">
              <LoreCategoryBadge category={category} size="xs" />
            </div>
          </div>
          <Input
            id="lore-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., The Great Shattering, Silver Elves"
            required
            autoFocus
          />
        </div>

        {/* Category Selection Grid */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">
            Category
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1 border border-[var(--color-border-subtle)]/40 p-2 rounded-lg bg-[var(--color-bg-subtle)]/30 scrollbar-custom">
            {LORE_CATEGORIES.map((cat) => {
              const isSelected = category === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-accent-primary-dim)] border-[var(--color-accent-primary)] ring-1 ring-[var(--color-accent-primary)] text-[var(--color-text-primary)]'
                      : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  <LoreCategoryBadge category={cat} size="xs" />
                  <span className="text-[10px] text-[var(--color-text-muted)] mt-1 truncate max-w-full">
                    {LORE_CATEGORY_LABELS[cat]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sub Series Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">
            Sub-series (Optional)
          </label>
          <select
            id="lore-subseries-select"
            value={subSeriesId}
            onChange={(e) => setSubSeriesId(e.target.value)}
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

        {/* Summary */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">
            Summary (Optional)
          </label>
          <Textarea
            id="lore-summary-textarea"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief description — shown in previews and search results"
            rows={3}
          />
        </div>
      </form>
    </Modal>
  )
}
