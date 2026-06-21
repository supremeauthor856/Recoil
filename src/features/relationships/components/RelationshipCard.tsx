import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react'
import { Character } from '../../../shared/types/database'
import { INTENSITY_DIMENSIONS, RELATIONSHIP_COLORS_HEX, CharacterRelationship } from '../types'
import { RelationshipTypeBadge } from './RelationshipTypeBadge'
import { cn } from '../../../shared/utils/cn'

interface RelationshipCardProps {
  relationship: CharacterRelationship
  characterA: Character | null
  characterB: Character | null
  onEdit: (rel: CharacterRelationship) => void
  onDelete: (id: string) => void
}

export function RelationshipCard({
  relationship,
  characterA,
  characterB,
  onEdit,
  onDelete,
}: RelationshipCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close context action popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Figure out the four most prominent intensity dimensions
  const getTopDimensions = () => {
    const list = INTENSITY_DIMENSIONS.map((dim) => {
      const rawVal = (relationship[dim.key as keyof CharacterRelationship] as number) || 0
      // Normalize absolute strength to a 0-10 scale for unified comparison:
      // Bipolar is -5 to +5 (mult by 2), Unipolar is 0 to 10 (keep)
      const normalizedStrength = dim.bipolar ? Math.abs(rawVal) * 2 : rawVal
      return {
        dim,
        rawVal,
        strength: normalizedStrength,
      }
    })

    // Sort by descending strength, filter non-zeros, and slice top 4
    const nonZeros = list.filter((i) => i.strength > 0)
    nonZeros.sort((a, b) => b.strength - a.strength)

    if (nonZeros.length >= 4) return nonZeros.slice(0, 4)

    // Backfill with the highest available dimensions (including zeros if needed)
    const sortedAll = [...list].sort((a, b) => b.strength - a.strength)
    return sortedAll.slice(0, 4)
  }

  const topDimensions = getTopDimensions()

  return (
    <div className="bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-border-default)]/60 rounded-xl p-4 transition-all duration-150 flex flex-col justify-between h-[155px] relative group select-none shadow-sm select-none">
      
      {/* Top action row */}
      <div className="flex items-center justify-between w-full shrink-0">
        <RelationshipTypeBadge type={relationship.relationship_type} size="sm" />
        
        {/* Context Menu Button */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu((prev) => !prev)
            }}
            className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-base)] transition-all"
          >
            <MoreHorizontal size={14} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-28 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-lg shadow-xl py-1 z-30">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(relationship)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] flex items-center gap-1.5 transition-colors"
              >
                <Edit2 size={11} /> Edit Detail
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(relationship.id)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-1.5 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors border-t border-[var(--color-border-subtle)]/30"
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Characters Pair Row */}
      <div className="flex items-center gap-2.5 my-2">
        <div className="flex -space-x-2.5 shrink-0">
          {/* Avatar A */}
          {characterA?.avatar_url || characterA?.reference_image_url ? (
            <img
              src={characterA.avatar_url || characterA.reference_image_url || ''}
              alt={characterA.name}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-[var(--color-border-subtle)]/50 ring-2 ring-[var(--color-bg-elevated)]"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center text-[10px] font-bold text-white uppercase ring-2 ring-[var(--color-bg-elevated)]">
              {characterA?.name.charAt(0)}
            </div>
          )}

          {/* Avatar B */}
          {characterB?.avatar_url || characterB?.reference_image_url ? (
            <img
              src={characterB.avatar_url || characterB.reference_image_url || ''}
              alt={characterB.name}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-[var(--color-border-subtle)]/50 ring-2 ring-[var(--color-bg-elevated)]"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-[10px] font-bold text-white uppercase ring-2 ring-[var(--color-bg-elevated)]">
              {characterB?.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Text descriptions */}
        <div className="min-w-0 flex-1 leading-snug">
          <div className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
            {characterA?.name} <span className="text-[10px] text-[var(--color-text-muted)] font-normal">with</span> {characterB?.name}
          </div>
          {relationship.dynamic_label && (
            <div className="text-[11px] text-[var(--color-text-muted)] italic truncate">
              {relationship.dynamic_label}
            </div>
          )}
        </div>
      </div>

      {/* Mini intensity preview bento grid (Bottom row) */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-[var(--color-border-subtle)]/20 shrink-0">
        {topDimensions.map(({ dim, rawVal }) => {
          const isBipolar = dim.bipolar
          const maxVal = isBipolar ? 5 : 10
          const progressPercent = Math.min(100, Math.max(0, (Math.abs(rawVal) / maxVal) * 100))

          // Accent color depending on value orientation
          const isNegative = isBipolar && rawVal < 0
          const barColor = isNegative ? 'bg-rose-500' : 'bg-indigo-400'

          return (
            <div key={dim.key} className="flex items-center justify-between gap-1.5 min-w-0">
              <span className="text-[9.5px] text-[var(--color-text-muted)] truncate select-none md:max-w-[70px]">
                {dim.label}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                {/* Visual mini-bar */}
                <div className="w-[30px] h-1.5 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/15 rounded-full overflow-hidden relative">
                  <div
                    className={cn('h-full rounded-full transition-all duration-300', barColor)}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono font-semibold text-[var(--color-text-secondary)] min-w-[12px] text-right">
                  {isBipolar && rawVal > 0 ? `+${rawVal}` : rawVal}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
