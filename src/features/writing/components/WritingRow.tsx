import React from 'react'
import { Pin, FileText, Calendar } from 'lucide-react'
import { WritingPiece } from '../types'
import { SubSeries } from '../../../shared/types/database'
import { WritingTypeBadge } from './WritingTypeBadge'
import { WritingStatusBadge } from './WritingStatusBadge'

interface WritingRowProps {
  piece: WritingPiece
  onClick: (id: string) => void
  subSeries: SubSeries[]
}

export const WritingRow: React.FC<WritingRowProps> = ({ piece, onClick, subSeries }) => {
  const parentSeries = subSeries.find((s) => s.id === piece.sub_series_id)

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div
      id={`writing-row-${piece.id}`}
      onClick={() => onClick(piece.id)}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle bg-bg-base/40 hover:bg-bg-hover/50 p-4 cursor-pointer transition-colors"
    >
      {/* Title, Campaign, Summary section */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          {piece.is_pinned && (
            <Pin className="h-3.5 w-3.5 text-accent-highlight fill-accent-highlight shrink-0" />
          )}
          <h4
            id={`writing-row-title-${piece.id}`}
            className="text-sm font-semibold text-text-primary group-hover:text-accent-highlight transition-colors truncate"
          >
            {piece.title}
          </h4>
          {parentSeries && (
            <span
              id={`writing-row-series-${piece.id}`}
              className="text-xs text-text-secondary bg-bg-elevated border border-border-default px-2 py-0.5 rounded-md"
            >
              {parentSeries.name}
            </span>
          )}
        </div>
        <p
          id={`writing-row-summary-${piece.id}`}
          className="text-xs text-text-secondary line-clamp-1 leading-relaxed"
        >
          {piece.summary || <span className="italic text-text-muted">No summary provided</span>}
        </p>
      </div>

      {/* Badges, stats, and last update */}
      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
        <div className="flex items-center gap-2">
          <WritingTypeBadge type={piece.type} size="sm" />
          <WritingStatusBadge status={piece.status} size="sm" />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-text-secondary w-20 justify-end">
          <FileText className="h-3 w-3 text-text-muted" />
          <span>{piece.word_count.toLocaleString()}</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-text-secondary w-28 justify-end">
          <Calendar className="h-3 w-3 text-text-muted" />
          <span>{formatDate(piece.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}
