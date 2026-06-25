import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { Character } from '../../../shared/types/database'
import { CharacterRelationship } from '../../relationships/types'
import { RelationshipTypeBadge } from '../../relationships/components/RelationshipTypeBadge'
import { calculateChemistry, CHEMISTRY_COLORS, CHEMISTRY_LABELS } from './CharacterChemistryPage'
import { X, ExternalLink, Plus } from 'lucide-react'

interface ChemistryDetailPanelProps {
  charA: Character | null
  charB: Character | null
  rel: CharacterRelationship | null
  isOpen: boolean
  onClose: () => void
}

function getInitials(name: string) {
  return name ? name.slice(0, 2).toUpperCase() : '??'
}

function CharacterAvatar({ character, size = 36 }: { character: Character; size?: number }) {
  if (character.avatar_url) {
    return (
      <img
        src={character.avatar_url}
        alt={character.name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 border border-[var(--color-border-subtle)]/20"
      />
    )
  }
  return (
    <div 
      style={{ width: size, height: size }}
      className="rounded-full bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/20 text-xs shrink-0 select-none"
    >
      {getInitials(character.name)}
    </div>
  )
}

const DIMENSION_METRIC_LABELS: Record<string, string> = {
  emotional_closeness: 'Closeness',
  conflict_level: 'Conflict',
  trust: 'Trust',
  romantic_tension: 'Romance',
  power_imbalance: 'Power delta',
  loyalty: 'Loyalty',
  dependency: 'Dependency',
  fear_factor: 'Fear factor',
  respect_level: 'Respect',
  unspoken_tension: 'Unspoken tension',
}

const DIMENSION_COLORS: Record<string, string> = {
  emotional_closeness: '#10B981', // emerald
  conflict_level: '#EF4444', // red
  trust: '#3B82F6', // blue
  romantic_tension: '#EC4899', // pink
  power_imbalance: '#F59E0B', // amber
  loyalty: '#6366F1', // indigo
  dependency: '#8B5CF6', // purple
  fear_factor: '#78716C', // stone
  respect_level: '#14B8A6', // teal
  unspoken_tension: '#F43F5E', // rose
}

export function ChemistryDetailPanel({ charA, charB, rel, isOpen, onClose }: ChemistryDetailPanelProps) {
  const { verseId } = useParams<{ verseId: string }>()

  if (!isOpen) return null

  // Gracefully handle deleted characters or missing database entities
  if (!charA || !charB) {
    return (
      <div className="fixed right-0 top-0 bottom-0 w-[280px] bg-[var(--color-bg-elevated)] border-l border-[var(--color-border-subtle)]/30 z-40 p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm text-[var(--color-text-secondary)]">Interpersonal Chemistry</h3>
          <button onClick={onClose} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-center text-xs text-[var(--color-text-muted)] p-4 italic">
          Character data unavailable. It might have been deleted.
        </div>
      </div>
    )
  }

  const chemistry = rel ? calculateChemistry(rel) : null

  // Extract dimensions sorted by highest absolute intensity (value of -5 to 5, absolute 0 to 5)
  const sortedDimensions = rel 
    ? Object.keys(DIMENSION_METRIC_LABELS)
        .map(key => ({
          key,
          label: DIMENSION_METRIC_LABELS[key],
          val: (rel as any)[key] ?? 0,
          abs: Math.abs((rel as any)[key] ?? 0)
        }))
        .sort((a, b) => b.abs - a.abs)
    : []

  const topDimensions = sortedDimensions.slice(0, 4)

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[280px] bg-[var(--color-bg-elevated)] border-l border-[var(--color-border-subtle)]/30 z-40 flex flex-col shadow-xl select-none">
      {/* HEADER SECTION */}
      <div className="p-4 border-b border-[var(--color-border-subtle)]/15 flex items-center justify-between">
        {chemistry ? (
          <span 
            style={{ 
              backgroundColor: `${CHEMISTRY_COLORS[chemistry.type] || '#6B7280'}1E`, 
              color: CHEMISTRY_COLORS[chemistry.type] || '#6B7280',
              borderColor: `${CHEMISTRY_COLORS[chemistry.type] || '#6B7280'}33`
            }} 
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
          >
            {CHEMISTRY_LABELS[chemistry.type]}
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--color-border-subtle)]/20 bg-[var(--color-bg-subtle)]/30 text-[var(--color-text-muted)]">
            No Connection
          </span>
        )}
        <button onClick={onClose} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none">
          <X size={16} />
        </button>
      </div>

      {/* BODY SCROLLABLE SECTION */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* CHARACTER AVATAR PAIR */}
        <div className="flex items-center justify-center gap-3 py-2 bg-[var(--color-bg-base)]/25 rounded-lg border border-[var(--color-border-subtle)]/10">
          <div className="flex flex-col items-center gap-1">
            <CharacterAvatar character={charA} size={38} />
            <Link 
              to={`/verse/${verseId}/characters/${charA.id}`}
              onClick={onClose}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 max-w-[90px] truncate text-center"
            >
              {charA.name}
            </Link>
          </div>
          <span className="text-[var(--color-text-muted)] font-bold text-sm shrink-0">&times;</span>
          <div className="flex flex-col items-center gap-1">
            <CharacterAvatar character={charB} size={38} />
            <Link 
              to={`/verse/${verseId}/characters/${charB.id}`}
              onClick={onClose}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 max-w-[90px] truncate text-center"
            >
              {charB.name}
            </Link>
          </div>
        </div>

        {rel && chemistry ? (
          <>
            {/* CHEMISTRY INTENSITY */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider font-mono">
                  Chemistry Score
                </span>
                <span 
                  style={{ color: CHEMISTRY_COLORS[chemistry.type] }}
                  className="text-sm font-bold font-mono"
                >
                  {chemistry.score}%
                </span>
              </div>
              
              {/* PROGRESS BAR */}
              <div className="h-1.5 w-full bg-[var(--color-bg-base)] rounded-full overflow-hidden">
                <div 
                  style={{ 
                    width: `${chemistry.score}%`,
                    backgroundColor: CHEMISTRY_COLORS[chemistry.type]
                  }}
                  className="h-full rounded-full" 
                />
              </div>
              
              <div className="text-[11px] text-[var(--color-text-muted)] italic leading-tight">
                Driven by: {chemistry.primaryDimension}
              </div>
            </div>

            {/* RELATIONSHIP DETAILS */}
            <div className="border-t border-[var(--color-border-subtle)]/15 pt-4 space-y-2">
              <span className="block text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase font-mono">
                Relationship Classification
              </span>
              <div className="flex items-center gap-2">
                <RelationshipTypeBadge type={rel.relationship_type} size="sm" />
                {rel.dynamic_label && (
                  <span className="text-xs italic text-[var(--color-text-secondary)]">
                    "{rel.dynamic_label}"
                  </span>
                )}
              </div>
              {rel.dynamic_description && (
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {rel.dynamic_description}
                </p>
              )}
            </div>

            {/* TOP BIPOLAR DIMENSIONS */}
            {topDimensions.length > 0 && (
              <div className="border-t border-[var(--color-border-subtle)]/15 pt-4 space-y-2.5">
                <span className="block text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase font-mono">
                  Key Dimensions (-5 to +5)
                </span>
                <div className="space-y-2">
                  {topDimensions.map(({ key, label, val }) => {
                    const widthPercentage = Math.abs(val) * 10
                    const isPositive = val >= 0
                    const dimColor = DIMENSION_COLORS[key] || '#6366F1'
                    
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-[var(--color-text-secondary)]">{label}</span>
                          <span className="font-mono" style={{ color: dimColor }}>
                            {val > 0 ? `+${val}` : val}
                          </span>
                        </div>
                        {/* BIPOLAR MINI-BAR */}
                        <div className="relative w-full h-1 bg-[var(--color-bg-base)] dark:bg-zinc-800 rounded-full overflow-hidden">
                          {/* Center tick */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-[var(--color-border-subtle)]/30 z-10" />
                          <div
                            style={{
                              left: isPositive ? '50%' : undefined,
                              right: !isPositive ? '50%' : undefined,
                              width: `${widthPercentage}%`,
                              backgroundColor: dimColor
                            }}
                            className="absolute top-0 bottom-0 rounded-full"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* BUTTONS */}
            <div className="pt-4 border-t border-[var(--color-border-subtle)]/15">
              <Link
                to={`/verse/${verseId}/relationships`}
                onClick={onClose}
                className="w-full h-9 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] hover:border-indigo-500/50 hover:bg-indigo-500/5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink size={12} />
                <span>View Full Relationship</span>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 gap-3">
            <span className="text-xs text-[var(--color-text-muted)] leading-relaxed italic">
              No relationship defined between these characters.
            </span>
            
            <Link
              to={`/verse/${verseId}/relationships?createA=${charA.id}&createB=${charB.id}`}
              onClick={onClose}
              className="px-3.5 h-8 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow select-none cursor-pointer"
            >
              <Plus size={12} />
              <span>Create Relationship</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
