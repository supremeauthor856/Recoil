import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  RefreshCw,
  LayoutDashboard,
  Users,
  PenTool,
  Network,
  Bot,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { useVerseStatistics } from '../hooks/useVerseStatistics'
import { OverviewGrid } from './OverviewGrid'
import { ActivityHeatmap } from './ActivityHeatmap'
import { CharacterBreakdownSection } from './CharacterBreakdownSection'
import { WritingStatsSection } from './WritingStatsSection'
import { RelationshipStatsSection } from './RelationshipStatsSection'
import { AIUsageSection } from './AIUsageSection'
import { TagCloudDisplay } from './TagCloudDisplay'
import { ForeshadowingStatusSection } from './ForeshadowingStatusSection'

type TabID = 'overview' | 'characters' | 'writing' | 'relationships' | 'ai'

export const StatsDashboardPage = () => {
  const { verseId } = useParams<{ verseId: string }>()
  const { stats, loading, error, lastRefreshed, refetch } = useVerseStatistics(verseId)
  const [activeTab, setActiveTab] = useState<TabID>('overview')

  const formatLastRefreshed = (): string => {
    if (!lastRefreshed) return ''
    const secondsAgo = Math.floor((Date.now() - lastRefreshed) / 1000)
    if (secondsAgo < 5) return 'Just now'
    if (secondsAgo < 60) return `${secondsAgo}s ago`
    const minutesAgo = Math.floor(secondsAgo / 60)
    return `${minutesAgo}m ago`
  }

  // Loading shimmer state
  if (loading && !stats) {
    return (
      <div className="flex-1 flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-pulse select-none">
        <div className="h-10 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-xl" />
          <div className="h-28 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-xl" />
          <div className="h-28 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-xl" />
        </div>
        <div className="h-[250px] bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-xl" />
      </div>
    )
  }

  // Error boundary card state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[var(--color-bg-elevated)] border border-rose-500/20 rounded-xl p-6 flex flex-col items-center gap-4 text-center shadow-lg">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full">
            <AlertTriangle size={28} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Failed to load verse statistics
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              {error}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-sm font-semibold text-white cursor-pointer rounded-lg shadow-sm transition-all duration-100"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const tabs: { id: TabID; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={14} /> },
    { id: 'characters', label: 'Characters', icon: <Users size={14} /> },
    { id: 'writing', label: 'Writing', icon: <PenTool size={14} /> },
    { id: 'relationships', label: 'Relationships', icon: <Network size={14} /> },
    { id: 'ai', label: 'AI Workspace', icon: <Bot size={14} /> },
  ]

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full min-h-0">
      {/* Breadcrumbs & Title header structure */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
            <Link to="/" className="hover:text-[var(--color-text-primary)] transition-colors">
              Home
            </Link>
            <ChevronRight size={10} />
            <span>Verse</span>
            <ChevronRight size={10} />
            <span className="text-[var(--color-text-secondary)]">Statistics</span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] mt-1">
            Verse Statistics Dashboard
          </h1>
        </div>

        {/* Action Header triggers on the right */}
        <div className="flex items-center gap-3.5 flex-shrink-0">
          {lastRefreshed && (
            <span className="text-xs text-[var(--color-text-muted)] font-medium select-none">
              Last parsed: <strong className="text-[var(--color-text-secondary)] font-semibold">{formatLastRefreshed()}</strong>
            </span>
          )}
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-sm hover:shadow transition-all duration-100"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            <span>Flush Statistics</span>
          </button>
        </div>
      </div>

      {/* Responsive Tab Bar toggler */}
      <div className="border-b border-[var(--color-border-subtle)]/40 w-full flex overflow-x-auto scrollbar-custom select-none gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 px-3 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer border-b-2 transition-all duration-150 whitespace-nowrap ${
                isActive
                  ? 'text-[var(--color-accent-primary)] border-[var(--color-accent-primary)]'
                  : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-secondary)] hover:border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panel Viewport container */}
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
            className="w-full flex flex-col gap-6"
          >
            {activeTab === 'overview' && (
              <>
                <OverviewGrid overview={stats.overview} computed={stats.computed} />
                <ActivityHeatmap activityDays={stats.activity} />
                <ForeshadowingStatusSection foreshadowing={stats.foreshadowing} />
              </>
            )}

            {activeTab === 'characters' && (
              <>
                <CharacterBreakdownSection characters={stats.characters} />
                <TagCloudDisplay tags={stats.tags} />
              </>
            )}

            {activeTab === 'writing' && (
              <WritingStatsSection writing={stats.writing} />
            )}

            {activeTab === 'relationships' && (
              <RelationshipStatsSection relationships={stats.relationships} />
            )}

            {activeTab === 'ai' && (
              <AIUsageSection aiUsage={stats.aiUsage} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
export default StatsDashboardPage
