import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Users, BookOpen, FileText } from 'lucide-react'
import { Verse, VerseStats } from '../types'
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '../../../shared/components/ui/ContextMenu'
import { VerseSettingsModal } from './VerseSettingsModal'
import { formatDate } from '../../../shared/utils/format'

interface VerseCardProps {
  verse: Verse
  stats?: Partial<VerseStats>
  onVerseChanged?: () => void
}

export function VerseCard({ verse, stats, onVerseChanged }: VerseCardProps) {
  const navigate = useNavigate()
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const handleCardClick = () => {
    navigate(`/verse/${verse.id}`)
  }

  const handleThreeDotClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Open context menu near the button clicked
    setMenuPos({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[160px]"
      >
        <div>
          {/* Top Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Verse Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold uppercase transition-all duration-300 flex-shrink-0"
                style={{ backgroundColor: verse.icon_color }}
              >
                {verse.icon_letter || verse.name.charAt(0).toUpperCase()}
              </div>

              {/* Verse Name */}
              <h3 className="text-md font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent-primary)] transition-colors">
                {verse.name}
              </h3>
            </div>

            {/* Three Dot Options Button */}
            <button
              onClick={handleThreeDotClick}
              className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors focus:outline-none"
              title="Options"
            >
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-[var(--color-text-secondary)] mt-3 line-clamp-2 min-h-[32px] leading-relaxed">
            {verse.description || <span className="text-[var(--color-text-muted)] italic">No description</span>}
          </p>
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[var(--color-border-subtle)]/70">
          <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
            Created {formatDate(verse.created_at)}
          </span>

          {/* Stats Badges */}
          {stats && (
            <div className="flex items-center gap-2">
              {stats.characterCount !== undefined && (
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-secondary)]"
                  title={`${stats.characterCount} Characters`}
                >
                  <Users size={10} className="text-[var(--color-text-muted)]" />
                  <span>{stats.characterCount}</span>
                </div>
              )}
              {stats.loreCount !== undefined && (
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-secondary)]"
                  title={`${stats.loreCount} Lore Entries`}
                >
                  <BookOpen size={10} className="text-[var(--color-text-muted)]" />
                  <span>{stats.loreCount}</span>
                </div>
              )}
              {stats.writingCount !== undefined && (
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-secondary)]"
                  title={`${stats.writingCount} Writing Pieces`}
                >
                  <FileText size={10} className="text-[var(--color-text-muted)]" />
                  <span>{stats.writingCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Options Menu */}
      {menuPos && (
        <ContextMenu x={menuPos.x} y={menuPos.y} onClose={() => setMenuPos(null)}>
          <ContextMenuItem label="Open Verse" onClick={() => { setMenuPos(null); handleCardClick(); }} />
          <ContextMenuItem label="Verse Settings" onClick={() => { setMenuPos(null); setShowSettings(true); }} />
          <ContextMenuSeparator />
          <ContextMenuItem
            label="Delete Verse"
            danger
            onClick={() => {
              setMenuPos(null)
              setShowSettings(true) // Triggering delete confirmation inside settings modal as per design doc
            }}
          />
        </ContextMenu>
      )}

      {/* Settings Modal (includes nested secure Delete) */}
      <VerseSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        verse={verse}
        onSuccess={onVerseChanged}
      />
    </>
  )
}
