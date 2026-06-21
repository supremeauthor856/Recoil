import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Settings, Plus, Layers, Globe, ArrowLeft } from 'lucide-react'
import { useVerse } from '../hooks/useVerse'
import { useNavigationStore } from '../../../store/navigationStore'
import { VerseQuickStats } from './VerseQuickStats'
import { RecentActivity } from './RecentActivity'
import { SubSeriesCard } from './SubSeriesCard'
import { SubSeriesCreateModal } from './SubSeriesCreateModal'
import { SubSeriesEditModal } from './SubSeriesEditModal'
import { VerseSettingsModal } from './VerseSettingsModal'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { Badge } from '../../../shared/components/ui/Badge'
import { Button } from '../../../shared/components/ui/Button'
import { SubSeries } from '../types'
import { formatDate } from '../../../shared/utils/format'
import { ExportButton } from '../../export/components/ExportButton'
import { getCharacters } from '../../../services/characterService'
import { getWritingPieces } from '../../../services/writingService'
import { Character } from '../../../shared/types/database'
import { WritingPiece } from '../../writing/types'

export function VerseOverviewPage() {
  const { verseId } = useParams<{ verseId: string }>()
  const { setActiveVerse, setActiveSubSeries } = useNavigationStore()

  const [allCharacters, setAllCharacters] = useState<Character[]>([])
  const [allWriting, setAllWriting] = useState<WritingPiece[]>([])

  // Set active verse in store
  useEffect(() => {
    if (verseId) {
      setActiveVerse(verseId)
      setActiveSubSeries(null)
      
      // Prefetch data for export
      Promise.all([
        getCharacters({ verseId }),
        getWritingPieces(verseId)
      ]).then(([chars, writing]) => {
        setAllCharacters(chars)
        setAllWriting(writing)
      }).catch(err => console.error(err))
    }
  }, [verseId, setActiveVerse, setActiveSubSeries])

  // Fetch full verse details using useVerse
  const {
    verse,
    stats,
    recentActivity,
    subSeries,
    loading,
    error,
    refetch,
    refetchSubSeries,
  } = useVerse(verseId || null)

  // Local Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSubCreateOpen, setIsSubCreateOpen] = useState(false)
  const [selectedSubSeries, setSelectedSubSeries] = useState<SubSeries | null>(null)
  const [isSubEditOpen, setIsSubEditOpen] = useState(false)

  const handleEditSubSeries = (sub: SubSeries) => {
    setSelectedSubSeries(sub)
    setIsSubEditOpen(true)
  }

  const handleDeleteSubSeries = (sub: SubSeries) => {
    setSelectedSubSeries(sub)
    setIsSubEditOpen(true) // Opening edit modal leads to delete option
  }

  const handleCreateSubSuccess = () => {
    refetchSubSeries()
    // Also refetch stats since sub-series count changed
    refetch()
  }

  const handleEditSubSuccess = () => {
    refetchSubSeries()
    refetch()
  }

  const SkeletonHeader = () => (
    <div className="flex items-start gap-5 mb-8 animate-pulse">
      <div className="w-[56px] h-[56px] bg-[var(--color-border-subtle)] rounded-xl flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2 mt-1">
        <div className="h-6 bg-[var(--color-border-subtle)] rounded w-1/4" />
        <div className="h-4 bg-[var(--color-border-subtle)] rounded w-3/4" />
        <div className="h-3 bg-[var(--color-border-subtle)] rounded w-1/5 mt-1" />
      </div>
      <div className="w-24 h-8 bg-[var(--color-border-subtle)] rounded-md" />
    </div>
  )

  if (loading && !verse) {
    return (
      <div className="w-full max-w-[1000px] mx-auto p-6 md:p-8 animate-fade-in">
        <SkeletonHeader />
        <VerseQuickStats stats={null} loading={true} />
        <div className="h-52 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl mb-8 animate-pulse" />
        <div className="h-52 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error || !verse) {
    return (
      <div className="p-8 pb-32 max-w-lg mx-auto flex items-center justify-center h-full min-h-[400px]">
        <EmptyState
          icon={<Globe size={48} />}
          title="Verse not found"
          description="The verse you are trying to access does not exist or has been deleted."
          action={{
            label: 'Back to Dashboard',
            onClick: () => (window.location.href = '/'),
          }}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1000px] mx-auto p-6 md:p-8 animate-fade-in flex flex-col gap-8 pb-24">
      {/* Return button for mobile */}
      <div className="md:hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={12} /> Back to dashboard
        </Link>
      </div>

      {/* VERSE HEADER section */}
      <div className="flex items-start justify-between gap-5 border-b border-[var(--color-border-subtle)]/70 pb-6">
        <div className="flex items-start gap-5 min-w-0">
          {/* Verse Icon */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold uppercase transition-all duration-300 flex-shrink-0 shadow-sm border border-[var(--color-border-subtle)]"
            style={{ backgroundColor: verse.icon_color }}
          >
            {verse.icon_letter || verse.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col min-w-0 mt-0.5">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] leading-tight tracking-tight truncate">
              {verse.name}
            </h1>
            <p className="text-[15px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed break-words">
              {verse.description || (
                <span className="text-[var(--color-text-muted)] italic">No description provided</span>
              )}
            </p>
            <span className="text-[11px] text-[var(--color-text-muted)] mt-2 font-medium">
              Created {formatDate(verse.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton 
            scope={{ type: 'verse', verse, characters: allCharacters, writing: allWriting, subSeries }}
            title={`Export ${verse.name}`}
            allowedFormats={['json', 'zip', 'csv', 'tsv', 'yaml', 'txt']} 
            className="h-[28px] px-3 font-medium whitespace-nowrap text-xs border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] rounded-md bg-transparent"
          />
          {/* Verse Settings Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            leftIcon={<Settings size={14} />}
            className="font-medium whitespace-nowrap h-[28px] px-3 border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] text-xs rounded-md"
          >
            Verse Settings
          </Button>
        </div>
      </div>

      {/* QUICK STATS section */}
      <div>
        <VerseQuickStats stats={stats} loading={loading} verseId={verseId} />
      </div>

      {/* SUB-SERIES section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <h3 className="text-sm md:text-md font-semibold text-[var(--color-text-primary)]">
              Sub-series
            </h3>
            <Badge variant="default" size="sm">
              {subSeries.length}
            </Badge>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSubCreateOpen(true)}
            leftIcon={<Plus size={14} />}
            className="text-xs h-[28px] px-2"
          >
            Add Sub-series
          </Button>
        </div>

        {subSeries.length === 0 ? (
          <div className="p-8 border border-dashed border-[var(--color-border-subtle)] rounded-xl text-center bg-[var(--color-bg-elevated)]/30">
            <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
              <Layers size={24} className="text-[var(--color-text-muted)]" />
              <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                No sub-series yet
              </h4>
              <p className="text-xs text-[var(--color-text-muted)]">
                Organize your verse into sub-series, spinoffs, seasons, or separate book outlines.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSubCreateOpen(true)}
                className="text-xs text-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary-hover)] p-0 h-auto font-semibold mt-1"
              >
                Add Sub-series
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subSeries.map((sub) => (
              <SubSeriesCard
                key={sub.id}
                subSeries={sub}
                verseId={verse.id}
                onEdit={() => handleEditSubSeries(sub)}
                onDelete={() => handleDeleteSubSeries(sub)}
              />
            ))}
          </div>
        )}
      </div>

      {/* RECENT ACTIVITY section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm md:text-md font-semibold text-[var(--color-text-primary)]">
          Recent Activity
        </h3>
        <RecentActivity verseId={verse.id} items={recentActivity} loading={loading} />
      </div>

      {/* MODALS controlled locally */}
      <SubSeriesCreateModal
        isOpen={isSubCreateOpen}
        onClose={() => setIsSubCreateOpen(false)}
        verseId={verse.id}
        onSuccess={handleCreateSubSuccess}
      />

      {selectedSubSeries && (
        <SubSeriesEditModal
          isOpen={isSubEditOpen}
          onClose={() => setIsSubEditOpen(null)}
          subSeries={selectedSubSeries}
          onSuccess={handleEditSubSuccess}
        />
      )}

      <VerseSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        verse={verse}
        onSuccess={refetch}
      />
    </div>
  )
}
