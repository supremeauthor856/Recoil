import { Link } from 'react-router-dom'
import { Users, BookOpen, FileText, Layers, MessageSquare, Type } from 'lucide-react'
import { VerseStats } from '../types'
import { formatWordCount } from '../../../shared/utils/format'

interface VerseQuickStatsProps {
  stats: VerseStats | null
  loading: boolean
  verseId?: string
}

export function VerseQuickStats({ stats, loading, verseId }: VerseQuickStatsProps) {
  const statItems = [
    {
      label: 'Characters',
      value: stats?.characterCount ?? 0,
      icon: <Users size={18} className="text-[var(--color-accent-primary)]" />,
      to: verseId ? `/verse/${verseId}/characters` : undefined,
    },
    {
      label: 'Lore Entries',
      value: stats?.loreCount ?? 0,
      icon: <BookOpen size={18} className="text-[var(--color-accent-primary)]" />,
      to: verseId ? `/verse/${verseId}/lore` : undefined,
    },
    {
      label: 'Writing Pieces',
      value: stats?.writingCount ?? 0,
      icon: <FileText size={18} className="text-[var(--color-accent-primary)]" />,
      to: verseId ? `/verse/${verseId}/writing` : undefined,
    },
    {
      label: 'Sub-series',
      value: stats?.subSeriesCount ?? 0,
      icon: <Layers size={18} className="text-[var(--color-accent-primary)]" />,
      to: undefined, // remains static on the overview
    },
    {
      label: 'Conversations',
      value: stats?.conversationCount ?? 0,
      icon: <MessageSquare size={18} className="text-[var(--color-accent-primary)]" />,
      to: verseId ? `/verse/${verseId}/ai` : undefined,
    },
    {
      label: 'Total Words',
      value: formatWordCount(stats?.totalWordCount ?? 0).split(' ')[0],
      fullFormatted: formatWordCount(stats?.totalWordCount ?? 0),
      isWords: true,
      icon: <Type size={18} className="text-[var(--color-accent-primary)]" />,
      to: verseId ? `/verse/${verseId}/writing` : undefined,
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8 w-full">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-4 md:p-5 flex flex-col justify-between h-[96px] animate-pulse"
          >
            <div className="w-5 h-5 bg-[var(--color-border-subtle)] rounded" />
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="h-6 bg-[var(--color-border-subtle)] rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-[var(--color-border-subtle)] rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8 w-full">
      {statItems.map((item, i) => {
        const content = (
          <>
            <div className="flex items-center justify-between w-full">
              {item.icon}
            </div>
            <div className="flex flex-col gap-0.5 mt-2">
              <span
                className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-primary)] transition-colors leading-none truncate"
                title={item.isWords ? item.fullFormatted : undefined}
              >
                {item.isWords ? item.value : item.value.toLocaleString()}
              </span>
              <span className="text-[10px] md:text-xs text-[var(--color-text-muted)] font-semibold uppercase tracking-wider truncate">
                {item.label}
              </span>
            </div>
          </>
        )

        if (item.to) {
          return (
            <Link
              key={i}
              to={item.to}
              className="group bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] rounded-xl p-4 md:p-5 flex flex-col justify-between h-[96px] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              {content}
            </Link>
          )
        }

        return (
          <div
            key={i}
            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-4 md:p-5 flex flex-col justify-between h-[96px] shadow-sm select-none"
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}
