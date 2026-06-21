import React, { useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Network, List, Eye, EyeOff, Maximize2, RotateCcw, Plus, Users, Loader2, RefreshCw } from 'lucide-react'
import { useRelationships } from '../hooks/useRelationships'
import { useRelationshipGraph } from '../hooks/useRelationshipGraph'
import { RelationshipGraph, RelationshipGraphRef } from './RelationshipGraph'
import { RelationshipListView } from './RelationshipListView'
import { RelationshipDetailPanel } from './RelationshipDetailPanel'
import { RelationshipCreateModal } from './RelationshipCreateModal'
import { RELATIONSHIP_TYPES, RELATIONSHIP_TYPE_LABELS, RelationshipType, CharacterRelationship } from '../types'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { cn } from '../../../shared/utils/cn'
import { ExportButton } from '../../export/components/ExportButton'

export function RelationshipWebPage() {
  const { verseId = '' } = useParams<{ verseId: string }>()
  const navigate = useNavigate()

  // 1. Core State Managers
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph')
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<RelationshipType | 'all'>('all')
  const [showLabels, setShowLabels] = useState<boolean>(true)
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false)
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false)

  // 2. Fetch characters/relationships custom hooks
  const {
    relationships,
    characters,
    loading,
    error,
    createRelationship,
    updateRelationship,
    deleteRelationship,
  } = useRelationships(verseId)

  // 3. Force layout mapper hooks
  const { nodes, links, saveNodePosition } = useRelationshipGraph(verseId, characters, relationships)

  // Ref container for D3 Graph Zoom triggers
  const graphRef = useRef<RelationshipGraphRef>(null)

  // Find characters participating in currently active relationship
  const selectedRel = useMemo(() => {
    if (!selectedRelId) return null
    return relationships.find((r) => r.id === selectedRelId) || null
  }, [relationships, selectedRelId])

  const { charA, charB } = useMemo(() => {
    if (!selectedRel) return { charA: null, charB: null }
    const a = characters.find((c) => c.id === selectedRel.character_a_id) || null
    const b = characters.find((c) => c.id === selectedRel.character_b_id) || null
    return { charA: a, charB: b }
  }, [selectedRel, characters])

  // Click Actions handlers
  const handleNodeClick = (characterId: string) => {
    navigate(`/verse/${verseId}/characters/${characterId}`)
  }

  const handleLinkClick = (rel: CharacterRelationship | null) => {
    if (rel) {
      setSelectedRelId(rel.id)
    } else {
      setSelectedRelId(null)
    }
  }

  const handleClearSelected = () => {
    setSelectedRelId(null)
  }

  // Handle position reset flow
  const handleConfirmResetPositions = () => {
    graphRef.current?.resetPositions()
    setShowResetConfirm(false)
  }

  // LOADING SCREEN
  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070B] text-[var(--color-text-secondary)] select-none">
        <Loader2 size={32} className="animate-spin text-indigo-500 mb-3" />
        <span className="text-xs font-semibold tracking-wider font-mono">LOADING CONNECTIONS WEB...</span>
      </div>
    )
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="w-full h-full p-8 flex items-center justify-center bg-[#07070B]">
        <div className="max-w-md p-6 bg-rose-950/20 border border-rose-500/20 rounded-2xl text-center space-y-4 shadow-xl">
          <p className="text-sm font-semibold text-rose-400">Error Loading Relationship Network</p>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{error}</p>
        </div>
      </div>
    )
  }

  // NO CHARACTERS STATE
  if (characters.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#07070B] p-4">
        <EmptyState
          icon={<Users size={44} className="text-[var(--color-text-muted)] shrink-0" />}
          title="No characters in this verse yet"
          description="You need to populate some characters in this verse first before you can establish and map interactive relationship links."
          action={{
            label: 'Add Story Characters',
            onClick: () => navigate(`/verse/${verseId}/characters`),
          }}
        />
      </div>
    )
  }

  // RENDER COMPLETE PAGE
  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#07070B] select-none text-[var(--color-text-primary)]">
      
      {/* 1. COMPACT ACTION TOOLBAR (48px) */}
      <div className="h-[48px] border-b border-[var(--color-border-subtle)]/30 bg-[var(--color-bg-elevated)] px-4 flex items-center justify-between shrink-0 select-none z-10 shadow-sm">
        
        {/* Left Toggle buttons: Mode Segmented Switch */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/30 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => {
                setViewMode('graph')
                setSelectedRelId(null)
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all',
                viewMode === 'graph'
                  ? 'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/20 text-[var(--color-text-primary)] shadow-sm font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              )}
            >
              <Network size={11.5} />
              <span>Network Graph</span>
            </button>
            <button
              onClick={() => {
                setViewMode('list')
                setSelectedRelId(null)
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all',
                viewMode === 'list'
                  ? 'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/20 text-[var(--color-text-primary)] shadow-sm font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              )}
            >
              <List size={11.5} />
              <span>List View</span>
            </button>
          </div>
        </div>

        {/* Center Toggle options (ONLY FOR GRAPH MODE) */}
        {viewMode === 'graph' && (
          <div className="hidden sm:flex items-center gap-2">
            
            {/* Filter by Category */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="h-7 px-2 text-[11px] font-semibold bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/35 focus:outline-none rounded-lg text-[var(--color-text-secondary)] shrink-0"
            >
              <option value="all">Highlight: All Types</option>
              {RELATIONSHIP_TYPES.map((type) => (
                <option key={type} value={type}>
                  Highlight: {RELATIONSHIP_TYPE_LABELS[type]}
                </option>
              ))}
            </select>

            {/* Labels toggle */}
            <button
              onClick={() => setShowLabels((prev) => !prev)}
              className="h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)]/35 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all shrink-0"
              title={showLabels ? 'Hide Character Labels' : 'Show Character Labels'}
            >
              {showLabels ? <EyeOff size={11.5} /> : <Eye size={11.5} />}
              <span>{showLabels ? 'Hide Labels' : 'Show Labels'}</span>
            </button>

            {/* Fit view */}
            <button
              onClick={() => graphRef.current?.fitAll()}
              className="h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)]/35 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all shrink-0"
              title="Auto-fit graph items to fill screen width and height"
            >
              <Maximize2 size={11.5} />
              <span>Fit Screen</span>
            </button>

            {/* Reset Positions */}
            <button
              onClick={() => setShowResetConfirm(true)}
              className="h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)]/35 text-[var(--color-text-secondary)] hover:text-rose-400 transition-all shrink-0"
              title="Clear all saved layout constraints and re-arrange organically"
            >
              <RotateCcw size={11.5} />
              <span>Reset Grid</span>
            </button>
          </div>
        )}

        {/* Right Add relationship trigger */}
        <div className="flex items-center gap-2">
          {viewMode === 'graph' && (
            <ExportButton
              scope={{ 
                type: 'relationship-web', 
                nodes, 
                links, 
                verse: { name: 'Recoil Verse' } as any, // Only name is required for web title
                svgRef: { current: graphRef.current?.getSvgElement() || null } as any
              }}
              title="Export Relationship Web"
              allowedFormats={['svg']}
              iconOnly={true}
              className="h-8 bg-transparent border-0 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
            />
          )}

          <button
            onClick={() => setIsCreateOpen(true)}
            className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md select-none border-t border-white/10"
          >
            <Plus size={13} />
            <span>Connect Characters</span>
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT PANEL WRAPPER */}
      <div className="flex-1 flex overflow-hidden relative">
        {viewMode === 'graph' ? (
          relationships.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <EmptyState
                icon={<Network size={44} className="text-[var(--color-text-muted)] animate-pulse shrink-0" />}
                title="No character relationships yet"
                description="Your characters are currently separate entities. Connect A and B characters to populate the relational graph and start tracking complex dynamics."
                action={{
                  label: 'Connect Characters',
                  onClick: () => setIsCreateOpen(true),
                }}
              />
            </div>
          ) : (
            <div className="flex-1 h-full relative overflow-hidden flex">
              {/* Outer Container Grid */}
              <div className="flex-1 h-full relative">
                <RelationshipGraph
                  ref={graphRef}
                  verseId={verseId}
                  nodes={nodes}
                  links={links}
                  onNodeClick={handleNodeClick}
                  onLinkClick={handleLinkClick}
                  selectedLinkId={selectedRelId}
                  onNodePositionChange={saveNodePosition}
                  filterType={filterType}
                  showLabels={showLabels}
                />

                {/* Inline positions reset confirming popover */}
                {showResetConfirm && (
                  <div className="absolute inset-x-0 top-0 h-full bg-[#0A0A0E]/90 z-20 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/55 rounded-xl p-5 w-full max-w-[280px] space-y-4 shadow-2xl">
                      <div className="space-y-1.5">
                        <h4 className="text-[13px] font-bold text-[var(--color-text-primary)] flex items-center gap-1 text-amber-400">
                          <RefreshCw size={12} className="animate-spin-slow" /> Reset Layout Grid?
                        </h4>
                        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                          This will wipe all custom absolute coordinates/pinnings. The simulation engine will reposition they organically from center.
                        </p>
                      </div>

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="h-8 px-3.5 bg-transparent text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmResetPositions}
                          className="h-8 px-4 bg-indigo-600 hover:bg-indigo-500 text-[11px] text-white font-semibold rounded-lg flex items-center justify-center gap-1 transition-all"
                        >
                          Reset Organic
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side Slip-in Detail Settings Sidebar */}
              {selectedRel && (
                <RelationshipDetailPanel
                  relationship={selectedRel}
                  characterA={charA}
                  characterB={charB}
                  onClose={handleClearSelected}
                  onUpdate={updateRelationship}
                  onDelete={deleteRelationship}
                />
              )}
            </div>
          )
        ) : (
          <RelationshipListView
            relationships={relationships}
            characters={characters}
            onEdit={(rel) => {
              // Open edit panel from list view (switch to graph and select it, or simply handle editing here)
              setViewMode('graph')
              setSelectedRelId(rel.id)
            }}
            onDelete={(id) => {
              const confirmDel = window.confirm(
                'Are you sure you want to delete this link? This action is irreversible.'
              )
              if (confirmDel) deleteRelationship(id)
            }}
          />
        )}
      </div>

      {/* 3. RELATIONAL POPUP MODAL CREATORS */}
      <RelationshipCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        verseId={verseId}
        characters={characters}
        existingRelationships={relationships}
        onCreate={createRelationship}
      />
    </div>
  )
}
