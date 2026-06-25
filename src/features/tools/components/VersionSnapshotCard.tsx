import React, { useState, useRef, useEffect } from 'react'
import { VersionSnapshot } from '../../../services/versionHistoryService'
import { Character } from '../../../shared/types/database'
import { formatRelativeTime } from '../../../shared/utils/format'
import { MoreVertical, Layers, RefreshCw, Trash2, Eye } from 'lucide-react'

interface VersionSnapshotCardProps {
  snapshot: VersionSnapshot
  character: Character | null
  onDelete: () => void
  onRestore: () => void
  onCompare: () => void
  isComparing: boolean
  onViewSnapshot: () => void
}

export function VersionSnapshotCard({
  snapshot,
  character,
  onDelete,
  onRestore,
  onCompare,
  isComparing,
  onViewSnapshot
}: VersionSnapshotCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Parse snapshot for delta computation
  const parsed: any = snapshot.parsed || {}
  const olderPct = parsed.profile_completion
  const newerPct = (character as any)?.profile_completion

  const hasDelta = olderPct !== undefined && newerPct !== undefined && olderPct !== newerPct
  const deltaVal = hasDelta ? newerPct - olderPct : 0

  return (
    <div 
      className={`relative bg-[var(--color-bg-elevated)] rounded-xl border p-4 flex justify-between items-start transition-all ${
        isComparing 
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md' 
          : 'border-[var(--color-border-subtle)]/30 hover:border-indigo-500/30'
      }`}
    >
      {/* LEFT SIDE DETAILS */}
      <div className="space-y-1.5 flex-1 pr-6 select-none">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {snapshot.version_label || 'Snapshot'}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] font-mono font-medium">
            {formatRelativeTime(snapshot.created_at)}
          </span>

          {/* DELTA COMPILATION */}
          {hasDelta && (
            <span 
              className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full ${
                deltaVal > 0 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              {deltaVal > 0 ? `+${deltaVal}%` : `${deltaVal}%`}
            </span>
          )}
        </div>

        {snapshot.change_notes && (
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed h-auto line-clamp-2">
            {snapshot.change_notes}
          </p>
        )}
      </div>

      {/* RIGHT SIDE THREE-DOT CONTEXT MENU */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded hover:bg-[var(--color-bg-base)] transition-colors focus:outline-none"
        >
          <MoreVertical size={16} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-44 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl py-1 z-40 animate-fade-in text-left">
            <button
              onClick={() => {
                onViewSnapshot()
                setDropdownOpen(false)
              }}
              className="w-full px-3 py-1.75 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]/70 flex items-center gap-2 transition-colors select-none"
            >
              <Eye size={13} className="text-indigo-400 shrink-0" />
              <span>View Snapshot</span>
            </button>
            
            <button
              onClick={() => {
                onCompare()
                setDropdownOpen(false)
              }}
              className="w-full px-3 py-1.75 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]/70 flex items-center gap-2 transition-colors select-none"
            >
              <Layers size={13} className="text-indigo-400 shrink-0" />
              <span>Compare with Another</span>
            </button>

            <div className="h-[1px] bg-[var(--color-border-subtle)]/15 my-1" />

            <button
              onClick={() => {
                onRestore()
                setDropdownOpen(false)
              }}
              className="w-full px-3 py-1.75 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)]/70 flex items-center gap-2 transition-colors select-none"
            >
              <RefreshCw size={13} className="text-indigo-400 shrink-0" />
              <span>Restore This Version</span>
            </button>

            <button
              onClick={() => {
                onDelete()
                setDropdownOpen(false)
              }}
              className="w-full px-3 py-1.75 text-xs text-rose-400 hover:text-rose-500 hover:bg-rose-500/5 flex items-center gap-2 transition-colors select-none font-semibold"
            >
              <Trash2 size={13} className="text-rose-400 shrink-0" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
