import React, { useState } from 'react'
import { VersionSnapshot, versionHistoryService } from '../../../services/versionHistoryService'
import { Character } from '../../../shared/types/database'
import { formatDate } from '../../../shared/utils/format'
import { X, ArrowRight, CheckCircle2 } from 'lucide-react'

interface SnapshotDiffViewProps {
  snapshotA: VersionSnapshot   // older or first selected
  snapshotB: VersionSnapshot   // newer or second selected
  characterName: string
  onClose: () => void
  onRestore: (snapshot: VersionSnapshot) => void
}

export function SnapshotDiffView({
  snapshotA,
  snapshotB,
  characterName,
  onClose,
  onRestore
}: SnapshotDiffViewProps) {
  // Support toggling long field contents
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({})

  // Format timestamp safely
  const olderDate = formatDate(snapshotA.created_at)
  const newerDate = formatDate(snapshotB.created_at)

  // SAFELY PARSE WITH TRY-CATCH
  const olderParsed = versionHistoryService.parseSnapshot<Character>(snapshotA)
  const newerParsed = versionHistoryService.parseSnapshot<Character>(snapshotB)

  // Compute diffs
  const diffs = versionHistoryService.diffCharacters(olderParsed, newerParsed)

  const toggleFieldExpand = (field: string) => {
    setExpandedFields(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const renderValueHex = (val: string, fieldName: string) => {
    if (!val || val.trim() === '') {
      return <span className="italic text-[var(--color-text-muted)]">&mdash; (empty)</span>
    }

    const isLong = val.length > 200
    const isExpanded = expandedFields[fieldName]

    if (isLong && !isExpanded) {
      return (
        <span className="space-y-1">
          <span>{val.slice(0, 200)}... </span>
          <button
            type="button"
            onClick={() => toggleFieldExpand(fieldName)}
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 block focus:outline-none"
          >
            Show more
          </button>
        </span>
      )
    }

    return (
      <span className="space-y-1">
        <span>{val}</span>
        {isLong && (
          <button
            type="button"
            onClick={() => toggleFieldExpand(fieldName)}
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 block focus:outline-none"
          >
            Show less
          </button>
        )}
      </span>
    )
  }

  // Format field display label (e.g., Species -> Species, profile_completion -> Profile Completion)
  const getFieldLabel = (f: string) => {
    return f.replace(/_/g, ' ').toUpperCase()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-4 border-b border-[var(--color-border-subtle)]/15 flex justify-between items-center bg-[var(--color-bg-base)]/20">
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
              Comparing Versions of {characterName}
            </h3>
            {diffs.length > 0 && (
              <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/15 px-2 py-0.5 rounded">
                {diffs.length} fields changed
              </span>
            )}
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* COMPARISON METRIC BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* VERSION LABELS COMPARISON BOX */}
          <div className="grid grid-cols-2 gap-4 pb-2 text-center text-xs font-mono font-bold text-[var(--color-text-secondary)]">
            <div className="p-2.5 bg-rose-500/5 rounded-lg border border-rose-500/10">
              <span className="block text-[10px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider mb-0.5">Older Snapshot</span>
              <span className="text-[var(--color-text-primary)] block truncate">{snapshotA.version_label || 'Original Snapshot'}</span>
              <span className="text-[10px] font-normal text-[var(--color-text-muted)] block mt-0.5">{olderDate}</span>
            </div>
            <div className="p-2.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
              <span className="block text-[10px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider mb-0.5">Newer Snapshot</span>
              <span className="text-[var(--color-text-primary)] block truncate">{snapshotB.version_label || 'Original Snapshot'}</span>
              <span className="text-[10px] font-normal text-[var(--color-text-muted)] block mt-0.5">{newerDate}</span>
            </div>
          </div>

          {diffs.length === 0 ? (
            <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
              <CheckCircle2 size={28} className="text-emerald-400" />
              <p className="text-xs text-[var(--color-text-muted)] italic">
                These two versions are identical. No fields changed.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {diffs.map((diff) => (
                <div key={diff.field} className="space-y-1 bg-[var(--color-bg-base)]/20 p-3 rounded-lg border border-[var(--color-border-subtle)]/10">
                  <span className="block text-[10px] font-extrabold tracking-wider text-[var(--color-text-muted)] font-mono">
                    {getFieldLabel(diff.field)}
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    {/* BEFORE */}
                    <div className="bg-rose-500/5 rounded p-2.5 border border-rose-500/10 text-xs">
                      <span className="block text-[9px] font-bold text-rose-400 tracking-wider uppercase font-mono mb-1">
                        Before
                      </span>
                      <div className="text-[var(--color-text-secondary)] leading-normal break-words font-sans">
                        {renderValueHex(diff.old, `${diff.field}_A`)}
                      </div>
                    </div>
                    {/* AFTER */}
                    <div className="bg-emerald-500/5 rounded p-2.5 border border-emerald-500/10 text-xs">
                      <span className="block text-[9px] font-bold text-emerald-400 tracking-wider uppercase font-mono mb-1">
                        After
                      </span>
                      <div className="text-[var(--color-text-primary)] leading-normal break-words font-sans">
                        {renderValueHex(diff.new, `${diff.field}_B`)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-[var(--color-border-subtle)]/15 flex flex-wrap gap-2 justify-end bg-[var(--color-bg-base)]/20">
          <button
            type="button"
            onClick={() => onRestore(snapshotA)}
            className="h-8.5 px-3 rounded border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 font-bold text-[11px] select-none transition-all cursor-pointer"
          >
            Restore Older Version
          </button>
          <button
            type="button"
            onClick={() => onRestore(snapshotB)}
            className="h-8.5 px-3 rounded border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 font-bold text-[11px] select-none transition-all cursor-pointer"
          >
            Restore Newer Version
          </button>
          
          <div className="flex-1 max-sm:hidden" />
          
          <button
            type="button"
            onClick={onClose}
            className="h-8.5 px-4 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold text-xs select-none transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
