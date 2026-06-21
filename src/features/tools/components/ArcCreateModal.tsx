import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { storyArcService } from '../../../services/storyArcService'
import type { StoryArc, ArcStatus } from '../types'
import { ARC_STATUSES, ARC_STATUS_LABELS } from '../types'
import { cn } from '../../../shared/utils/cn'

interface ArcCreateModalProps {
  isOpen: boolean
  onClose: () => void
  verseId: string
  onCreated: () => void
  existingArc?: StoryArc
}

export function ArcCreateModal({ isOpen, onClose, verseId, onCreated, existingArc }: ArcCreateModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ArcStatus>('planned')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (existingArc) {
        setTitle(existingArc.title)
        setDescription(existingArc.description || '')
        setStatus(existingArc.status)
      } else {
        setTitle('')
        setDescription('')
        setStatus('planned')
      }
    }
  }, [isOpen, existingArc])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!title.trim()) return
    setIsSaving(true)
    try {
      if (existingArc) {
        await storyArcService.update(existingArc.id, {
          title: title.trim(),
          description: description.trim() || null,
          status,
        })
      } else {
        await storyArcService.create({
          verse_id: verseId,
          title: title.trim(),
          description: description.trim() || undefined,
          status,
        })
      }
      onCreated()
      onClose()
    } catch (err: any) {
      alert(`Error saving arc: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl flex flex-col p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">{existingArc ? 'Edit Story Arc' : 'Create Story Arc'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-bg-elevated)] rounded-full">
            <X size={18} />
          </button>
        </div>

        <input 
          autoFocus
          className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-2.5 text-sm mb-3 focus:outline-none focus:border-[var(--color-accent-primary)]"
          placeholder="Arc Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <textarea 
          className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-2.5 text-sm mb-3 resize-none focus:outline-none focus:border-[var(--color-accent-primary)]"
          placeholder="Description"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <select
          className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg p-2.5 text-sm mb-4 focus:outline-none focus:border-[var(--color-accent-primary)]"
          value={status}
          onChange={e => setStatus(e.target.value as ArcStatus)}
        >
          {ARC_STATUSES.map(s => (
            <option key={s} value={s}>{ARC_STATUS_LABELS[s]}</option>
          ))}
        </select>

        <div className="flex justify-end gap-2 mt-4 border-t border-[var(--color-border-subtle)] pt-4">
          <button className="px-4 py-2 text-sm hover:bg-[var(--color-bg-elevated)] rounded-lg" onClick={onClose}>Cancel</button>
          <button 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Arc'}
          </button>
        </div>
      </div>
    </div>
  )
}
