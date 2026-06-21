import React, { useState, useEffect } from 'react'
import { ExtractionResult, ImportStatus } from '../types'
import { Loader2, CheckCircle2, Circle, AlertCircle } from 'lucide-react'

interface ImportProgressModalProps {
  isOpen: boolean
  status: ImportStatus
  extraction: ExtractionResult | null
  importedSoFar: { chars: number; lore: number; rels: number; writing: number }
}

const CYCLING_MESSAGES = [
  'Building character profiles...',
  'Linking relationships...',
  'Saving your lore...',
  'Compiling story pieces...',
  'Calculating profile completeness...',
  'Structuring verse records...',
  'Almost there...',
]

export function ImportProgressModal({
  isOpen,
  status,
  extraction,
  importedSoFar,
}: ImportProgressModalProps) {
  const [msgIndex, setMsgIndex] = useState(0)

  // Cycle through pending helper messages
  useEffect(() => {
    if (status !== 'importing') return
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % CYCLING_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [status])

  if (!isOpen || status !== 'importing') return null

  // Calculate totals
  const totalChars = extraction?.characters.filter(c => c._status === 'included').length ?? 0
  const totalLore = extraction?.lore_entries.filter(l => l._status === 'included').length ?? 0
  const totalRels = extraction?.relationships.filter(r => r._status === 'included').length ?? 0
  const totalWriting = extraction?.writing_pieces.filter(w => w._status === 'included').length ?? 0

  // Calculate phase status: 'pending', 'active', 'done', 'error'
  const getPhaseState = (phase: 'chars' | 'lore' | 'rels' | 'writing') => {
    if (phase === 'chars') {
      if (importedSoFar.chars === totalChars) return 'done'
      return 'active'
    }

    if (phase === 'lore') {
      if (importedSoFar.chars < totalChars) return 'pending'
      if (importedSoFar.lore === totalLore) return 'done'
      return 'active'
    }

    if (phase === 'rels') {
      if (importedSoFar.chars < totalChars || importedSoFar.lore < totalLore) return 'pending'
      if (importedSoFar.rels === totalRels) return 'done'
      return 'active'
    }

    if (phase === 'writing') {
      if (
        importedSoFar.chars < totalChars ||
        importedSoFar.lore < totalLore ||
        importedSoFar.rels < totalRels
      ) {
        return 'pending'
      }
      if (importedSoFar.writing === totalWriting) return 'done'
      return 'active'
    }

    return 'pending'
  }

  const renderIcon = (phase: 'chars' | 'lore' | 'rels' | 'writing') => {
    const phaseState = getPhaseState(phase)
    switch (phaseState) {
      case 'done':
        return <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
      case 'active':
        return <Loader2 className="animate-spin text-indigo-500 shrink-0" size={18} />
      case 'pending':
      default:
        return <Circle className="text-[var(--color-text-muted)]/30 shrink-0" size={18} />
    }
  }

  const renderProgressText = (
    phase: 'chars' | 'lore' | 'rels' | 'writing',
    current: number,
    total: number
  ) => {
    const phaseState = getPhaseState(phase)
    if (phaseState === 'pending') {
      return <span className="text-[10px] font-mono text-[var(--color-text-muted)]/50 uppercase">Waiting...</span>
    }
    if (phaseState === 'done') {
      return (
        <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase">
          Passed ({current}/{total})
        </span>
      )
    }
    return (
      <span className="text-[10px] font-mono text-indigo-400 font-bold animate-pulse">
        Running ({current}/{total})
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Heavy dismiss-disabled backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal Container */}
      <div className="relative bg-[var(--color-bg-floating)] border border-[var(--color-border-strong)]/50 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center justify-center gap-7 text-center z-10 select-none">
        
        {/* Giant spinner */}
        <div className="relative w-16 h-16 flex items-center justify-center bg-indigo-950/20 border border-indigo-500/10 rounded-full">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>

        <div className="space-y-1.5 w-full">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Importing into Verse Database</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Executing sequential database transactions. Do not close your browser tab or interrupt the process.
          </p>
        </div>

        {/* Phase progress list */}
        <div className="w-full space-y-3 pt-3 pb-2 border-y border-[var(--color-border-subtle)]/15">
          {/* Phase 1 */}
          <div className="flex items-center justify-between p-3.5 bg-[var(--color-bg-subtle)] rounded-2xl border border-[var(--color-border-subtle)]/15">
            <div className="flex items-center gap-3">
              {renderIcon('chars')}
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Creating Characters</span>
            </div>
            {renderProgressText('chars', importedSoFar.chars, totalChars)}
          </div>

          {/* Phase 2 */}
          <div className="flex items-center justify-between p-3.5 bg-[var(--color-bg-subtle)] rounded-2xl border border-[var(--color-border-subtle)]/15">
            <div className="flex items-center gap-3">
              {renderIcon('lore')}
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Importing Lore</span>
            </div>
            {renderProgressText('lore', importedSoFar.lore, totalLore)}
          </div>

          {/* Phase 3 */}
          <div className="flex items-center justify-between p-3.5 bg-[var(--color-bg-subtle)] rounded-2xl border border-[var(--color-border-subtle)]/15">
            <div className="flex items-center gap-3">
              {renderIcon('rels')}
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Creating Relationships</span>
            </div>
            {renderProgressText('rels', importedSoFar.rels, totalRels)}
          </div>

          {/* Phase 4 */}
          <div className="flex items-center justify-between p-3.5 bg-[var(--color-bg-subtle)] rounded-2xl border border-[var(--color-border-subtle)]/15">
            <div className="flex items-center gap-3">
              {renderIcon('writing')}
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Saving Writing Pieces</span>
            </div>
            {renderProgressText('writing', importedSoFar.writing, totalWriting)}
          </div>
        </div>

        {/* Cycling helper message */}
        <p className="text-xs font-semibold text-indigo-400 font-mono tracking-wide h-4 animate-fade-in">
          {CYCLING_MESSAGES[msgIndex]}
        </p>
      </div>
    </div>
  )
}
