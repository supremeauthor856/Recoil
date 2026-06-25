import React from 'react'
import { Users, BookOpen, FileText, Type, Network, Flame, Calendar, MessageSquare } from 'lucide-react'
import { StatCard } from './StatCard'
import { VerseFullStats } from '../types'
import { statisticsService } from '../../../services/statisticsService'

interface OverviewGridProps {
  overview: VerseFullStats['overview']
  computed: VerseFullStats['computed']
}

// Inline Circular Progress drawing for average profile completion
const ProfileCompletionRing = ({ completion, size = 32 }: { completion: number; size?: number }) => {
  const radius = (size - 4) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, completion)) / 100) * circumference

  return (
    <svg width={size} height={size} className="rotate-[-90deg] flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        className="stroke-zinc-700/30 dark:stroke-zinc-600/30 fill-transparent"
        strokeWidth="3.5"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        className="stroke-[var(--color-accent-primary)] fill-transparent"
        strokeWidth="3.5"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </svg>
  )
}

export const OverviewGrid = ({ overview, computed }: OverviewGridProps) => {
  const formatDate = (timestamp: number | undefined | null): string => {
    if (!timestamp) return 'Unknown'
    const d = new Date(timestamp)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
      {/* Row 1 — Core Counts */}
      <StatCard
        label="Characters"
        value={overview.characterCount}
        subtext={`${overview.ocCount} OC · ${overview.canonCount} Canon · ${overview.auCount} AU`}
        icon={<Users size={18} />}
      />

      <StatCard
        label="Lore Entries"
        value={overview.loreCount}
        subtext="Encyclopedia articles"
        icon={<BookOpen size={18} />}
      />

      <StatCard
        label="Writing Pieces"
        value={overview.writingCount}
        subtext={`${overview.subSeriesCount} active sub-series`}
        icon={<FileText size={18} />}
      />

      {/* Row 2 — Content Depth */}
      <StatCard
        label="Total Words Written"
        value={statisticsService.formatWordCount(overview.totalWordCount)}
        subtext={`Across chapters and snippets`}
        icon={<Type size={18} />}
        accentColor="var(--color-accent-primary)"
      />

      {/* Custom stat card for Avg Profile Completion to integrate the completion ring */}
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl px-5 py-4 flex flex-col gap-1.5 transition-all duration-150 hover:border-[var(--color-border-default)] shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 text-[var(--color-text-muted)]">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Avg Profile Completion
            </span>
          </div>
          <ProfileCompletionRing completion={overview.averageProfileCompletion} size={28} />
        </div>
        <div className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          {overview.averageProfileCompletion}%
        </div>
        <span className="text-xs text-[var(--color-text-muted)] min-h-[16px] leading-relaxed">
          Standard bio checklist completeness
        </span>
      </div>

      <StatCard
        label="Relationships"
        value={overview.relationshipCount}
        subtext="Mapped connections in web"
        icon={<Network size={18} />}
      />

      {/* Row 3 — Activity & AI */}
      <StatCard
        label="Writing Streak"
        value={`${computed.writingStreak} ${computed.writingStreak === 1 ? 'day' : 'days'}`}
        subtext={`Longest: ${computed.longestStreak} days`}
        icon={<Flame size={18} />}
        accentColor={computed.writingStreak > 0 ? '#10B981' : undefined} // success color if active
      />

      <StatCard
        label="Verse Age"
        value={`${computed.daysSinceCreation} ${computed.daysSinceCreation === 1 ? 'day' : 'days'}`}
        subtext={`Created ${formatDate(computed.verseCreatedAt)}`}
        icon={<Calendar size={18} />}
      />

      <StatCard
        label="AI Conversations"
        value={overview.conversationCount}
        subtext={`${overview.totalMessages.toLocaleString()} messages exchanged`}
        icon={<MessageSquare size={18} />}
      />
    </div>
  )
}
