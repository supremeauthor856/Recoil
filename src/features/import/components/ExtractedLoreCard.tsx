import React from 'react'
import { ExtractedLoreEntry } from '../types'

interface ExtractedLoreCardProps {
  entry: ExtractedLoreEntry
  onToggle: () => void
}

export function ExtractedLoreCard({ entry, onToggle }: ExtractedLoreCardProps) {
  const isIncluded = entry._status !== 'excluded'

  return (
    <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)]/30 p-4 mb-2 shadow-sm flex items-start gap-3 select-none">
      <div className="pt-0.5 select-none">
        <input
          id={`checkbox-lore-${entry._id}`}
          type="checkbox"
          checked={isIncluded}
          onChange={onToggle}
          className="w-4 h-4 text-indigo-600 border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] rounded shadow-sm focus:ring-indigo-500 focus:ring-2 cursor-pointer"
        />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {entry.category && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400 capitalize">
              {entry.category}
            </span>
          )}
          <label htmlFor={`checkbox-lore-${entry._id}`} className="text-xs font-bold text-[var(--color-text-primary)] cursor-pointer hover:text-indigo-400">
            {entry.title}
          </label>
        </div>

        {entry.summary ? (
          <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
            {entry.summary}
          </p>
        ) : entry.content ? (
          <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed font-serif">
            {entry.content.slice(0, 100)}{entry.content.length > 100 ? '...' : ''}
          </p>
        ) : (
          <p className="text-[11px] text-[var(--color-text-muted)] italic leading-relaxed">
            No lore summary or description available.
          </p>
        )}
      </div>
    </div>
  )
}
