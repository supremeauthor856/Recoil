import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../../../shared/components/ui/Modal'
import { Input } from '../../../shared/components/ui/Input'
import { Textarea } from '../../../shared/components/ui/Textarea'
import { Button } from '../../../shared/components/ui/Button'
import { ColorPicker } from './ColorPicker'
import * as verseService from '../../../services/verseService'
import { useUIStore } from '../../../store/uiStore'

interface VerseCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function VerseCreateModal({ isOpen, onClose, onSuccess }: VerseCreateModalProps) {
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconColor, setIconColor] = useState('#7B5EA7')
  const [iconLetter, setIconLetter] = useState('')
  const [isManualLetter, setIsManualLetter] = useState(false)
  const [loading, setLoading] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setDescription('')
      setIconColor('#7B5EA7')
      setIconLetter('')
      setIsManualLetter(false)
    }
  }, [isOpen])

  // Auto-populate letter as name is typed
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const finalLetter = iconLetter.trim() || name.trim().charAt(0).toUpperCase()
      const created = await verseService.createVerse({
        name: name.trim(),
        description: description.trim() || undefined,
        icon_color: iconColor,
        icon_letter: finalLetter,
      })

      addToast({
        title: `Verse "${created.name}" created successfully`,
        type: 'success',
      })
      onClose()
      if (onSuccess) onSuccess()
      navigate(`/verse/${created.id}`)
    } catch (err) {
      console.error(err)
      addToast({
        title: err instanceof Error ? err.message : 'Failed to create verse',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const previewLetter = iconLetter.trim() || (name.trim().charAt(0).toUpperCase() || '?')

  const footer = (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" onClick={onClose} disabled={loading} type="button">
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!name.trim() || loading}
        loading={loading}
        type="button"
      >
        Create Verse
      </Button>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Verse" size="sm" footer={footer}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

        {/* Name */}
        <Input
          label="Name *"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. My Fantasy World"
          required
          autoFocus
          disabled={loading}
        />

        {/* Description */}
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your verse, its themes, setting, etc..."
          rows={3}
          disabled={loading}
        />

        {/* Color Picker */}
        <ColorPicker value={iconColor} onChange={setIconColor} label="Icon Color" />

        {/* Icon Letter */}
        <Input
          label="Icon Letter"
          value={iconLetter}
          onChange={(e) => handleLetterChange(e.target.value)}
          placeholder="A-Z"
          maxLength={2}
          disabled={loading}
        />
      </form>
    </Modal>
  )
}
