import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Edit, Users, ChevronRight, ArrowLeft } from 'lucide-react'
import { useNavigationStore } from '../../../store/navigationStore'
import { SubSeriesEditModal } from './SubSeriesEditModal'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { Button } from '../../../shared/components/ui/Button'
import * as verseService from '../../../services/verseService'
import * as characterService from '../../../services/characterService'
import { Verse, SubSeries } from '../types'
import { Character } from '../../../shared/types/database'

export function SubSeriesOverviewPage() {
  const { verseId, subSeriesId } = useParams<{ verseId: string; subSeriesId: string }>()
  const { setActiveVerse, setActiveSubSeries } = useNavigationStore()

  const [loading, setLoading] = useState(true)
  const [verse, setVerse] = useState<Verse | null>(null)
  const [subSeries, setSubSeries] = useState<SubSeries | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [error, setError] = useState<string | null>(null)

  // Modal Open State
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Synchronization with navigation store
  useEffect(() => {
    setActiveVerse(verseId || null)
    setActiveSubSeries(subSeriesId || null)
    return () => {
      setActiveSubSeries(null)
    }
  }, [verseId, subSeriesId, setActiveVerse, setActiveSubSeries])

  // Fetch all dependencies
  const fetchData = async () => {
    if (!verseId || !subSeriesId) return
    setLoading(true)
    setError(null)
    try {
      const [vData, ssData, cData] = await Promise.all([
        verseService.getVerse(verseId),
        verseService.getSubSeriesById(subSeriesId),
        characterService.getCharacters({ subSeriesId }).catch(() => [] as Character[]),
      ])

      setVerse(vData)
      setSubSeries(ssData)
      setCharacters(cData || [])
    } catch (err) {
      console.error('Error loading sub-series overview details:', err)
      setError(err instanceof Error ? err.message : 'Failed to retrieve sub-series details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [verseId, subSeriesId])

  const handleEditSuccess = () => {
    fetchData()
  }

  const SkeletonHeader = () => (
    <div className="flex flex-col gap-4 animate-pulse w-full">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 bg-[var(--color-border-subtle)] rounded w-1/3" />
      <div className="flex items-start justify-between gap-5 mt-4">
        <div className="flex items-center gap-3-1/2 flex-grow">
          <div className="w-[16px] h-[16px] bg-[var(--color-border-subtle)] rounded-full flex-shrink-0" />
          <div className="flex flex-col gap-2 mt-1 flex-grow">
            <div className="h-6 bg-[var(--color-border-subtle)] rounded w-1/4 animate-pulse" />
            <div className="h-4 bg-[var(--color-border-subtle)] rounded w-2/3 animate-pulse" />
          </div>
        </div>
        <div className="w-24 h-8 bg-[var(--color-border-subtle)] rounded animate-pulse" />
      </div>
    </div>
  )

  if (loading && !subSeries) {
    return (
      <div className="w-full max-w-[1000px] mx-auto p-6 md:p-8 flex flex-col gap-8">
        <SkeletonHeader />
        <div className="h-64 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error || !subSeries || !verse) {
    return (
      <div className="p-8 pb-32 max-w-lg mx-auto flex items-center justify-center h-full min-h-[400px]">
        <EmptyState
          icon={<Users size={48} />}
          title="Sub-series not found"
          description="The sub-series you are trying to view does not exist or belongs to another verse."
          action={{
            label: 'Back to Verse',
            onClick: () => (window.location.href = verseId ? `/verse/${verseId}` : '/'),
          }}
        />
      </div>
    )
  }

  const tagColor = subSeries.icon_color || 'var(--color-accent-primary)'

  return (
    <div className="w-full max-w-[1000px] mx-auto p-6 md:p-8 flex flex-col gap-8 animate-fade-in pb-24">
      {/* Breadcrumbs */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
          <Link to="/" className="hover:text-[var(--color-text-primary)] transition-colors">
            Verses
          </Link>
          <ChevronRight size={10} />
          <Link
            to={`/verse/${verseId}`}
            className="hover:text-[var(--color-text-primary)] transition-colors"
          >
            {verse.name}
          </Link>
          <ChevronRight size={10} />
          <span className="text-[var(--color-text-secondary)]">{subSeries.name}</span>
        </div>

        {/* Back navigation */}
        <div>
          <Link
            to={`/verse/${verseId}`}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <ArrowLeft size={12} /> Back to {verse.name}
          </Link>
        </div>
      </div>

      {/* SUB-SERIES HEADER section */}
      <div className="flex items-start justify-between gap-5 border-b border-[var(--color-border-subtle)]/70 pb-6">
        <div className="flex items-start gap-3.5 min-w-0">
          {/* Tag Circle */}
          <div
            className="w-4 h-4 rounded-full border border-[var(--color-border-subtle)] flex-shrink-0 mt-2"
            style={{ backgroundColor: tagColor }}
          />

          <div className="flex flex-col min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] leading-tight tracking-tight truncate">
              {subSeries.name}
            </h1>
            <p className="text-[15px] text-[var(--color-text-secondary)] mt-2 leading-relaxed break-words max-w-2xl">
              {subSeries.description || (
                <span className="text-[var(--color-text-muted)] italic">No description provided</span>
              )}
            </p>
          </div>
        </div>

        {/* Edit Sub-series Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsEditOpen(true)}
          leftIcon={<Edit size={14} />}
          className="text-xs h-[28px] px-3 whitespace-nowrap"
        >
          Edit Sub-series
        </Button>
      </div>

      {/* CHARACTERS IN SUB-SERIES section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm md:text-md font-semibold text-[var(--color-text-primary)]">
          Characters in this Sub-series
        </h3>

        {characters.length === 0 ? (
          <div className="p-12 border border-dashed border-[var(--color-border-subtle)] rounded-xl text-center bg-[var(--color-bg-base)]">
            <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
              <Users size={32} className="text-[var(--color-text-muted)]" />
              <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                No characters in this sub-series yet
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Assign characters to this sub-series from their profiles, or create characters inside this verse setting.
              </p>
            </div>
          </div>
        ) : (
          /* List of characters present */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((char) => (
              <Link
                key={char.id}
                to={`/verse/${verseId}/characters/${char.id}`}
                className="group p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] rounded-xl flex items-center gap-3 transition-all duration-150 shadow-sm"
              >
                {char.reference_image_url ? (
                  <img
                    src={char.reference_image_url}
                    alt={char.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)] flex items-center justify-center font-bold text-sm uppercase">
                    {char.name.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent-primary)] transition-colors">
                    {char.name}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)] truncate">
                    {char.species || 'Unknown Species'} • {char.age || 'Unknown Age'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Component Modal */}
      <SubSeriesEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        subSeries={subSeries}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
