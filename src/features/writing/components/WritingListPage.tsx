import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Grid, List, Search, PlusCircle, Filter, FileText, Sparkles } from 'lucide-react'
import { useWritingPieces } from '../hooks/useWritingPieces'
import { WritingCard } from './WritingCard'
import { WritingRow } from './WritingRow'
import { WritingCreateModal } from './WritingCreateModal'
import { WRITING_TYPES, WRITING_TYPE_LABELS, WRITING_STATUSES, WRITING_STATUS_LABELS } from '../types'
import { SubSeries } from '../../../shared/types/database'
import * as verseService from '../../../services/verseService'
import * as writingService from '../../../services/writingService'

export const WritingListPage: React.FC = () => {
  const { verseId } = useParams<{ verseId: string }>()
  const navigate = useNavigate()

  const [subSeries, setSubSeries] = useState<SubSeries[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [layout, setLayout] = useState<'grid' | 'row'>(() => {
    return (localStorage.getItem('writing-layout-preference') as 'grid' | 'row') || 'grid'
  })

  const {
    pieces,
    filteredPieces,
    loading,
    error,
    filters,
    setFilters,
    refetch,
  } = useWritingPieces(verseId || '')

  useEffect(() => {
    if (!verseId) return
    // Fetch associated sub-series (campaigns)
    verseService.getSubSeries(verseId)
      .then(setSubSeries)
      .catch((err) => console.error('Failed to load campaigns:', err))
  }, [verseId])

  const handleLayoutChange = (newLayout: 'grid' | 'row') => {
    setLayout(newLayout)
    localStorage.setItem('writing-layout-preference', newLayout)
  }

  const handleCreateSubmit = async (data: any) => {
    try {
      const newPiece = await writingService.createWritingPiece(data)
      refetch()
      navigate(`/verse/${verseId}/writing/${newPiece.id}`)
    } catch (err) {
      console.error('Failed to create writing piece:', err)
      throw err
    }
  }

  const handlePieceClick = (id: string) => {
    navigate(`/verse/${verseId}/writing/${id}`)
  }

  if (loading && pieces.length === 0) {
    return (
      <div id="writing-list-loading" className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div id="writing-list-page" className="p-6 pb-24 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-highlight" />
            Writing Studio
          </h1>
          <p className="text-xs text-text-secondary">
            Manage your novels, short stories, worldbuilding essays, outlines, and character logs.
          </p>
        </div>
        <button
          id="open-create-modal-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-text-primary px-4 py-2 text-sm font-medium shadow-sm transition-colors cursor-pointer self-start sm:self-center"
        >
          <PlusCircle className="h-4 w-4" />
          New Writing Piece
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-bg-elevated/40 border border-border-default rounded-xl p-4 gap-4 flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input
              id="search-input"
              type="text"
              placeholder="Search writing, tags..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full rounded-lg border border-border-default bg-bg-base/60 pl-9 pr-3 py-2 text-xs text-text-primary outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            id="filter-type-select"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
            className="rounded-lg border border-border-default bg-bg-base/60 px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-primary transition-colors"
          >
            <option value="all">All Types</option>
            {WRITING_TYPES.map((t) => (
              <option key={t} value={t}>
                {WRITING_TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="filter-status-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className="rounded-lg border border-border-default bg-bg-base/60 px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-primary transition-colors"
          >
            <option value="all">All Statuses</option>
            {WRITING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {WRITING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          {/* Campaign Filter */}
          <select
            id="filter-campaign-select"
            value={filters.subSeriesId}
            onChange={(e) => setFilters({ ...filters, subSeriesId: e.target.value })}
            className="rounded-lg border border-border-default bg-bg-base/60 px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-primary transition-colors"
          >
            <option value="all">All Campaigns</option>
            {subSeries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            id="filter-sort-select"
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
            className="rounded-lg border border-border-default bg-bg-base/60 px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-primary transition-colors"
          >
            <option value="updated">Recently Updated</option>
            <option value="title">Alphabetical (A-Z)</option>
            <option value="word-count">Longest First</option>
            <option value="status">Status Grouping</option>
            <option value="reading-order">Reading Order</option>
          </select>
        </div>

        {/* Layout Preferences toggle */}
        <div className="flex items-center gap-2 self-end md:self-center border-l md:border-l border-border-default pl-0 md:pl-4">
          <button
            id="layout-grid-btn"
            onClick={() => handleLayoutChange('grid')}
            className={`rounded-lg p-2 transition-colors ${
              layout === 'grid'
                ? 'bg-accent-primary-dim text-accent-highlight'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            id="layout-row-btn"
            onClick={() => handleLayoutChange('row')}
            className={`rounded-lg p-2 transition-colors ${
              layout === 'row'
                ? 'bg-accent-primary-dim text-accent-highlight'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
            title="List Row View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main List display */}
      {error && (
        <div id="writing-list-error" className="p-4 bg-error-dim border border-error/20 rounded-lg text-sm text-error">
          Error loading writing pieces: {error}
        </div>
      )}

      {!loading && filteredPieces.length === 0 && (
        <div id="writing-list-empty" className="flex flex-col items-center justify-center border border-dashed border-border-default rounded-xl py-16 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-bg-elevated flex items-center justify-center text-text-secondary border border-border-default">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text-primary">No writing found</h3>
            <p className="text-xs text-text-secondary max-w-xs">
              Create your first story piece, outline template, or character diary entry to begin crafting.
            </p>
          </div>
          <button
            id="empty-create-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-default hover:bg-bg-hover px-3.5 py-1.5 text-xs font-medium text-text-primary transition-colors cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5 text-accent-highlight" />
            Create Writing Piece
          </button>
        </div>
      )}

      {layout === 'grid' ? (
        <div id="writing-grid-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPieces.map((piece) => (
            <WritingCard
              key={piece.id}
              piece={piece}
              onClick={handlePieceClick}
              subSeries={subSeries}
            />
          ))}
        </div>
      ) : (
        <div id="writing-row-container" className="border border-border-default rounded-xl bg-bg-elevated/10 overflow-hidden divide-y divide-border-subtle">
          {filteredPieces.map((piece) => (
            <WritingRow
              key={piece.id}
              piece={piece}
              onClick={handlePieceClick}
              subSeries={subSeries}
            />
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isCreateModalOpen && verseId && (
        <WritingCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
          subSeries={subSeries}
          verseId={verseId}
        />
      )}
    </div>
  )
}
export default WritingListPage
