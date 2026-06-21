import React, { useState, useEffect } from 'react'
import { Plus, BookOpen, Filter, FileText, Sparkles, AlertCircle } from 'lucide-react'
import { WritingGuideline, GuidelineCategory, GUIDELINE_CATEGORIES, GUIDELINE_CATEGORY_LABELS } from '../types'
import { guidelineService } from '../../../services/guidelineService'
import { GuidelineCard } from './GuidelineCard'
import { GuidelineUploadModal } from './GuidelineUploadModal'
import { Button } from '../../../shared/components/ui/Button'
import { useUIStore } from '../../../store/uiStore'

export const WritingGuidelinesSection: React.FC = () => {
  const [guidelines, setGuidelines] = useState<WritingGuideline[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<'all' | GuidelineCategory>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const addToast = useUIStore((state) => state.addToast)

  const fetchGuidelines = async () => {
    setLoading(true)
    try {
      const data = await guidelineService.getAll()
      setGuidelines(data)
    } catch (err) {
      console.error('Failed to load guidelines', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuidelines()
  }, [])

  const handleToggle = async (id: string, is_active: boolean) => {
    try {
      await guidelineService.update(id, { is_active })
      // optimistic update
      setGuidelines((prev) =>
        prev.map((g) => (g.id === id ? { ...g, is_active } : g))
      )
    } catch (err) {
      addToast({
        title: 'Failed to update guideline status',
        type: 'error',
      })
      // Rollback
      fetchGuidelines()
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await guidelineService.delete(id)
      addToast({
        title: 'Guideline deleted',
        type: 'success',
      })
      setGuidelines((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      addToast({
        title: 'Failed to delete guideline',
        type: 'error',
      })
    }
  }

  const filteredGuidelines = guidelines.filter((g) => {
    if (selectedFilter === 'all') return true
    return g.category === selectedFilter
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Intro info card */}
      <div className="bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/80 rounded-xl p-4 flex gap-3.5">
        <Sparkles size={18} className="text-[var(--color-accent-highlight)] shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            Intelligent Guidance Injection
          </h4>
          <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
            Enrich AI requests with styling and formatting requirements automatically. Activated guidelines are injected dynamically based on category alignment to keep LLMs grounded in your exact writing criteria.
          </p>
        </div>
      </div>

      {/* FILTER BUTTONS & UPLOAD TRIGGER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
        {/* Horizontal Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg shrink-0 transition-colors cursor-pointer select-none focus:outline-none ${
              selectedFilter === 'all'
                ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-text-primary)] border border-[var(--color-accent-primary)]/40'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            All Guidelines
          </button>
          {GUIDELINE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg shrink-0 transition-colors cursor-pointer select-none focus:outline-none ${
                selectedFilter === cat
                  ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-text-primary)] border border-[var(--color-accent-primary)]/40'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              {GUIDELINE_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Upload Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => setUploadOpen(true)}
          className="gap-1.5 shrink-0 px-4 h-8"
        >
          <Plus size={14} /> Add Guidelines
        </Button>
      </div>

      {/* GUIDELINES LIST AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--color-text-muted)]">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--color-accent-primary)] border-t-transparent" />
          <span className="text-[12px]">Loading writing guidelines...</span>
        </div>
      ) : filteredGuidelines.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border-strong)]/40 bg-[var(--color-bg-base)]/30 rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
            <BookOpen size={18} />
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h4 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              No guidelines configured
            </h4>
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
              {selectedFilter === 'all'
                ? 'Create or upload writing guidelines to steer tone, structural focus, and core pacing constraints.'
                : `No guidelines found matching the "${GUIDELINE_CATEGORY_LABELS[selectedFilter]}" category filter.`}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setUploadOpen(true)}
            className="gap-1 px-3 mt-1"
          >
            <Plus size={14} /> Add Guideline
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredGuidelines.map((guideline) => (
            <GuidelineCard
              key={guideline.id}
              guideline={guideline}
              onToggle={(isActive) => handleToggle(guideline.id, isActive)}
              onDelete={() => handleDelete(guideline.id)}
            />
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      <GuidelineUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onAdded={fetchGuidelines}
      />
    </div>
  )
}
