import { useState, useEffect } from 'react'
import { Modal } from '../../../shared/components/ui/Modal'
import { Input } from '../../../shared/components/ui/Input'
import { Textarea } from '../../../shared/components/ui/Textarea'
import { Button } from '../../../shared/components/ui/Button'
import { ColorPicker } from './ColorPicker'
import * as verseService from '../../../services/verseService'
import { useUIStore } from '../../../store/uiStore'

interface SubSeriesCreateModalProps {
  isOpen: boolean
  onClose: () => void
  verseId: string
  onSuccess?: () => void
}

export function SubSeriesCreateModal({ isOpen, onClose, verseId, onSuccess }: SubSeriesCreateModalProps) {
  const addToast = useUIStore((state) => state.addToast)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconColor, setIconColor] = useState('#7B5EA7')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setDescription('')
      setIconColor('#7B5EA7')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await verseService.createSubSeries({
        verse_id: verseId,
        name: name.trim(),
        description: description.trim() || undefined,
        icon_color: iconColor,
      })

      addToast({
        title: `Sub-series "${name.trim()}" created successfully`,
        type: 'success',
      })
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
      addToast({
        title: err instanceof Error ? err.message : 'Failed to create sub-series',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

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
        Create Sub-series
      </Button>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Sub-series" size="sm" footer={footer}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Spinoff Season 1"
          required
          autoFocus
          disabled={loading}
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your sub-series settings, timeline, etc..."
          rows={3}
          disabled={loading}
        />

        <ColorPicker value={iconColor} onChange={setIconColor} label="Color Tag" />
      </form>
    </Modal>
  )
}
