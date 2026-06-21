import { useState, useEffect } from 'react'
import { Plus, Compass } from 'lucide-react'
import { useVerses } from '../hooks/useVerses'
import { VerseCard } from './VerseCard'
import { VerseCreateModal } from './VerseCreateModal'
import { VerseStats } from '../types'
import { Button } from '../../../shared/components/ui/Button'
import * as verseService from '../../../services/verseService'

export function DashboardPage() {
  const { verses, loading, refetch } = useVerses()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [statsMap, setStatsMap] = useState<Record<string, VerseStats>>({})

  // Fetch stats for all verses once verses successfully load
  useEffect(() => {
    if (verses.length === 0) return

    const fetchAllStats = async () => {
      try {
        const statsPromises = verses.map((verse) =>
          verseService
            .getVerseStats(verse.id)
            .then((stats) => ({ id: verse.id, stats }))
            .catch(() => ({
              id: verse.id,
              stats: {
                characterCount: 0,
                loreCount: 0,
                writingCount: 0,
                subSeriesCount: 0,
                conversationCount: 0,
                totalWordCount: 0,
              },
            }))
        )

        const results = await Promise.all(statsPromises)
        const updatedStatsMap: Record<string, VerseStats> = {}
        for (const res of results) {
          updatedStatsMap[res.id] = res.stats
        }
        setStatsMap(updatedStatsMap)
      } catch (err) {
        console.error('Failed to pre-fetch verse card stats:', err)
      }
    }

    fetchAllStats()
  }, [verses])

  const SkeletonCard = () => (
    <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-5 min-h-[160px] animate-pulse flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-border-subtle)]" />
          <div className="h-4 bg-[var(--color-border-subtle)] rounded w-1/2" />
        </div>
        <div className="h-3 bg-[var(--color-border-subtle)] rounded w-full mt-4" />
        <div className="h-3 bg-[var(--color-border-subtle)] rounded w-3/4 mt-2" />
      </div>
      <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)]/70 pt-3 mt-4">
        <div className="h-2 bg-[var(--color-border-subtle)] rounded w-1/4" />
        <div className="flex gap-2">
          <div className="w-8 h-4 rounded bg-[var(--color-border-subtle)]" />
          <div className="w-8 h-4 rounded bg-[var(--color-border-subtle)]" />
        </div>
      </div>
    </div>
  )

  if (loading && verses.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 bg-[var(--color-border-subtle)] rounded w-32 animate-pulse" />
          <div className="h-8 bg-[var(--color-border-subtle)] rounded w-28 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 md:p-8">
      {verses.length === 0 ? (
        /* Empty State with Large Wordmark */
        <div className="flex flex-col items-center justify-center pt-24 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)] rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Compass size={32} />
          </div>
          <h1 className="text-[32px] font-semibold text-[var(--color-text-primary)] tracking-tight">
            Recoil
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2 text-base leading-relaxed">
            Your verse. Your characters. Your story.
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 px-4 leading-normal">
            A private creative writing space for building original character settings and outlining fictional universes.
          </p>

          <Button
            variant="primary"
            size="lg"
            className="mt-8 font-medium shadow-md gap-2 h-10 px-6"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus size={18} />}
          >
            Create Your First Verse
          </Button>
        </div>
      ) : (
        /* Has Verses State */
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-text-primary)]">
                Your Verses
              </h2>
              <span className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] py-0.5 px-2 rounded-full font-mono text-xs">
                {verses.length}
              </span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus size={16} />}
              className="font-medium"
            >
              New Verse
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {verses.map((verse) => (
              <VerseCard
                key={verse.id}
                verse={verse}
                stats={statsMap[verse.id]}
                onVerseChanged={refetch}
              />
            ))}
          </div>
        </>
      )}

      {/* Control Create Modals Locally */}
      <VerseCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refetch}
      />
    </div>
  )
}
