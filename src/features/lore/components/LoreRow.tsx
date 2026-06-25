import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pin, MoreVertical } from 'lucide-react'
import { LoreEntry } from '../types'
import { LoreCategoryBadge } from './LoreCategoryBadge'
import { Badge } from '../../../shared/components/ui/Badge'
import { formatRelativeTime } from '../../../shared/utils/format'
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../../../shared/components/ui/ContextMenu'

interface LoreRowProps {
  entry: LoreEntry
  onDelete: (id: string) => void
  onTogglePin: (id: string, isPinned: boolean) => void
}

export const LoreRow: React.FC<LoreRowProps> = ({
  entry,
  onDelete,
  onTogglePin,
}) => {
  const navigate = useNavigate()
  const { verseId } = useParams<{ verseId: string }>()
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)

  const handleRowClick = (e: React.MouseEvent) => {
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
      onClick={handleRowClick}
      className="w-full flex items-center gap-3 h-12 border-b border-[var(--color-border-subtle)] px-4 hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors duration-150"
    >
      {/* 1. Category Badge */}
      <div className="flex-shrink-0">
        <LoreCategoryBadge category={entry.category} size="xs" />
      </div>

      {/* 2. Title */}
      <div className="flex-1 min-w-0">
        <span className="text-[14px] font-semibold text-[var(--color-text-primary)] truncate block">
          {entry.title}
        </span>
      </div>

      {/* 3. Summary Excerpt */}
      <div className="hidden sm:block max-w-[200px] w-full truncate">
        <span className="text-[12px] text-[var(--color-text-muted)]">
          {entry.summary || 'No summary'}
        </span>
      </div>

      {/* 4. Tags */}
      <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
        {entry.tags?.slice(0, 2).map((tag, i) => (
          <Badge key={i} variant="dim" size="xs">
            {tag}
          </Badge>
        ))}
      </div>

      {/* 5. Pin Icon */}
      <div className="flex-shrink-0 w-4 flex justify-center">
        {entry.is_pinned && (
          <Pin className="w-3.5 h-3.5 text-[var(--color-accent-primary)] rotate-45" />
        )}
      </div>

      {/* 6. Updated Time */}
      <div className="hidden sm:block flex-shrink-0 text-[11px] text-[var(--color-text-muted)] min-w-[70px] text-right">
        {formatRelativeTime(entry.updated_at)}
      </div>

      {/* 7. Context Menu Trigger */}
      <div className="flex-shrink-0 context-menu-trigger">
        <button
          onClick={handleMenuTrigger}
          className="p-1 rounded hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
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
