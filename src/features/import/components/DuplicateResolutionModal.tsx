import React, { useState, useEffect } from 'react'
import { Modal } from '../../../shared/components/ui/Modal'
import { ExtractedCharacter } from '../types'
import { Character } from '../../../shared/types/database'
import { UserCheck, AlertTriangle } from 'lucide-react'

interface DuplicateResolutionModalProps {
  isOpen: boolean
  duplicates: ExtractedCharacter[]
  existingCharacters: Character[]
  onResolveAll: (resolutions: Record<string, 'skip' | 'update' | 'create-new'>) => void
  onClose: () => void
}

type ActionType = 'skip' | 'update' | 'create-new'

export function DuplicateResolutionModal({
  isOpen,
  duplicates,
  existingCharacters,
  onResolveAll,
  onClose,
}: DuplicateResolutionModalProps) {
  // Store individual resolutions in local dictionary state
  const [resolutions, setResolutions] = useState<Record<string, ActionType>>({})

  // Reset resolutions state when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, ActionType> = {}
      duplicates.forEach(d => {
        initial[d._id] = 'update' // Default to update existing
      })
      setResolutions(initial)
    }
  }, [isOpen, duplicates])

  if (!isOpen) return null

  const handleSetAll = (action: ActionType) => {
    const updated = { ...resolutions }
    duplicates.forEach(d => {
      updated[d._id] = action
    })
    setResolutions(updated)
  }

  const handleSetIndividual = (id: string, action: ActionType) => {
    setResolutions(prev => ({
      ...prev,
      [id]: action,
    }))
  }

  const handleApply = () => {
    onResolveAll(resolutions)
  }

  const getExistingInfo = (name: string) => {
    const match = existingCharacters.find(
      c => c.name.trim().toLowerCase() === name.trim().toLowerCase()
    )
    if (!match) return 'Existing character details unretrievable.'
    return [
      match.species ? `Species: ${match.species}` : null,
      match.age ? `Age: ${match.age}` : null,
      match.role ? `Role: ${match.role}` : null,
    ]
      .filter(Boolean)
      .join(' | ') || 'No extra profile details saved.'
  }

  const footer = (
    <div className="flex items-center justify-end gap-3.5 w-full">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2 hover:bg-[var(--color-bg-hover)] rounded-xl text-xs font-semibold text-[var(--color-text-secondary)] transition-colors min-h-[44px]"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={handleApply}
        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center gap-2 min-h-[44px]"
      >
        <UserCheck size={14} />
        <span>Apply Resolutions</span>
      </button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Resolve Duplicate Characters (${duplicates.length})`}
      size="lg"
      footer={footer}
    >
      <div className="space-y-5">
        <div className="p-3.5 bg-amber-950/15 border border-amber-600/25 rounded-2xl flex items-start gap-3 text-amber-300">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-normal">
            We discovered character profiles in your uploaded document with names matching profiles already in this verse. Resolve how to handle these duplicates before completing the import process.
          </p>
        </div>

        {/* Shortcuts row */}
        <div className="flex flex-wrap items-center gap-2 text-xs border-b border-[var(--color-border-subtle)]/25 pb-3">
          <span className="text-[var(--color-text-muted)] font-mono text-[10px] uppercase tracking-wide mr-1">Bulk Shortcuts:</span>
          <button
            type="button"
            onClick={() => handleSetAll('skip')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer py-1 px-1.5 hover:bg-indigo-500/5 rounded transition-colors"
          >
            Apply All as Skip
          </button>
          <span className="text-[var(--color-text-muted)]/40">•</span>
          <button
            type="button"
            onClick={() => handleSetAll('update')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer py-1 px-1.5 hover:bg-indigo-500/5 rounded transition-colors"
          >
            Apply All as Update
          </button>
          <span className="text-[var(--color-text-muted)]/40">•</span>
          <button
            type="button"
            onClick={() => handleSetAll('create-new')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer py-1 px-1.5 hover:bg-indigo-500/5 rounded transition-colors"
          >
            Apply All as Create New
          </button>
        </div>

        {/* List of duplicates */}
        <div className="space-y-4 max-h-[440px] overflow-y-auto scrollbar-custom pr-1 pb-1">
          {duplicates.map(char => {
            const currentAction = resolutions[char._id] || 'update'
            return (
              <div
                key={char._id}
                className="bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/20 p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-4"
              >
                {/* Left block Info */}
                <div className="space-y-1 sm:max-w-[40%]">
                  <p className="text-xs font-bold text-[var(--color-text-primary)]">{char.name}</p>
                  <p className="text-[10px] font-mono text-[var(--color-text-muted)] tracking-tight">
                    {getExistingInfo(char.name)}
                  </p>
                </div>

                {/* Right block Radio Choices */}
                <div className="flex flex-wrap items-center gap-5 sm:gap-6 shrink-0 pt-1 sm:pt-0">
                  <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer">
                    <input
                      type="radio"
                      name={`dupe-action-${char._id}`}
                      checked={currentAction === 'skip'}
                      onChange={() => handleSetIndividual(char._id, 'skip')}
                      className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Skip</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer">
                    <input
                      type="radio"
                      name={`dupe-action-${char._id}`}
                      checked={currentAction === 'update'}
                      onChange={() => handleSetIndividual(char._id, 'update')}
                      className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Update Existing</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer">
                    <input
                      type="radio"
                      name={`dupe-action-${char._id}`}
                      checked={currentAction === 'create-new'}
                      onChange={() => handleSetIndividual(char._id, 'create-new')}
                      className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Create New</span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
