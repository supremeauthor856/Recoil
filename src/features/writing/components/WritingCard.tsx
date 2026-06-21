import React from 'react'
import { Pin, Calendar, FileText } from 'lucide-react'
import { WritingPiece } from '../types'
import { SubSeries } from '../../../shared/types/database'
import { WritingTypeBadge } from './WritingTypeBadge'
import { WritingStatusBadge } from './WritingStatusBadge'

interface WritingCardProps {
  piece: WritingPiece
  onClick: (id: string) => void
  subSeries: SubSeries[]
}

export const WritingCard: React.FC<WritingCardProps> = ({ piece, onClick, subSeries }) => {
  const parentSeries = subSeries.find((s) => s.id === piece.sub_series_id)

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Format word count with commas
  const formatWordCount = (count: number) => {
    return count.toLocaleString()
  }

  return (
    <div
      id={`writing-card-${piece.id}`}
      onClick={() => onClick(piece.id)}
      className="group relative flex flex-col justify-between h-52 rounded-xl border border-border-default bg-bg-elevated p-5 shadow-xs hover:border-border-strong hover:shadow-md cursor-pointer transition-all duration-200"
    >
      <div className="space-y-2">
        {/* Header Badges & Pin */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <WritingTypeBadge type={piece.type} size="sm" />
            <WritingStatusBadge status={piece.status} size="sm" />
          </div>
          {piece.is_pinned && (
            <span
              id={`pin-icon-${piece.id}`}
              className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-accent-highlight"
            >
              <Pin className="h-3 w-3 fill-accent-highlight" />
              Pinned
            </span>
          )}
        </div>

        {/* Title & Campaign */}
        <div className="space-y-0.5">
          <h3
            id={`writing-card-title-${piece.id}`}
            className="text-base font-semibold text-text-primary group-hover:text-accent-highlight transition-colors line-clamp-1"
          >
            {piece.title}
          </h3>
          {parentSeries && (
            <p
              id={`writing-card-parent-${piece.id}`}
              className="text-xs font-medium text-text-secondary line-clamp-1"
            >
              Campaign: {parentSeries.name}
            </p>
          )}
        </div>

        {/* Summary */}
        <p
          id={`writing-card-summary-${piece.id}`}
          className="text-xs text-text-secondary line-clamp-3 leading-relaxed"
        >
          {piece.summary || <span className="italic text-text-muted">No summary provided.</span>}
        </p>
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-[11px] font-mono text-text-secondary">
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-text-muted" />
          <span>{formatWordCount(piece.word_count)} w</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-text-muted" />
          <span>{formatDate(piece.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}
