import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'
import { SubSeries } from '../types'
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../../../shared/components/ui/ContextMenu'
import { formatDate } from '../../../shared/utils/format'

interface SubSeriesCardProps {
  subSeries: SubSeries
  verseId: string
  onEdit: () => void
  onDelete: () => void
}

export function SubSeriesCard({ subSeries, verseId, onEdit, onDelete }: SubSeriesCardProps) {
  const navigate = useNavigate()
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)

  const handleCardClick = () => {
    navigate(`/verse/${verseId}/sub-series/${subSeries.id}`)
  }

  const handleThreeDotClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuPos({ x: e.clientX, y: e.clientY })
  }

  const tagColor = subSeries.icon_color || 'var(--color-accent-primary)'

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] p-4 transition-all duration-150 cursor-pointer shadow-sm flex flex-col justify-between min-h-[120px]"
      >
        <div>
          {/* Top Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Color Dot Tag */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 border border-[var(--color-border-subtle)]"
                style={{ backgroundColor: tagColor }}
              />

              {/* Name */}
              <h4 className="text-[15px] font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent-primary)] transition-colors">
                {subSeries.name}
              </h4>
            </div>

            {/* Options Button */}
            <button
              onClick={handleThreeDotClick}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors focus:outline-none"
              title="Options"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-[var(--color-text-secondary)] mt-2 line-clamp-2 min-h-[32px] leading-relaxed">
            {subSeries.description || (
              <span className="text-[var(--color-text-muted)] italic">No description</span>
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-border-subtle)]/50">
          <span className="text-[10px] text-[var(--color-text-muted)]">
            Created {formatDate(subSeries.created_at)}
          </span>
        </div>
      </div>

      {/* Options Menu */}
      {menuPos && (
        <ContextMenu x={menuPos.x} y={menuPos.y} onClose={() => setMenuPos(null)}>
          <ContextMenuItem
            label="Open Sub-series"
            onClick={() => {
              setMenuPos(null)
              handleCardClick()
            }}
          />
          <ContextMenuItem
            label="Edit Sub-series"
            onClick={() => {
              setMenuPos(null)
              onEdit()
            }}
          />
          <ContextMenuSeparator />
          <ContextMenuItem
            label="Delete"
            danger
            onClick={() => {
              setMenuPos(null)
              onDelete()
            }}
          />
        </ContextMenu>
      )}
    </>
  )
}
