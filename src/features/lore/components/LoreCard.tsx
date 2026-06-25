import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pin, Users, Link, MoreVertical, Edit2, BookOpen, Trash2 } from 'lucide-react'
import { LoreEntry } from '../types'
import { LoreCategoryBadge } from './LoreCategoryBadge'
import { Badge } from '../../../shared/components/ui/Badge'
import { formatRelativeTime } from '../../../shared/utils/format'
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../../../shared/components/ui/ContextMenu'

interface LoreCardProps {
  entry: LoreEntry
  onDelete: (id: string) => void
  onTogglePin: (id: string, isPinned: boolean) => void
}

export const LoreCard: React.FC<LoreCardProps> = ({
  entry,
  onDelete,
  onTogglePin,
}) => {
  const navigate = useNavigate()
  const { verseId } = useParams<{ verseId: string }>()
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)

  const handleCardClick = (e: React.MouseEvent) => {
    // If we clicked context menu or its toggle button, don't trigger navigation
    if ((e.target as HTMLElement).closest('.context-menu-trigger')) {
      return
    }
    navigate(`/verse/${verseId}/lore/${entry.id}`)
  }

  const handleMenuTrigger = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)] p-4 hover:-translate-y-0.5 hover:border-[var(--color-border-default)] hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between h-[180px]"
    >
      <div>
        {/* Top Row */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <LoreCategoryBadge category={entry.category} size="sm" />
          </div>

          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0 context-menu-trigger">
            {entry.is_pinned && (
              <Pin className="w-3 h-3 text-[var(--color-accent-primary)] rotate-45" />
            )}
            <button
              onClick={handleMenuTrigger}
              className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] tracking-tight mt-2.5 line-clamp-2 leading-snug">
          {entry.title}
        </h3>

        {/* Summary */}
        <p className="text-[12px] text-[var(--color-text-secondary)] mt-1.5 line-clamp-3 leading-relaxed">
          {entry.summary ? (
            entry.summary
          ) : (
            <span className="italic text-[var(--color-text-muted)]">No summary</span>
          )}
        </p>
      </div>

      <div>
        {/* Linked Row & Tags */}
        <div className="flex flex-col gap-1.5 mt-2">
          {/* Linked stats */}
          {(entry.linked_character_ids?.length > 0 || entry.linked_lore_ids?.length > 0) && (
            <div className="flex items-center gap-3 flex-wrap">
              {entry.linked_character_ids?.length > 0 && (
                <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                  <Users className="w-3 h-3" />
                  <span className="text-[11px]">
                    {entry.linked_character_ids.length} character
                    {entry.linked_character_ids.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {entry.linked_lore_ids?.length > 0 && (
                <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                  <Link className="w-3 h-3" />
                  <span className="text-[11px]">
                    {entry.linked_lore_ids.length} linked
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {entry.tags?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap overflow-hidden">
              {entry.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="dim" size="xs">
                  {tag}
                </Badge>
              ))}
              {entry.tags.length > 3 && (
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  +{entry.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--color-border-subtle)]/30 text-[11px] text-[var(--color-text-muted)]">
            <span>Updated {formatRelativeTime(entry.updated_at)}</span>
          </div>
        </div>
      </div>

      {menuPos && (
        <ContextMenu x={menuPos.x} y={menuPos.y} onClose={() => setMenuPos(null)}>
          <ContextMenuItem
            label="Open"
            onClick={() => {
              setMenuPos(null)
              navigate(`/verse/${verseId}/lore/${entry.id}`)
            }}
          />
          <ContextMenuItem
            label="Edit"
            onClick={() => {
              setMenuPos(null)
              navigate(`/verse/${verseId}/lore/${entry.id}`)
            }}
          />
          <ContextMenuSeparator />
          <ContextMenuItem
            label={entry.is_pinned ? 'Unpin' : 'Pin'}
            onClick={() => {
              setMenuPos(null)
              onTogglePin(entry.id, !entry.is_pinned)
            }}
          />
          <ContextMenuSeparator />
          <ContextMenuItem
            label="Delete"
            danger
            onClick={() => {
              setMenuPos(null)
              onDelete(entry.id)
            }}
          />
        </ContextMenu>
      )}
    </div>
  )
}
