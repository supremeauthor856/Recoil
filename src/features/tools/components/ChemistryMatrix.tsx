import React from 'react'
import { Character } from '../../../shared/types/database'
import { CharacterRelationship } from '../../relationships/types'
import { ChemistryCell } from './ChemistryCell'

interface ChemistryMatrixProps {
  characters: Character[]
  relationships: CharacterRelationship[]
  filterGroup: 'all' | 'oc' | 'canon' | 'au'
  searchA: string
  searchB: string
  onCellClick: (charA: Character, charB: Character, rel: CharacterRelationship | undefined) => void
  selectedPair: { charAId: string; charBId: string } | null
}

function getInitials(name: string) {
  return name ? name.slice(0, 2).toUpperCase() : '??'
}

function CharacterMiniAvatar({ character, size = 24 }: { character: Character; size?: number }) {
  if (character.avatar_url) {
    return (
      <img
        src={character.avatar_url}
        alt={character.name}
        referrerPolicy="no-referrer"
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 border border-[var(--color-border-subtle)]/10"
      />
    )
  }
  return (
    <div 
      style={{ width: size, height: size }}
      className="rounded-full bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/20 text-[9px] shrink-0 select-none"
    >
      {getInitials(character.name)}
    </div>
  )
}

export function ChemistryMatrix({
  characters,
  relationships,
  filterGroup,
  searchA,
  searchB,
  onCellClick,
  selectedPair
}: ChemistryMatrixProps) {
  
  // 1. Build relationship lookup map
  const lookupMap: Record<string, CharacterRelationship> = {}
  relationships.forEach(rel => {
    lookupMap[`${rel.character_a_id}-${rel.character_b_id}`] = rel
    lookupMap[`${rel.character_b_id}-${rel.character_a_id}`] = rel
  })

  // 2. Filter characters based on group (is_oc, is_au, etc.)
  const isOC = (char: any) => char.is_oc === true || char.is_oc === 1 || String(char.is_oc) === 'true'
  const isAU = (char: any) => char.is_au === true || char.is_au === 1 || String(char.is_au) === 'true'
  const isCanon = (char: any) => !isOC(char) && !isAU(char)

  const groupFiltered = characters.filter(char => {
    if (filterGroup === 'oc') return isOC(char)
    if (filterGroup === 'au') return isAU(char)
    if (filterGroup === 'canon') return isCanon(char)
    return true
  })

  // Row characters (filterGroup + searchA)
  const rows = groupFiltered.filter(char => 
    char.name.toLowerCase().includes(searchA.trim().toLowerCase())
  )

  // Column characters (filterGroup + searchB)
  const cols = groupFiltered.filter(char => 
    char.name.toLowerCase().includes(searchB.trim().toLowerCase())
  )

  const maxLen = Math.max(rows.length, cols.length)

  // 3. Scale size based on character count to match requirements
  let cellSize = 64
  let headerHeight = 80
  let labelFontSize = '10px'
  let colTextMax = 8

  if (maxLen > 30) {
    cellSize = 40
    headerHeight = 60
    labelFontSize = '8px'
    colTextMax = 4
  } else if (maxLen > 20) {
    cellSize = 48
    headerHeight = 70
    labelFontSize = '9px'
    colTextMax = 6
  }

  if (rows.length === 0 || cols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-[var(--color-text-muted)] italic bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/25 rounded-xl">
        No characters match the current filter or search criteria on both axes.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {maxLen > 20 && (
        <div className="text-[11px] text-[var(--color-text-muted)] italic px-1">
          Showing {maxLen} characters — use filters or search to narrow down.
        </div>
      )}

      {/* MATRIX WRAPPER */}
      <div className="w-full overflow-auto relative border border-[var(--color-border-subtle)]/15 rounded-xl bg-[var(--color-bg-base)]">
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: `${cellSize * 1.5}px repeat(${cols.length}, ${cellSize}px)`,
            gridTemplateRows: `${headerHeight}px repeat(${rows.length}, ${cellSize}px)`,
            width: 'max-content',
            minWidth: '100%'
          }}
          className="font-sans text-[var(--color-text-primary)]"
        >
          {/* TOP-LEFT CORNER CELL (Sticky) */}
          <div 
            style={{ 
              width: cellSize * 1.5, 
              height: headerHeight 
            }}
            className="sticky left-0 top-0 z-30 bg-[var(--color-bg-elevated)] border-b border-r border-[var(--color-border-subtle)]/25 flex items-center justify-center"
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] font-bold">
              Matrix
            </span>
          </div>

          {/* COLUMN HEADERS (Sticky top) */}
          {cols.map((colChar) => (
            <div
              key={colChar.id}
              style={{
                width: cellSize,
                height: headerHeight,
              }}
              className="sticky top-0 z-20 bg-[var(--color-bg-elevated)] border-b border-r border-[var(--color-border-subtle)]/15 flex flex-col items-center justify-end pb-2 gap-1.5"
            >
              <CharacterMiniAvatar character={colChar} size={cellSize > 48 ? 26 : 20} />
              
              {/* Rotated text layer for desktop */}
              <div 
                className="w-full px-1 text-center truncate shrink-0 select-none overflow-hidden"
                style={{ fontSize: labelFontSize }}
              >
                {colChar.name.length > colTextMax 
                  ? `${colChar.name.slice(0, colTextMax)}.` 
                  : colChar.name}
              </div>
            </div>
          ))}

          {/* ROW BY ROW CELLS */}
          {rows.map((rowChar) => {
            return (
              <React.Fragment key={rowChar.id}>
                {/* ROW HEADER (Sticky left) */}
                <div
                  style={{
                    width: cellSize * 1.5,
                    height: cellSize,
                  }}
                  className="sticky left-0 z-25 bg-[var(--color-bg-elevated)] border-r border-b border-[var(--color-border-subtle)]/25 flex items-center pl-2.5 pr-1 gap-2 overflow-hidden shrink-0"
                >
                  <CharacterMiniAvatar character={rowChar} size={cellSize > 48 ? 26 : 20} />
                  <span 
                    className="truncate font-semibold uppercase font-mono tracking-tight text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    style={{ fontSize: labelFontSize, maxWidth: cellSize > 48 ? '60px' : '36px' }}
                  >
                    {rowChar.name}
                  </span>
                </div>

                {/* COLUMNS METRIC CELLS */}
                {cols.map((colChar) => {
                  const isDiagonal = rowChar.id === colChar.id

                  if (isDiagonal) {
                    return (
                      <div
                        key={colChar.id}
                        style={{ width: cellSize, height: cellSize }}
                        className="border-r border-b border-[var(--color-border-subtle)]/10 bg-[var(--color-bg-subtle)]/20 relative flex items-center justify-center overflow-hidden"
                      >
                        {/* 1px diagonal line representation */}
                        <svg className="absolute inset-0 w-full h-full text-[var(--color-border-subtle)]/30" preserveAspectRatio="none">
                          <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      </div>
                    )
                  }

                  const rel = lookupMap[`${rowChar.id}-${colChar.id}`]
                  const isSelected = selectedPair !== null && (
                    (selectedPair.charAId === rowChar.id && selectedPair.charBId === colChar.id) ||
                    (selectedPair.charAId === colChar.id && selectedPair.charBId === rowChar.id)
                  )

                  return (
                    <div 
                      key={colChar.id}
                      style={{ width: cellSize, height: cellSize }}
                      className="border-r border-b border-[var(--color-border-subtle)]/10 flex items-center justify-center p-0.5"
                    >
                      <ChemistryCell
                        charA={rowChar}
                        charB={colChar}
                        rel={rel}
                        isSelected={isSelected}
                        onClick={() => onCellClick(rowChar, colChar, rel)}
                      />
                    </div>
                  )
                })}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
