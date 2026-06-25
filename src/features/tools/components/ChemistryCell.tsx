import React from 'react'
import { Character } from '../../../shared/types/database'
import { CharacterRelationship } from '../../relationships/types'
import { Tooltip } from '../../../shared/components/ui/Tooltip'
import { RELATIONSHIP_COLORS_HEX } from '../../relationships/types'
import { calculateChemistry, CHEMISTRY_COLORS, CHEMISTRY_LABELS } from './CharacterChemistryPage'
import { Plus } from 'lucide-react'

interface ChemistryCellProps {
  charA: Character
  charB: Character
  rel: CharacterRelationship | undefined
  isSelected: boolean
  onClick: () => void
}

function hexToRGBA(hex: string, alpha: number): string {
  if (!hex || hex === 'transparent') return 'transparent'
  let cleanHex = hex.replace('#', '')
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('')
  }
  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function ChemistryCell({ charA, charB, rel, isSelected, onClick }: ChemistryCellProps) {
  if (!rel) {
    // No connection between two characters
    const cellContent = (
      <div
        onClick={onClick}
        className="w-16 h-16 min-w-16 min-h-16 flex items-center justify-center border border-dashed border-[var(--color-border-subtle)]/30 bg-[var(--color-bg-subtle)]/30 hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] cursor-pointer transition-all roundedgroup"
      >
        <span className="text-xs group-hover:hidden">—</span>
        <Plus size={14} className="hidden group-hover:block text-indigo-400" />
      </div>
    )

    return (
      <Tooltip content={`Connect ${charA.name} and ${charB.name}`}>
        {cellContent}
      </Tooltip>
    )
  }

  // Connection exists, compute chemistry
  const chem = calculateChemistry(rel)
  
  // Opacity map: score < 30 -> 18%, score 30-60 -> 25%, score 60-80 -> 35%, score 80+ -> 45%
  let alpha = 0.18
  if (chem.score >= 80) {
    alpha = 0.45
  } else if (chem.score >= 60) {
    alpha = 0.35
  } else if (chem.score >= 30) {
    alpha = 0.25
  }

  const chemColor = CHEMISTRY_COLORS[chem.type] || '#6B7280'
  const dotColor = rel.relationship_type ? RELATIONSHIP_COLORS_HEX[rel.relationship_type] : null

  // 2-letter abbreviations
  const chemAbbrev: Record<string, string> = {
    explosive: 'EX',
    harmonious: 'HA',
    romantic: 'RO',
    hostile: 'HO',
    tense: 'TE',
    unresolved: 'UN',
    neutral: 'NE',
  }
  
  const labelCode = chemAbbrev[chem.type] || 'NE'

  const tooltipText = (
    <div className="text-xs space-y-0.5">
      <div className="font-semibold">
        {charA.name} &times; {charB.name}
      </div>
      <div>
        {CHEMISTRY_LABELS[chem.type]} ({chem.score}%)
      </div>
      {rel.dynamic_label && (
        <div className="italic text-[var(--color-text-muted)] mt-0.5">
          "{rel.dynamic_label}"
        </div>
      )}
    </div>
  )

  const borderStyle = isSelected 
    ? 'border-2 border-white ring-2 ring-indigo-500 z-10 scale-105 shadow-lg' 
    : `border border-[${chemColor}]/30 hover:scale-105 hover:shadow-md hover:z-10`

  return (
    <Tooltip content={tooltipText}>
      <div
        onClick={onClick}
        style={{ 
          backgroundColor: hexToRGBA(chemColor, alpha),
          borderColor: isSelected ? undefined : hexToRGBA(chemColor, 0.3)
        }}
        className={`w-16 h-16 min-w-16 min-h-16 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 rounded ${borderStyle}`}
      >
        <span 
          style={{ color: chemColor }} 
          className="text-[11px] font-extrabold tracking-wider"
        >
          {labelCode}
        </span>
        {dotColor && (
          <div 
            style={{ backgroundColor: dotColor }}
            className="w-1.5 h-1.5 rounded-full mt-1 border border-black/10" 
          />
        )}
      </div>
    </Tooltip>
  )
}
