import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ToolsLayout } from './ToolsLayout'
import { getCharacters } from '../../../services/characterService'
import { getRelationships } from '../../../services/relationshipService'
import { Character } from '../../../shared/types/database'
import { CharacterRelationship } from '../../relationships/types'
import { ChemistryMatrix } from './ChemistryMatrix'
import { ChemistryDetailPanel } from './ChemistryDetailPanel'
import { Grid, Info, Loader2, Sparkles } from 'lucide-react'

// --- CHEMISTRY CALCULATION UTILITY ---

export type ChemistryType =
  | 'explosive'
  | 'harmonious'
  | 'romantic'
  | 'hostile'
  | 'tense'
  | 'unresolved'
  | 'neutral'
  | 'no-connection'

export interface ChemistryResult {
  type: ChemistryType
  score: number           // 0-100 intensity score
  primaryDimension: string
}

export const CHEMISTRY_LABELS: Record<ChemistryType, string> = {
  explosive: 'Explosive',
  harmonious: 'Harmonious',
  romantic: 'Romantic',
  hostile: 'Hostile',
  tense: 'Tense',
  unresolved: 'Unresolved',
  neutral: 'Neutral',
  'no-connection': 'No Connection',
}

export const CHEMISTRY_COLORS: Record<ChemistryType, string> = {
  explosive: '#FB923C', // Orange
  harmonious: '#4ADE80', // Green
  romantic: '#FF6B9D', // Pink
  hostile: '#F87171', // Red
  tense: '#A855F7', // Purple
  unresolved: '#E879F9', // Magenta
  neutral: '#6B7280', // Gray
  'no-connection': 'transparent',
}

export const CHEMISTRY_DESCRIPTIONS: Record<string, string> = {
  explosive: 'High closeness paired with high volatility and friction.',
  harmonious: 'Deep emotional trust and closeness with very low conflict.',
  romantic: 'Prevalence of high romantic and emotional tension.',
  hostile: 'Severe friction, argument, or outright negative relationship.',
  tense: 'Driven by power asymmetry, deep respect, or fear of each other.',
  unresolved: 'Rich subtext of unspoken secrets or unaddressed history.',
  neutral: 'Simple connection without any particularly high extremes.',
}

export function calculateChemistry(
  rel: CharacterRelationship | undefined
): ChemistryResult {
  if (!rel) return { type: 'no-connection', score: 0, primaryDimension: 'None' }

  const {
    emotional_closeness,
    conflict_level,
    romantic_tension,
    unspoken_tension,
    fear_factor,
    trust,
  } = rel

  // Determine primary chemistry driver and type
  const absRomantic = Math.abs(romantic_tension ?? 0)
  const absConflict = Math.abs(conflict_level ?? 0)
  const absFear = Math.abs(fear_factor ?? 0)
  const absUnspoken = Math.abs(unspoken_tension ?? 0)
  const absCloseness = Math.abs(emotional_closeness ?? 0)
  const absTrust = Math.abs(trust ?? 0)

  // Score = weighted combination of absolute dimension values (all scaled 0-5)
  const rawScore =
    absCloseness * 0.25 +
    absConflict * 0.20 +
    absRomantic * 0.20 +
    absUnspoken * 0.15 +
    absFear * 0.10 +
    absTrust * 0.10

  const score = Math.round((Math.min(5, rawScore) / 5) * 100)

  // Type classification
  let type: ChemistryType = 'neutral'
  let primaryDimension = 'General'

  if (absRomantic >= 3.5) {
    if (absConflict >= 2.5) {
      type = 'explosive'
      primaryDimension = 'Romantic tension + high conflict'
    } else {
      type = 'romantic'
      primaryDimension = 'Romantic tension'
    }
  } else if (absCloseness >= 3 && absConflict >= 3) {
    type = 'explosive'
    primaryDimension = 'Close but volatile connection'
  } else if (absCloseness >= 3.5 && absConflict < 2) {
    type = 'harmonious'
    primaryDimension = 'Deep emotional closeness & trust'
  } else if (conflict_level >= 3 || (absConflict >= 2.5 && emotional_closeness < 0)) {
    type = 'hostile'
    primaryDimension = 'Active conflict'
  } else if (absFear >= 3) {
    type = 'tense'
    primaryDimension = 'Prevalent fear asymmetry'
  } else if (absUnspoken >= 3) {
    type = 'unresolved'
    primaryDimension = 'Unresolved unspoken tension'
  } else if (rawScore < 0.8) {
    type = 'neutral'
    primaryDimension = 'Low interaction intensity'
  }

  return { type, score, primaryDimension }
}

export function CharacterChemistryPage() {
  const { verseId } = useParams<{ verseId: string }>()

  const [characters, setCharacters] = useState<Character[]>([])
  const [relationships, setRelationships] = useState<CharacterRelationship[]>([])
  const [loading, setLoading] = useState(true)

  const [filterGroup, setFilterGroup] = useState<'all' | 'oc' | 'canon' | 'au'>('all')
  const [searchA, setSearchA] = useState('')
  const [searchB, setSearchB] = useState('')

  const [selectedPair, setSelectedPair] = useState<{ charA: Character; charB: Character } | null>(null)
  const [selectedRel, setSelectedRel] = useState<CharacterRelationship | null>(null)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)
  
  const [showLegend, setShowLegend] = useState(false)

  const loadData = async () => {
    if (!verseId) return
    setLoading(true)
    try {
      const [chars, rels] = await Promise.all([
        getCharacters({ verseId }),
        getRelationships(verseId)
      ])
      setCharacters(chars)
      setRelationships(rels)
    } catch (err) {
      console.error('Failed to load matrix data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [verseId])

  const handleCellClick = (charA: Character, charB: Character, rel: CharacterRelationship | undefined) => {
    setSelectedPair({ charA, charB })
    setSelectedRel(rel ?? null)
    setDetailPanelOpen(true)
  }

  return (
    <ToolsLayout
      title="Character Chemistry Matrix"
      description="See the interpersonal chemistry between every character pair at a glance."
      icon={<Grid size={20} />}
    >
      <div className="p-6 w-full max-w-[1200px] mx-auto flex flex-col gap-6 pb-24 select-none">
        
        {/* TOOLBAR */}
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* GROUP CLASSIFIER */}
            <div className="flex bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/30 rounded-lg p-0.5 max-sm:w-full">
              {(['all', 'oc', 'canon', 'au'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setFilterGroup(g)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all uppercase tracking-wider max-sm:flex-1 ${
                    filterGroup === g
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {g === 'all' ? 'All' : g === 'oc' ? 'OCs' : g === 'canon' ? 'Canon' : 'AU'}
                </button>
              ))}
            </div>

            {/* QUICK LEGEND */}
            <div className="relative">
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/30 rounded-lg text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <Info size={13} />
                <span>Legend</span>
              </button>

              {showLegend && (
                <div className="absolute left-0 mt-2 w-72 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl shadow-xl p-4 z-50 text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)]/15 pb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider pr-1 text-[var(--color-text-secondary)]">
                      Color Legend & Types
                    </span>
                    <button 
                      onClick={() => setShowLegend(false)}
                      className="text-[11px] text-indigo-400 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Object.keys(CHEMISTRY_DESCRIPTIONS).map((key) => {
                      const label = CHEMISTRY_LABELS[key as ChemistryType]
                      const color = CHEMISTRY_COLORS[key as ChemistryType]
                      const desc = CHEMISTRY_DESCRIPTIONS[key]
                      return (
                        <div key={key} className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-2">
                            <span 
                              style={{ backgroundColor: color }} 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                            />
                            <span className="font-bold text-[var(--color-text-primary)]">{label}</span>
                          </div>
                          <p className="text-[10.5px] text-[var(--color-text-secondary)] leading-normal pl-4">
                            {desc}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DUAL FILTERS */}
          <div className="flex flex-col sm:flex-row items-center gap-2 max-sm:w-full">
            <input
              type="text"
              placeholder="Filter Rows..."
              value={searchA}
              onChange={(e) => setSearchA(e.target.value)}
              className="w-full sm:w-40 h-8 text-xs bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg px-2.5 focus:outline-none focus:border-indigo-500 text-[var(--color-text-primary)]"
            />
            <span className="text-xs text-[var(--color-text-muted)] shrink-0 max-sm:hidden">by</span>
            <input
              type="text"
              placeholder="Filter Columns..."
              value={searchB}
              onChange={(e) => setSearchB(e.target.value)}
              className="w-full sm:w-40 h-8 text-xs bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg px-2.5 focus:outline-none focus:border-indigo-500 text-[var(--color-text-primary)]"
            />
          </div>
        </div>

        {/* MATRIX SECTION */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-24 gap-2">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <span className="text-xs text-[var(--color-text-muted)]">Computing interpersonal links...</span>
          </div>
        ) : characters.length < 2 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-16">
            <div className="text-center space-y-2">
              <span className="mx-auto block text-indigo-400 p-3 bg-indigo-500/10 rounded-full w-max">
                <Grid size={28} />
              </span>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Add More Characters</h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                Add at least 2 characters to see their calculated chemistry matrix.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <ChemistryMatrix
              characters={characters}
              relationships={relationships}
              filterGroup={filterGroup}
              searchA={searchA}
              searchB={searchB}
              onCellClick={handleCellClick}
              selectedPair={
                selectedPair 
                  ? { charAId: selectedPair.charA.id, charBId: selectedPair.charB.id } 
                  : null
              }
            />
          </div>
        )}

        {/* SIDE DETAIL SLIDING PANEL */}
        <ChemistryDetailPanel
          charA={selectedPair?.charA ?? null}
          charB={selectedPair?.charB ?? null}
          rel={selectedRel}
          isOpen={detailPanelOpen}
          onClose={() => {
            setDetailPanelOpen(false)
            setSelectedPair(null)
            setSelectedRel(null)
          }}
        />
      </div>
    </ToolsLayout>
  )
}
