import React, { useRef, useState, useEffect } from 'react'
import { MoreHorizontal, ChevronRight } from 'lucide-react'
import { cn } from '../../../shared/utils/cn'
import type { ForeshadowingEntry, ForeshadowingStatus } from '../types'
import { FORESHADOWING_STATUS_COLORS, FORESHADOWING_STATUS_LABELS, FORESHADOWING_STATUSES } from '../types'

function formatRelativeTime(ts: number) {
  return new Date(ts).toLocaleString()
}

interface ForeshadowingCardProps {
  entry: ForeshadowingEntry
  onEdit: (entry: ForeshadowingEntry) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: ForeshadowingStatus) => void
}

export function ForeshadowingCard({ entry, onEdit, onDelete, onStatusChange }: ForeshadowingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] p-4 flex flex-col gap-2 transition-colors relative group">
      
      {/* Top Row */}
      <div className="flex flex-row items-start justify-between">
        <div 
          className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase flex items-center gap-1.5 w-fit"
          style={{ 
            color: FORESHADOWING_STATUS_COLORS[entry.status],
            backgroundColor: `${FORESHADOWING_STATUS_COLORS[entry.status]}15`,
            border: `1px solid ${FORESHADOWING_STATUS_COLORS[entry.status]}30`
          }}
        >
          <div 
            className="w-1.5 h-1.5 rounded-full" 
            style={{ backgroundColor: FORESHADOWING_STATUS_COLORS[entry.status] }} 
          />
          {FORESHADOWING_STATUS_LABELS[entry.status]}
        </div>

        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={16} />
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 top-8 w-48 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl z-20 py-1 flex flex-col text-[13px] animate-in fade-in zoom-in duration-150">
              <button 
                className="w-full text-left px-3 py-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]"
                onClick={() => { onEdit(entry); setMenuOpen(false) }}
              >
                Edit
              </button>
              
              <div className="h-px bg-[var(--color-border-subtle)] my-1" />
              
              {FORESHADOWING_STATUSES.map(s => (
                <button 
                  key={s}
                  className={cn(
                    "w-full text-left px-3 py-1.5 transition-colors",
                    entry.status === s 
                      ? "text-[var(--color-text-muted)] cursor-default" 
                      : "hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]"
                  )}
                  disabled={entry.status === s}
                  onClick={() => { onStatusChange(entry.id, s); setMenuOpen(false) }}
                >
                  Mark as {FORESHADOWING_STATUS_LABELS[s]}
                </button>
              ))}

              <div className="h-px bg-[var(--color-border-subtle)] my-1" />
              
              <button 
                className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 text-red-500 transition-colors"
                onClick={() => { onDelete(entry.id); setMenuOpen(false) }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-[14px] text-[var(--color-text-primary)] leading-relaxed m-0 whitespace-pre-wrap">
        {entry.description}
      </p>

      {/* Connection Row */}
      {(entry.planted_in || entry.payoff_in) && (
        <div className="flex flex-row items-center gap-2 mt-2 bg-[var(--color-bg-base)] rounded-lg px-3 py-2 border border-[var(--color-border-subtle)] w-fit flex-wrap">
          {entry.planted_in && (
            <div className="flex flex-row items-center gap-1.5 max-w-[200px]">
              <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">Planted in:</span>
              <span className="text-[12px] text-[var(--color-text-secondary)] font-medium truncate" title={entry.planted_in}>{entry.planted_in}</span>
            </div>
          )}
          
          {entry.planted_in && entry.payoff_in && (
            <ChevronRight size={14} className="text-[var(--color-text-muted)] flex-shrink-0" />
          )}

          {entry.payoff_in && (
            <div className="flex flex-row items-center gap-1.5 max-w-[200px]">
              <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">Pays off in:</span>
              <span className="text-[12px] text-[var(--color-text-secondary)] font-medium truncate" title={entry.payoff_in}>{entry.payoff_in}</span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <p className="text-[12px] text-[var(--color-text-muted)] italic leading-snug mt-1">
          {entry.notes}
        </p>
      )}

      <div className="w-full text-right mt-2">
        <span className="text-[11px] text-[var(--color-text-muted)]">
          {formatRelativeTime(entry.created_at)}
        </span>
      </div>

    </div>
  )
}
