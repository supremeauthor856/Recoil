import React, { useState } from 'react'
import { MoreVertical, FileText, Check, AlertCircle, X } from 'lucide-react'
import { WritingGuideline, GUIDELINE_CATEGORY_LABELS } from '../types'
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../../../shared/components/ui/ContextMenu'
import { Button } from '../../../shared/components/ui/Button'
import { Modal } from '../../../shared/components/ui/Modal'

interface GuidelineCardProps {
  guideline: WritingGuideline
  onToggle: (isActive: boolean) => void
  onDelete: () => void
}

export const GuidelineCard: React.FC<GuidelineCardProps> = ({
  guideline,
  onToggle,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuCoords, setMenuCoords] = useState({ x: 0, y: 0 })
  const [viewOpen, setViewOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuCoords({
      x: rect.left,
      y: rect.bottom + 4,
    })
    setMenuOpen(!menuOpen)
  }

  const charCount = guideline.content_preview?.length ?? guideline.file_size ?? 0

  return (
    <>
      <div
        className={`bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-subtle)] p-4 flex items-center justify-between gap-4 transition-all duration-200 ${
          !guideline.is_active ? 'opacity-55 scale-[0.99] filter grayscale-[30%]' : ''
        }`}
      >
        {/* Left: Controlled switch */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onToggle(!guideline.is_active)}
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              guideline.is_active ? 'bg-[var(--color-accent-primary)]' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                guideline.is_active ? 'translate-x-3' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
              {guideline.display_name}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-highlight)] font-medium">
              {GUIDELINE_CATEGORY_LABELS[guideline.category] || guideline.category}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-mono">
              <FileText size={11} /> {charCount.toLocaleString()} chars
            </span>
          </div>
        </div>

        {/* Right context actions */}
        <div className="relative shrink-0 flex items-center gap-1">
          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-[var(--color-bg-base)] border border-[var(--color-error)]/40 px-2 py-1 rounded-[var(--radius-lg)] animate-fade-in z-10">
              <span className="text-[10px] text-[var(--color-error)] font-medium mr-1 uppercase tracking-tight">
                Delete?
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                  setConfirmDelete(false)
                }}
                className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10 p-0.5 rounded transition-colors"
                title="Confirm delete"
              >
                <Check size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmDelete(false)
                }}
                className="text-[var(--color-text-muted)] hover:text-white p-0.5 rounded transition-colors"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleMenuClick}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] p-1.5 rounded-lg transition-colors focus:outline-none"
            >
              <MoreVertical size={14} />
            </button>
          )}

          {menuOpen && (
            <ContextMenu x={menuCoords.x} y={menuCoords.y} onClose={() => setMenuOpen(false)}>
              <ContextMenuItem
                label="View Content"
                onClick={() => {
                  setViewOpen(true)
                  setMenuOpen(false)
                }}
              />
              <ContextMenuSeparator />
              <ContextMenuItem
                label="Delete Guidelines"
                danger
                onClick={() => {
                  setConfirmDelete(true)
                  setMenuOpen(false)
                }}
              />
            </ContextMenu>
          )}
        </div>
      </div>

      {/* FULL PREVIEW MODAL */}
      <Modal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        title={guideline.display_name}
        size="lg"
      >
        <div className="flex flex-col gap-3 min-h-[300px] max-h-[500px] overflow-y-auto pr-1 scrollbar-custom select-text">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border-subtle)]/60 text-[11px] text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-accent-highlight)]">
              {GUIDELINE_CATEGORY_LABELS[guideline.category] || guideline.category}
            </span>
            <span>•</span>
            <span className="font-mono">{charCount.toLocaleString()} characters</span>
            <span>•</span>
            <span>Created {new Date(guideline.created_at).toLocaleDateString()}</span>
          </div>

          <pre className="text-[12px] text-[var(--color-text-primary)] font-mono leading-relaxed bg-[var(--color-bg-base)]/50 p-4 rounded-lg border border-[var(--color-border-subtle)]/50 whitespace-pre-wrap select-text">
            {guideline.content_preview || 'No content provided.'}
          </pre>

          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
