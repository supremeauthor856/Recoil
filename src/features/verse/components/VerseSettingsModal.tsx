import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Verse } from '../types'
import { Modal } from '../../../shared/components/ui/Modal'
import { Input } from '../../../shared/components/ui/Input'
import { Textarea } from '../../../shared/components/ui/Textarea'
import { Button } from '../../../shared/components/ui/Button'
import { Divider } from '../../../shared/components/ui/Divider'
import { ColorPicker } from './ColorPicker'
import * as verseService from '../../../services/verseService'
import { useUIStore } from '../../../store/uiStore'

interface VerseSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  verse: Verse
  onSuccess?: () => void
}

export function VerseSettingsModal({ isOpen, onClose, verse, onSuccess }: VerseSettingsModalProps) {
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const [name, setName] = useState(verse.name)
  const [description, setDescription] = useState(verse.description || '')
  const [iconColor, setIconColor] = useState(verse.icon_color)
  const [iconLetter, setIconLetter] = useState(verse.icon_letter || '')
  const [isManualLetter, setIsManualLetter] = useState(true)
  const [loading, setLoading] = useState(false)

  // Confirmation Modal State
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [confirmNameInput, setConfirmNameInput] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Sync state with prop changes when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(verse.name)
      setDescription(verse.description || '')
      setIconColor(verse.icon_color)
      setIconLetter(verse.icon_letter || '')
      setIsManualLetter(true)
      setShowConfirmDelete(false)
      setConfirmNameInput('')
    }
  }, [isOpen, verse])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!isManualLetter) {
      setIconLetter(val.trim().charAt(0).toUpperCase())
    }
  }

  const handleLetterChange = (val: string) => {
    setIconLetter(val.slice(0, 2))
    setIsManualLetter(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return

    setLoading(true)
    try {
      const finalLetter = iconLetter.trim() || name.trim().charAt(0).toUpperCase()
      await verseService.updateVerse(verse.id, {
        name: name.trim(),
        description: description.trim() || null,
        icon_color: iconColor,
        icon_letter: finalLetter,
      })

      addToast({
        title: 'Verse updated successfully',
        type: 'success',
      })
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
      addToast({
        title: err instanceof Error ? err.message : 'Failed to update verse',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (confirmNameInput !== verse.name) return

    setDeleting(true)
    try {
      await verseService.deleteVerse(verse.id)
      addToast({
        title: `Verse "${verse.name}" and all associated data deleted`,
        type: 'success',
      })
      setShowConfirmDelete(false)
      onClose()
      if (onSuccess) onSuccess()
      navigate('/')
    } catch (err) {
      console.error(err)
      addToast({
        title: err instanceof Error ? err.message : 'Failed to delete verse',
        type: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  const previewLetter = iconLetter.trim() || (name.trim().charAt(0).toUpperCase() || '?')

  const footer = (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSave}
        disabled={!name.trim() || loading}
        loading={loading}
      >
        Save Changes
      </Button>
    </div>
  )

  const deleteModalFooter = (
    <div className="flex items-center justify-end gap-2 w-full">
      <Button variant="ghost" onClick={() => setShowConfirmDelete(false)} disabled={deleting}>
        Cancel
      </Button>
      <Button
        variant="danger"
        onClick={handleDeleteConfirm}
        disabled={confirmNameInput !== verse.name || deleting}
        loading={deleting}
      >
        I understand, delete this verse
      </Button>
    </div>
  )

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Verse Settings" size="md" footer={footer}>
        <div className="flex flex-col gap-6">
          {/* Live Icon Preview */}
          <div className="flex flex-col items-center justify-center p-3 bg-[var(--color-bg-elevated)] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)]">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold uppercase transition-all duration-300"
              style={{ backgroundColor: iconColor }}
            >
              {previewLetter}
            </div>
            <span className="text-xs text-[var(--color-text-muted)] mt-2">Live Icon Preview</span>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            <Input
              label="Verse Name *"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. My Fantasy World"
              disabled={loading}
            />

            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your verse..."
              rows={3}
              disabled={loading}
            />

            <ColorPicker value={iconColor} onChange={setIconColor} label="Icon Color" />

            <Input
              label="Icon Letter"
              value={iconLetter}
              onChange={(e) => handleLetterChange(e.target.value)}
              placeholder="A-Z"
              maxLength={2}
              disabled={loading}
            />
          </div>

          {/* Danger Zone */}
          <div className="my-2">
            <Divider label="Danger Zone" className="my-4" />
            <div className="border border-[var(--color-error)]/30 rounded-[var(--radius-xl)] p-4 bg-[var(--color-error)]/5">
              <h4 className="text-sm font-semibold text-[var(--color-error)] mb-1">Delete Verse</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mb-4">
                Deleting this verse is irreversible. This will permanently delete the verse, all of its characters, lore entries, writings, and related data.
              </p>
              <Button
                variant="danger"
                className="w-full h-9 text-sm"
                onClick={() => setShowConfirmDelete(true)}
              >
                Delete Verse
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Nested Delete Confirmation Modal */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Confirm Delete Verse"
        size="sm"
        footer={deleteModalFooter}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--color-text-primary)] leading-normal">
            Are you absolutely sure you want to delete <span className="font-semibold text-[var(--color-text-primary)]">{verse.name}</span>? This action is irreversible.
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Type the verse name <span className="font-mono bg-[var(--color-bg-elevated)] px-1 py-0.5 rounded border border-[var(--color-border-subtle)]">{verse.name}</span> to confirm:
            </label>
            <Input
              value={confirmNameInput}
              onChange={(e) => setConfirmNameInput(e.target.value)}
              placeholder="Type verse name to confirm"
              className="font-semibold"
              disabled={deleting}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </>
  )
}
