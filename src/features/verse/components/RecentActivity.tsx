import { useNavigate } from 'react-router-dom'
import { User, BookOpen, FileText, ChevronRight } from 'lucide-react'
import { RecentActivityItem } from '../types'
import { formatRelativeTime } from '../../../shared/utils/format'

interface RecentActivityProps {
  verseId: string
  items: RecentActivityItem[]
  loading: boolean
}

export function RecentActivity({ verseId, items, loading }: RecentActivityProps) {
  const navigate = useNavigate()

  const getIcon = (type: RecentActivityItem['type']) => {
    switch (type) {
      case 'character':
        return <User size={14} className="text-[var(--color-text-secondary)]" />
      case 'lore':
        return <BookOpen size={14} className="text-[var(--color-text-secondary)]" />
      case 'writing':
        return <FileText size={14} className="text-[var(--color-text-secondary)]" />
    }
  }

  const getTypeLabel = (type: RecentActivityItem['type']) => {
    switch (type) {
      case 'character':
        return 'Character updated'
      case 'lore':
        return 'Lore entry updated'
      case 'writing':
        return 'Writing piece updated'
    }
  }

  const handleItemClick = (item: RecentActivityItem) => {
    switch (item.type) {
      case 'character':
        navigate(`/verse/${verseId}/characters/${item.id}`)
        break
      case 'lore':
        navigate(`/verse/${verseId}/lore/${item.id}`)
        break
      case 'writing':
        navigate(`/verse/${verseId}/writing/${item.id}`)
        break
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 py-3 border-b border-[var(--color-border-subtle)]/60 animate-pulse"
          >
            <div className="w-5 h-5 bg-[var(--color-border-subtle)] rounded-full" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-4 bg-[var(--color-border-subtle)] rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-[var(--color-border-subtle)] rounded w-1/4 animate-pulse" />
            </div>
            <div className="w-4 h-4 bg-[var(--color-border-subtle)] rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-6 text-center border border-dashed border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-bg-base)]">
        <span className="text-sm text-[var(--color-text-muted)] italic">No activity yet</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl px-5 py-2 shadow-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`flex items-center justify-between gap-4 py-3 cursor-pointer group transition-all duration-150 ${
              !isLast ? 'border-b border-[var(--color-border-subtle)]/70' : ''
            }`}
          >
            <div className="flex gap-3 min-w-0 items-start">
              {/* Type Icon */}
              <div className="w-6 h-6 rounded-md bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] flex items-center justify-center mt-0.5 flex-shrink-0">
                {getIcon(item.type)}
              </div>

              {/* Item Details */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent-primary)] transition-colors">
                    {item.name}
                  </span>
                  {item.sub_series_name && (
                    <span className="px-1.5 py-0.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-secondary)] font-medium rounded">
                      {item.sub_series_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mt-0.5">
                  <span>{getTypeLabel(item.type)}</span>
                  <span>—</span>
                  <span>{formatRelativeTime(item.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Chevron Right */}
            <ChevronRight
              size={14}
              className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] group-hover:translate-x-0.5 transition-all duration-150 flex-shrink-0"
            />
          </div>
        )
      })}
    </div>
  )
}
