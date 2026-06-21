import React, { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { cn } from '../../../shared/utils/cn'
import { foreshadowingService } from '../../../services/foreshadowingService'
import type { ForeshadowingEntry, ForeshadowingStatus } from '../types'
import { FORESHADOWING_STATUSES, FORESHADOWING_STATUS_LABELS } from '../types'

interface ForeshadowingCreateModalProps {
  isOpen: boolean
  onClose: () => void
  verseId: string
  onCreated: () => void
  existingEntry?: ForeshadowingEntry
}

export function ForeshadowingCreateModal({ isOpen, onClose, verseId, onCreated, existingEntry }: ForeshadowingCreateModalProps) {
  const [description, setDescription] = useState('')
  const [plantedIn, setPlantedIn] = useState('')
  const [payoffIn, setPayoffIn] = useState('')
  const [status, setStatus] = useState<ForeshadowingStatus>('planted')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (existingEntry) {
        setDescription(existingEntry.description)
        setPlantedIn(existingEntry.planted_in || '')
        setPayoffIn(existingEntry.payoff_in || '')
        setStatus(existingEntry.status)
        setNotes(existingEntry.notes || '')
      } else {
        setDescription('')
        setPlantedIn('')
        setPayoffIn('')
        setStatus('planted')
        setNotes('')
      }
    }
  }, [isOpen, existingEntry])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!description.trim()) return
    setIsSaving(true)
    try {
      if (existingEntry) {
        await foreshadowingService.update(existingEntry.id, {
          description: description.trim(),
          planted_in: plantedIn.trim() || null,
          payoff_in: payoffIn.trim() || null,
          status,
          notes: notes.trim() || null,
        })
      } else {
        await foreshadowingService.create({
          verse_id: verseId,
          description: description.trim(),
          planted_in: plantedIn.trim() || undefined,
          payoff_in: payoffIn.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
        })
      }
      onCreated()
      onClose()
    } catch (err: any) {
      alert(`Error saving foreshadowing entry: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <h2 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
            {existingEntry ? 'Edit Entry' : 'New Foreshadowing Entry'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto scrollbar-custom">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">Description <span className="text-red-500">*</span></label>
            <textarea
              autoFocus
              rows={3}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] resize-none"
              placeholder="What was foreshadowed? Be specific enough that you'll remember it later..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">Planted In</label>
              <input
                type="text"
                className="w-full h-9 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg px-3 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                placeholder="e.g. Chapter 3"
                value={plantedIn}
                onChange={e => setPlantedIn(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">Pays Off In</label>
              <input
                type="text"
                className="w-full h-9 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg px-3 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                placeholder="e.g. Arc 2 Finale"
                value={payoffIn}
                onChange={e => setPayoffIn(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">Status</label>
            <div className="flex flex-row bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-1">
              {FORESHADOWING_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex-1 py-1.5 text-[12px] font-medium rounded-md transition-all flex items-center justify-center gap-1.5",
                    status === s 
                      ? "bg-[var(--color-bg-base)] text-[var(--color-text-primary)] shadow-sm" 
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                  )}
                >
                  {status === s && <Check size={12} className="text-[var(--color-accent-primary)]" />}
                  {FORESHADOWING_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)]">Notes / Context</label>
            <textarea
              rows={2}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] resize-none"
              placeholder="Why is it important? What needs to be remembered?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3 bg-[var(--color-bg-elevated)] rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!description.trim() || isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-[13px] font-semibold transition-all shadow-sm"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
