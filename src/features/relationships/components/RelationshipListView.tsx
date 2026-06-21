import React, { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Share2 } from 'lucide-react'
import { Character } from '../../../shared/types/database'
import { RELATIONSHIP_TYPES, RELATIONSHIP_TYPE_LABELS, RelationshipType, CharacterRelationship } from '../types'
import { RelationshipCard } from './RelationshipCard'
import { EmptyState } from '../../../shared/components/ui/EmptyState'

interface RelationshipListViewProps {
  relationships: CharacterRelationship[]
  characters: Character[]
  onEdit: (rel: CharacterRelationship) => void
  onDelete: (id: string) => void
}

export function RelationshipListView({
  relationships,
  characters,
  onEdit,
  onDelete,
}: RelationshipListViewProps) {
  const [filterType, setFilterType] = useState<RelationshipType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Build high-performance lookup indexes
  const characterMap = useMemo(() => {
    const map: Record<string, Character> = {}
    characters.forEach((c) => {
      map[c.id] = c
    })
    return map
  }, [characters])

  // Filter relationship list
  const filteredRelationships = useMemo(() => {
    return relationships.filter((rel) => {
      // 1. Filter by major classification type
      if (filterType !== 'all' && rel.relationship_type !== filterType) {
        return false
      }

      // 2. Filter by search text query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        
        // Lookup Character Names
        const charAName = characterMap[rel.character_a_id]?.name.toLowerCase() || ''
        const charBName = characterMap[rel.character_b_id]?.name.toLowerCase() || ''
        
        // Search dynamic alias/labels
        const label = rel.dynamic_label?.toLowerCase() || ''
        const desc = rel.dynamic_description?.toLowerCase() || ''
        
        // Check tags array too
        const hasTagMatch = rel.tags?.some((t) => t.toLowerCase().includes(query))

        const matchesQuery =
          charAName.includes(query) ||
          charBName.includes(query) ||
          label.includes(query) ||
          desc.includes(query) ||
          hasTagMatch

        if (!matchesQuery) return false
      }

      return true
    })
  }, [relationships, filterType, searchQuery, characterMap])

  return (
    <div className="w-full flex-1 flex flex-col p-4 space-y-4 overflow-hidden select-none">
      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/40 rounded-xl p-2.5 shrink-0">
        
        {/* Left section: Search queries */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search by character, label, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/35 focus:outline-none focus:border-[var(--color-accent-highlight)]/60 rounded-lg text-[var(--color-text-primary)]"
            />
          </div>

          {/* Type Classification Selector */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="h-9 px-2.5 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/35 focus:outline-none focus:border-[var(--color-accent-highlight)]/60 rounded-lg text-[var(--color-text-secondary)] font-medium"
          >
            <option value="all">All Classifications</option>
            {RELATIONSHIP_TYPES.map((type) => (
              <option key={type} value={type}>
                {RELATIONSHIP_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {/* Right count index */}
        <div className="text-[10.5px] font-mono text-[var(--color-text-muted)] flex items-center gap-1.5 px-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/15 rounded-md px-2 py-1 shrink-0">
          <SlidersHorizontal size={11} />
          <span>{filteredRelationships.length} CONNECTIONS MATCHED</span>
        </div>
      </div>

      {/* RENDER LIST CONTAINER */}
      <div className="flex-1 overflow-y-auto scrollbar-custom pb-16">
        {filteredRelationships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRelationships.map((relationship) => {
              const charA = characterMap[relationship.character_a_id] || null
              const charB = characterMap[relationship.character_b_id] || null
              return (
                <RelationshipCard
                  key={relationship.id}
                  relationship={relationship}
                  characterA={charA}
                  characterB={charB}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )
            })}
          </div>
        ) : (
          <div className="py-12">
            <EmptyState
              icon={<Share2 size={44} className="text-[var(--color-text-muted)] animate-pulse" />}
              title="No relationships match your filters"
              description="Adjust your type dropdown or search text query to see connections list."
            />
          </div>
        )}
      </div>
    </div>
  )
}
