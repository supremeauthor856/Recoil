import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { LayoutGrid, List, Clock, BookOpen, Search, Pin, Plus } from 'lucide-react'
import { useLoreEntries } from '../hooks/useLoreEntries'
import { LoreView, LoreCategory, LORE_CATEGORIES, LORE_CATEGORY_LABELS, TIMELINE_CATEGORIES, GLOSSARY_CATEGORIES } from '../types'
import { LoreCard } from './LoreCard'
import { LoreRow } from './LoreRow'
import { TimelineView } from './TimelineView'
import { GlossaryView } from './GlossaryView'
import { LoreCreateModal } from './LoreCreateModal'
import { getSubSeries } from '../../../services/verseService'
import { SubSeries } from '../../../shared/types/database'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { useUIStore } from '../../../store/uiStore'
import { loreService } from '../../../services/loreService'

export const LoreListPage: React.FC = () => {
  const { verseId } = useParams<{ verseId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const addToast = useUIStore((state) => state.addToast)

  // Manage view state
  const viewParam = searchParams.get('view') as LoreView | null
  const [activeView, setActiveView] = useState<LoreView>(viewParam || 'grid')

  // Set default category filter based on view (optional) or URL query parameter
  const catParam = searchParams.get('category') as LoreCategory | null
  const initialCategory = catParam || 'all'

  const {
    filteredEntries,
    loading,
    error,
    filters,
    setFilters,
    refetch,
    togglePin,
    deleteEntry,
  } = useLoreEntries(verseId || null, initialCategory)

  const [subSeriesList, setSubSeriesList] = useState<SubSeries[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Fetch subseries list
  useEffect(() => {
    if (verseId) {
      getSubSeries(verseId)
        .then(setSubSeriesList)
        .catch((err) => console.error('Failed to load sub-series list', err))
    }
  }, [verseId])

  // Sync URL view param
  useEffect(() => {
    if (viewParam && viewParam !== activeView) {
      setActiveView(viewParam)
    }
  }, [viewParam])

  const handleViewChange = (view: LoreView) => {
    setActiveView(view)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('view', view)

    // Adjust category filter automatically when switching views to fit specifications
    if (view === 'timeline') {
      // Timeline should only show event and history
      setFilters((f) => ({ ...f, category: 'all' }))
    } else if (view === 'glossary') {
      // Glossary should only show concept/world-rules/creature/item/tech
      setFilters((f) => ({ ...f, category: 'all' }))
    }

    setSearchParams(newParams)
  }

  // Filter entries to pass down to Timeline and Glossary views
  const timelineEntries = React.useMemo(() => {
    return filteredEntries.filter((e) => TIMELINE_CATEGORIES.includes(e.category))
  }, [filteredEntries])

  const glossaryEntries = React.useMemo(() => {
    return filteredEntries.filter((e) => GLOSSARY_CATEGORIES.includes(e.category))
  }, [filteredEntries])

  // Handle batch reorder on timeline drag drop
  const handleTimelineReorder = async (reordered: Array<{ id: string; sort_order: number }>) => {
    try {
      await loreService.reorderEntries(reordered)
      addToast({
        title: 'Timeline order updated',
        type: 'success',
      })
      refetch()
    } catch (err: any) {
      console.error(err)
      addToast({
        title: err.message || 'Failed to reorder timeline',
        type: 'error',
      })
    }
  }

  // Handle delete action
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lore entry? This cannot be undone.')) {
      try {
        const ok = await deleteEntry(id)
        if (ok) {
          addToast({
            title: 'Lore entry deleted',
            type: 'success',
          })
        }
      } catch (err: any) {
        addToast({
          title: err.message || 'Failed to delete lore entry',
          type: 'error',
        })
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 py-6 w-full select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] tracking-tight">
            Lore & Worldbuilding
          </h1>
          <p className="text-[12px] text-[var(--color-text-secondary)] mt-1 leading-normal">
            Document and organize your universe's rules, history, locations, groups, and concepts.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          className="h-9 gap-1.5 self-start md:self-auto text-[12px]"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </Button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2 gap-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 bg-[var(--color-bg-subtle)] p-1 rounded-lg">
          <button
            onClick={() => handleViewChange('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              activeView === 'grid'
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Grid
          </button>
          <button
            onClick={() => handleViewChange('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              activeView === 'list'
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
          <button
            onClick={() => handleViewChange('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              activeView === 'timeline'
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Timeline
          </button>
          <button
            onClick={() => handleViewChange('glossary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              activeView === 'glossary'
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Glossary
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--color-border-subtle)]/70 bg-[var(--color-bg-subtle)]/20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">
          {/* Search input */}
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search titles and summaries..."
              className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[12px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((f) => ({ ...f, category: e.target.value as LoreCategory | 'all' }))
              }
              className="w-full h-9 px-2 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {LORE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {LORE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Subseries Filter */}
          <div className="md:col-span-2">
            <select
              value={filters.subSeriesId}
              onChange={(e) =>
                setFilters((f) => ({ ...f, subSeriesId: e.target.value }))
              }
              className="w-full h-9 px-2 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] cursor-pointer"
            >
              <option value="all">All Sub-series</option>
              {subSeriesList.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Selector */}
          <div className="md:col-span-2">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  sortBy: e.target.value as 'updated' | 'alpha' | 'category' | 'sort-order',
                }))
              }
              className="w-full h-9 px-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-md text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] cursor-pointer"
            >
              <option value="sort-order">Sort by Order</option>
              <option value="updated">Sort by Updated</option>
              <option value="alpha">Sort by Alphabetical</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>

          {/* Pinned toggle button */}
          <div className="md:col-span-2">
            <button
              onClick={() => setFilters((f) => ({ ...f, pinned: !f.pinned }))}
              className={`w-full h-9 px-3 rounded-md border flex items-center justify-center gap-1.5 text-[11px] font-medium transition-all cursor-pointer ${
                filters.pinned
                  ? 'bg-[var(--color-accent-primary-dim)] border-[var(--color-accent-primary)] text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border-default)]'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${filters.pinned ? 'fill-[var(--color-accent-primary)]' : ''}`} />
              Pinned Only
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[300px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-elevated)]/20 z-10 backdrop-blur-[1px]">
            <div className="w-6 h-6 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4 border border-[var(--color-error)]/20 bg-[var(--color-error-dim)] text-[var(--color-error)] rounded-xl text-xs flex flex-col gap-1">
            <span className="font-semibold">Failed to load lore</span>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* 1. GRID VIEW */}
            {activeView === 'grid' && (
              filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-[12px] text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-bg-subtle)]/20">
                  No matching lore entries found. Create one to begin your worldbuilding journey!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEntries.map((entry) => (
                    <LoreCard
                      key={entry.id}
                      entry={entry}
                      onDelete={handleDelete}
                      onTogglePin={togglePin}
                    />
                  ))}
                </div>
              )
            )}

            {/* 2. LIST VIEW */}
            {activeView === 'list' && (
              filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-[12px] text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-bg-subtle)]/20">
                  No matching lore entries found.
                </div>
              ) : (
                <div className="border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-bg-elevated)] divide-y divide-[var(--color-border-subtle)] overflow-hidden">
                  {filteredEntries.map((entry) => (
                    <LoreRow
                      key={entry.id}
                      entry={entry}
                      onDelete={handleDelete}
                      onTogglePin={togglePin}
                    />
                  ))}
                </div>
              )
            )}

            {/* 3. TIMELINE VIEW */}
            {activeView === 'timeline' && (
              <TimelineView
                entries={timelineEntries}
                onReorder={handleTimelineReorder}
                onDelete={handleDelete}
                onTogglePin={togglePin}
              />
            )}

            {/* 4. GLOSSARY VIEW */}
            {activeView === 'glossary' && (
              <GlossaryView
                entries={glossaryEntries}
                onDelete={handleDelete}
                onTogglePin={togglePin}
              />
            )}
          </>
        )}
      </div>

      {/* Creation Modal */}
      {verseId && (
        <LoreCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          verseId={verseId}
          defaultCategory={filters.category !== 'all' ? filters.category : undefined}
        />
      )}
    </div>
  )
}
export default LoreListPage
