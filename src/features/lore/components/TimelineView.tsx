import React, { useState } from 'react'
import { GripVertical, Pin, Trash2, Edit2 } from 'lucide-react'
import { LoreEntry, LORE_CATEGORY_COLORS } from '../types'
import { LoreCategoryBadge } from './LoreCategoryBadge'
import { formatRelativeTime } from '../../../shared/utils/format'
import { useNavigate, useParams } from 'react-router-dom'

interface TimelineViewProps {
  entries: LoreEntry[]
  onReorder: (reordered: Array<{ id: string; sort_order: number }>) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string, isPinned: boolean) => void
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  entries,
  onReorder,
  onDelete,
  onTogglePin,
}) => {
  const navigate = useNavigate()
  const { verseId } = useParams<{ verseId: string }>()
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    // To make drag image look clean, we can customize it or just let default run
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (draggedId !== id) {
      setDragOverId(id)
    }
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const draggedIdx = entries.findIndex((item) => item.id === draggedId)
    const targetIdx = entries.findIndex((item) => item.id === targetId)
    if (draggedIdx === -1 || targetIdx === -1) return

    const newList = [...entries]
    const [draggedItem] = newList.splice(draggedIdx, 1)
    newList.splice(targetIdx, 0, draggedItem)

    // Assign new sequential sort_orders
    const updatedOrders = newList.map((item, index) => ({
      id: item.id,
      sort_order: index + 1,
    }))

    onReorder(updatedOrders)
    setDraggedId(null)
    setDragOverId(null)
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-[12px] text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-bg-subtle)]/30">
        No events or history entries in this timeline. Pin or tag events to list them here.
      </div>
    )
  }

  return (
    <div className="relative flex flex-col pl-6 md:pl-8 select-none">
      {/* Central Axis Line */}
      <div className="absolute left-[33px] md:left-[41px] top-4 bottom-4 w-0.5 bg-[var(--color-border-subtle)]/70" />

      {/* Timeline Items */}
      <div className="flex flex-col gap-4">
        {entries.map((entry, index) => {
          const color = LORE_CATEGORY_COLORS[entry.category] || '#6B7280'
          const isDragged = draggedId === entry.id
          const isDragOver = dragOverId === entry.id

          return (
            <div
              key={entry.id}
              draggable
              onDragStart={(e) => handleDragStart(e, entry.id)}
              onDragOver={(e) => handleDragOver(e, entry.id)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, entry.id)}
              className={`relative flex items-center gap-4 transition-all duration-150 ${
                isDragged ? 'opacity-40 scale-[0.98]' : ''
              } ${isDragOver ? 'border-t-2 border-dashed border-[var(--color-accent-primary)] pt-2' : ''}`}
            >
              {/* Axis Dot Indicator */}
              <div className="absolute left-[3px] md:left-[11px] flex items-center justify-center z-10">
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-[var(--color-bg-elevated)] shadow transition-colors"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 6px ${color}80`,
                  }}
                />
              </div>

              {/* Drag Handle icon */}
              <div
                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] transition-colors flex-shrink-0"
                title="Drag to reorder timeline event"
              >
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Timeline Card */}
              <div
                onClick={() => navigate(`/verse/${verseId}/lore/${entry.id}`)}
                className="flex-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-[14px] font-semibold text-[var(--color-text-primary)] leading-snug">
                        {entry.title}
                      </h4>
                      <LoreCategoryBadge category={entry.category} size="xs" />
                      {entry.is_pinned && (
                        <Pin className="w-3 h-3 text-[var(--color-accent-primary)] rotate-45" />
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      Order #{entry.sort_order || index + 1}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onTogglePin(entry.id, !entry.is_pinned)
                      }}
                      className={`p-1 rounded hover:bg-[var(--color-bg-subtle)] transition-colors ${
                        entry.is_pinned
                          ? 'text-[var(--color-accent-primary)]'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                      title={entry.is_pinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(entry.id)
                      }}
                      className="p-1 rounded hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {entry.summary && (
                  <p className="text-[12px] text-[var(--color-text-secondary)] mt-2 leading-relaxed">
                    {entry.summary}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--color-border-subtle)]/40 text-[10px] text-[var(--color-text-muted)]">
                  <span>Updated {formatRelativeTime(entry.updated_at)}</span>
                  {entry.tags?.length > 0 && (
                    <div className="flex items-center gap-1">
                      {entry.tags.slice(0, 3).map((t, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-[var(--color-bg-subtle)] text-[10px] border border-[var(--color-border-subtle)]/50">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
