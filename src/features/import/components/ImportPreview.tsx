import React, { useState } from 'react'
import { ExtractionResult, ExtractedCharacter } from '../types'
import { Character } from '../../../shared/types/database'
import { ExtractedCharacterCard } from './ExtractedCharacterCard'
import { ExtractedLoreCard } from './ExtractedLoreCard'
import { ExtractedRelationshipCard } from './ExtractedRelationshipCard'
import { ExtractedWritingCard } from './ExtractedWritingCard'
import { DuplicateResolutionModal } from './DuplicateResolutionModal'
import { Sparkles, Save, FileJson, X, ChevronRight, AlertTriangle, HelpCircle } from 'lucide-react'

interface ImportPreviewProps {
  extraction: ExtractionResult
  duplicates: Map<string, string>
  existingCharacters: Character[]
  toggleItem: (type: 'characters' | 'lore_entries' | 'relationships' | 'writing_pieces', id: string) => void
  resolveDuplicate: (id: string, action: 'skip' | 'update' | 'create-new') => void
  startImport: () => void
  isRecoilBackup: boolean
  onCancel: () => void
}

type TabType = 'characters' | 'lore_entries' | 'relationships' | 'writing_pieces'

export function ImportPreview({
  extraction,
  duplicates,
  existingCharacters,
  toggleItem,
  resolveDuplicate,
  startImport,
  isRecoilBackup,
  onCancel,
}: ImportPreviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('characters')
  const [isDupeModalOpen, setIsDupeModalOpen] = useState(false)

  // Calculate totals and selections
  const charTotal = extraction.characters.length
  const charSelected = extraction.characters.filter(c => c._status !== 'excluded').length

  const loreTotal = extraction.lore_entries.length
  const loreSelected = extraction.lore_entries.filter(l => l._status !== 'excluded').length

  const relsTotal = extraction.relationships.length
  const relsSelected = extraction.relationships.filter(r => r._status !== 'excluded').length

  const writingTotal = extraction.writing_pieces.length
  const writingSelected = extraction.writing_pieces.filter(w => w._status !== 'excluded').length

  const totalSelected = charSelected + loreSelected + relsSelected + writingSelected

  // Filter duplicate characters that still require resolution action
  const activeDuplicates = extraction.characters.filter(c => c._status === 'duplicate')
  const hasUnresolvedDupes = activeDuplicates.length > 0

  const handleResolveAllDupes = (resolutions: Record<string, 'skip' | 'update' | 'create-new'>) => {
    Object.entries(resolutions).forEach(([id, action]) => {
      resolveDuplicate(id, action)
    })
    setIsDupeModalOpen(false)
  }

  const getExistingCharacterName = (targetChar: ExtractedCharacter) => {
    const existingId = targetChar._duplicateMatchId
    if (!existingId) return targetChar.name
    const matched = existingCharacters.find(c => c.id === existingId)
    return matched ? matched.name : targetChar.name
  }

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Top statistics summary bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/15 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {isRecoilBackup ? (
              <span className="flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono font-bold text-[9px] px-2 py-0.5 rounded-md uppercase">
                <FileJson size={10} /> Local JSON File Backup
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold text-[9px] px-2 py-0.5 rounded-md uppercase">
                <Sparkles size={10} /> AI Extracted Lore
              </span>
            )}
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Parsed Document Contents</h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Review the extracted character profiles, lore, relationships, or writings. Deselect items you do not wish to import into this verse.
          </p>
        </div>

        {/* CTA Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 hover:bg-[var(--color-bg-hover)] rounded-xl border border-[var(--color-border-subtle)]/25 text-xs font-semibold text-[var(--color-text-secondary)] min-h-[44px] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={13} className="mr-1.5" />
            <span>Cancel</span>
          </button>

          {hasUnresolvedDupes && (
            <button
              type="button"
              onClick={() => setIsDupeModalOpen(true)}
              className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 rounded-xl text-xs font-bold min-h-[44px] flex items-center justify-center gap-1.5 transition-colors"
            >
              <AlertTriangle size={13.5} />
              <span>Resolve Conflicts ({activeDuplicates.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={startImport}
            disabled={totalSelected === 0 || hasUnresolvedDupes}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 min-h-[44px] transition-all"
          >
            <Save size={13.5} />
            <div className="text-left font-sans">
              <p className="leading-none text-xs">Import Selection</p>
              <p className="text-[9px] font-mono opacity-80 mt-1 leading-none">
                {totalSelected} records chosen
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Extraction notes panel if present */}
      {extraction.extractionNotes && (
        <div className="p-4 bg-indigo-950/10 border border-indigo-500/15 rounded-2xl flex items-start gap-3.5">
          <HelpCircle className="text-indigo-400 shrink-0 mt-0.5" size={15} />
          <p className="text-xs text-indigo-300 leading-relaxed font-sans">{extraction.extractionNotes}</p>
        </div>
      )}

      {/* Warn about pending duplicate conflicts */}
      {hasUnresolvedDupes && (
        <div className="p-4 bg-amber-950/20 border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5 text-amber-300">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <div className="space-y-0.5">
              <p className="text-xs font-bold">Unresolved Duplicate Conflicts Remaining</p>
              <p className="text-[11px] text-amber-400/90 leading-relaxed">
                Click &quot;Resolve Conflicts&quot; above to declare how to handle duplicates before importing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDupeModalOpen(true)}
            className="px-4 py-2 bg-amber-500/15 text-amber-400 rounded-xl text-xs font-bold shrink-0 min-h-[44px] hover:bg-amber-500/25"
          >
            Fix Conflicts Now
          </button>
        </div>
      )}

      {/* Tab select bar */}
      <div className="flex border-b border-[var(--color-border-subtle)]/20 overflow-x-auto scrollbar-none pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('characters')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'characters'
              ? 'border-indigo-500 text-indigo-400 font-extrabold'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Characters ({charSelected}/{charTotal})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lore_entries')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'lore_entries'
              ? 'border-indigo-500 text-indigo-400 font-extrabold'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Lore Entries ({loreSelected}/{loreTotal})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('relationships')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'relationships'
              ? 'border-indigo-500 text-indigo-400 font-extrabold'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Relationships ({relsSelected}/{relsTotal})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('writing_pieces')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'writing_pieces'
              ? 'border-indigo-500 text-indigo-400 font-extrabold'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Writing Pieces ({writingSelected}/{writingTotal})
        </button>
      </div>

      {/* Tabs list viewport */}
      <div className="pt-2">
        {activeTab === 'characters' && (
          <div>
            {charTotal === 0 ? (
              <EmptyDisclaimer />
            ) : (
              <div>
                {extraction.characters.map((char) => (
                  <ExtractedCharacterCard
                    key={char._id}
                    character={char}
                    onToggle={() => toggleItem('characters', char._id)}
                    onResolveDuplicate={resolveDuplicate}
                    existingCharacterName={getExistingCharacterName(char)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'lore_entries' && (
          <div>
            {loreTotal === 0 ? (
              <EmptyDisclaimer />
            ) : (
              <div>
                {extraction.lore_entries.map((entry) => (
                  <ExtractedLoreCard
                    key={entry._id}
                    entry={entry}
                    onToggle={() => toggleItem('lore_entries', entry._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'relationships' && (
          <div>
            {relsTotal === 0 ? (
              <EmptyDisclaimer />
            ) : (
              <div>
                {extraction.relationships.map((rel) => (
                  <ExtractedRelationshipCard
                    key={rel._id}
                    relationship={rel}
                    onToggle={() => toggleItem('relationships', rel._id)}
                    existingCharacters={existingCharacters}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'writing_pieces' && (
          <div>
            {writingTotal === 0 ? (
              <EmptyDisclaimer />
            ) : (
              <div>
                {extraction.writing_pieces.map((piece) => (
                  <ExtractedWritingCard
                    key={piece._id}
                    piece={piece}
                    onToggle={() => toggleItem('writing_pieces', piece._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals encapsulation (duplicate controls) */}
      <DuplicateResolutionModal
        isOpen={isDupeModalOpen}
        duplicates={activeDuplicates}
        existingCharacters={existingCharacters}
        onResolveAll={handleResolveAllDupes}
        onClose={() => setIsDupeModalOpen(false)}
      />
    </div>
  )
}

function EmptyDisclaimer() {
  return (
    <div className="py-14 text-center space-y-2 border-2 border-dashed border-[var(--color-border-subtle)]/20 rounded-2xl bg-[var(--color-bg-elevated)]/20">
      <p className="text-xs font-semibold text-[var(--color-text-secondary)]">No Item Type Present</p>
      <p className="text-[11px] text-[var(--color-text-muted)] lg:max-w-xs mx-auto leading-relaxed">
        We found no records of this type inside the uploaded document segment.
      </p>
    </div>
  )
}
