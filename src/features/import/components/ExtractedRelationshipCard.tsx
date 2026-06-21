import React from 'react'
import { ExtractedRelationship } from '../types'
import { RelationshipTypeBadge } from '../../relationships/components/RelationshipTypeBadge'
import { Character } from '../../../shared/types/database'
import { AlertTriangle } from 'lucide-react'

interface ExtractedRelationshipCardProps {
  relationship: ExtractedRelationship
  onToggle: () => void
  existingCharacters: Character[]
}

export function ExtractedRelationshipCard({
  relationship,
  onToggle,
  existingCharacters,
}: ExtractedRelationshipCardProps) {
  const isIncluded = relationship._status !== 'excluded'

  // Resolve whether character A and B exist inside the DB currently
  const checkExists = (name: string) => {
    return existingCharacters.some(
      c => c.name.trim().toLowerCase() === name.trim().toLowerCase()
    )
  }

  const aExists = checkExists(relationship.character_a_name)
  const bExists = checkExists(relationship.character_b_name)
  const hasUnresolved = !aExists || !bExists

  return (
    <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)]/30 p-4 mb-2 shadow-sm select-none">
      <div className="flex items-start gap-3">
        {/* Toggle inclusion checkbox */}
        <div className="pt-1.5 select-none animate-fade-in">
          <input
            id={`checkbox-rel-${relationship._id}`}
            type="checkbox"
            checked={isIncluded}
            onChange={onToggle}
            className="w-4 h-4 text-indigo-600 border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] rounded shadow-sm focus:ring-indigo-500 focus:ring-2 cursor-pointer"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Main content row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label
              htmlFor={`checkbox-rel-${relationship._id}`}
              className="text-xs font-bold text-[var(--color-text-primary)] cursor-pointer hover:text-indigo-400"
            >
              {relationship.character_a_name} — {relationship.character_b_name}
            </label>

            {/* Type badge */}
            <RelationshipTypeBadge
              type={relationship.relationship_type as any}
              size="sm"
            />
          </div>

          {/* Dynamic properties display */}
          {relationship.dynamic_label && (
            <p className="text-xs text-[var(--color-text-secondary)] italic font-semibold leading-relaxed">
              &ldquo;{relationship.dynamic_label}&rdquo;
            </p>
          )}

          {relationship.dynamic_description && (
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed font-serif">
              {relationship.dynamic_description}
            </p>
          )}

          {/* Warnings for missing participants */}
          {hasUnresolved && isIncluded && (
            <div className="flex items-center gap-2 p-2 bg-amber-950/10 border border-amber-500/20 rounded-lg text-amber-500 text-[10px] sm:text-xs">
              <AlertTriangle size={13} className="shrink-0" />
              <span>
                {!aExists && !bExists
                  ? 'Both characters do not currently exist in your database and will be created if imported.'
                  : !aExists
                  ? `Character '${relationship.character_a_name}' does not currently exist and will be created.`
                  : `Character '${relationship.character_b_name}' does not currently exist and will be created.`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
