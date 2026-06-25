import React, { useState } from 'react'
import { Character } from '../../../shared/types/database'
import { versionHistoryService } from '../../../services/versionHistoryService'
import { X, Save, AlertCircle } from 'lucide-react'

interface SnapshotCreateModalProps {
  isOpen: boolean
  onClose: () => void
  character: Character | null
  onSaved: () => void
}

export function SnapshotCreateModal({ isOpen, onClose, character, onSaved }: SnapshotCreateModalProps) {
  const [versionLabel, setVersionLabel] = useState('')
  const [changeNotes, setChangeNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !character) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      await versionHistoryService.saveSnapshot({
        entity_type: 'character',
        entity_id: character.id,
        snapshot: character,      // Save the complete Character object
        version_label: versionLabel.trim() || null,
        change_notes: changeNotes.trim() || null,
      })
      onSaved()
      onClose()
    } catch (err: any) {
      console.error('Failed to save snapshot:', err)
      setError(err.message || 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/30 rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-4 border-b border-[var(--color-border-subtle)]/15 flex justify-between items-center bg-[var(--color-bg-base)]/20">
          <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
            Save Version &mdash; {character.name}
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus:outline-none"
          >
            <X size={16} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto">
          
          {/* VERSION LABEL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider font-mono">
              Version Label (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Pre-arc 2, Original design, After the Collapse..."
              value={versionLabel}
              onChange={e => setVersionLabel(e.target.value)}
              className="w-full h-10 text-xs bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/30 rounded-lg px-3 focus:outline-none focus:border-indigo-500 text-[var(--color-text-primary)]"
            />
          </div>

          {/* CHANGE NOTES */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider font-mono">
              Change Notes (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="What changed since last version? What triggered this save?"
              value={changeNotes}
              onChange={e => setChangeNotes(e.target.value)}
              className="w-full text-xs bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]/30 rounded-lg p-3 focus:outline-none focus:border-indigo-500 text-[var(--color-text-primary)] leading-normal"
            />
          </div>

          {/* INFO DIALOG */}
          <div className="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10 flex items-start gap-2.5">
            <AlertCircle size={15} className="text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              This saves a complete, immutable snapshot of {character.name}'s current profile. You can compare changes, view histories, or restore this exact state at any time.
            </p>
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-semibold text-center">{error}</p>
          )}

          {/* ACTIONS */}
          <div className="flex gap-3 justify-end pt-3 border-t border-[var(--color-border-subtle)]/10">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-bold transition-all cursor-pointer select-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow select-none"
            >
              {isSaving ? <span className="animate-pulse">Saving...</span> : (
                <>
                  <Save size={14} />
                  <span>Save Version</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
