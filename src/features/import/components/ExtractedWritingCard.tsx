import React from 'react'
import { ExtractedWritingPiece } from '../types'
import { countWords } from '../../../services/writingService'

interface ExtractedWritingCardProps {
  piece: ExtractedWritingPiece
  onToggle: () => void
}

export function ExtractedWritingCard({ piece, onToggle }: ExtractedWritingCardProps) {
  const isIncluded = piece._status !== 'excluded'
  const wCount = piece.content ? countWords(piece.content) : 0

  return (
    <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)]/30 p-4 mb-2 shadow-sm flex items-start gap-3 select-none">
      <div className="pt-0.5 select-none animate-fade-in">
        <input
          id={`checkbox-writing-${piece._id}`}
          type="checkbox"
          checked={isIncluded}
          onChange={onToggle}
          className="w-4 h-4 text-indigo-600 border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] rounded shadow-sm focus:ring-indigo-500 focus:ring-2 cursor-pointer"
        />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {piece.type && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 capitalize">
              {piece.type.replace('-', ' ')}
            </span>
          )}
          <label htmlFor={`checkbox-writing-${piece._id}`} className="text-xs font-bold text-[var(--color-text-primary)] cursor-pointer hover:text-indigo-400">
            {piece.title}
          </label>
          {wCount > 0 && (
            <span className="text-[10px] font-mono font-semibold text-[var(--color-text-muted)]">
              ({wCount.toLocaleString()} words)
            </span>
          )}
        </div>

        {piece.summary ? (
          <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
            {piece.summary}
          </p>
        ) : piece.content ? (
          <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed font-serif">
            {piece.content.slice(0, 100)}{piece.content.length > 100 ? '...' : ''}
          </p>
        ) : (
          <p className="text-[11px] text-[var(--color-text-muted)] italic leading-relaxed">
            Empty document content body.
          </p>
        )}
      </div>
    </div>
  )
}
