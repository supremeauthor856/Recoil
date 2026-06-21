import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SubSeries } from '../types'
import { Modal } from '../../../shared/components/ui/Modal'
import { Input } from '../../../shared/components/ui/Input'
import { Textarea } from '../../../shared/components/ui/Textarea'
import { Button } from '../../../shared/components/ui/Button'
import { Divider } from '../../../shared/components/ui/Divider'
import { ColorPicker } from './ColorPicker'
import * as verseService from '../../../services/verseService'
import { useUIStore } from '../../../store/uiStore'

interface SubSeriesEditModalProps {
  isOpen: boolean
  onClose: () => void
  subSeries: SubSeries
  onSuccess?: () => void
}

export function SubSeriesEditModal({ isOpen, onClose, subSeries, onSuccess }: SubSeriesEditModalProps) {
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const [name, setName] = useState(subSeries.name)
  const [description, setDescription] = useState(subSeries.description || '')
  const [iconColor, setIconColor] = useState(subSeries.icon_color || '#7B5EA7')
  const [saving, setSaving] = useState(false)

  // Deletion confirmations
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(subSeries.name)
      setDescription(subSeries.description || '')
      setIconColor(subSeries.icon_color || '#7B5EA7')
      setShowConfirmDelete(false)
    }
  }, [isOpen, subSeries])

  const handleUpdate = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      await verseService.updateSubSeries(subSeries.id, {
        name: name.trim(),
        description: description.trim() || null,
        icon_color: iconColor,
      })

      addToast({
        title: 'Sub-series updated successfully',
        type: 'success',
      })
      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
      addToast({
        title: err instanceof Error ? err.message : 'Failed to update sub-series',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await verseService.deleteSubSeries(subSeries.id)

      addToast({
        title: `Sub-series "${subSeries.name}" deleted successfully`,
        type: 'success',
      })
      setShowConfirmDelete(false)
      onClose()
      if (onSuccess) onSuccess()
      navigate(`/verse/${subSeries.verse_id}`)
    } catch (err) {
      console.error(err)
      addToast({
        title: err instanceof Error ? err.message : 'Failed to delete sub-series',
        type: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  const footer = (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleUpdate}
        disabled={!name.trim() || saving}
        loading={saving}
      >
        Save
      </Button>
    </div>
  )

  const deleteFooter = (
    <div className="flex items-center justify-end gap-2 w-full">
      <Button variant="ghost" onClick={() => setShowConfirmDelete(false)} disabled={deleting}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDelete} loading={deleting}>
        I understand, delete sub-series
      </Button>
    </div>
  )

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Sub-series" size="sm" footer={footer}>
        <div className="flex flex-col gap-5">
          <Input
            label="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Spinoff Season 1"
            disabled={saving}
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your sub-series settings, timeline, etc..."
            rows={3}
            disabled={saving}
          />

          <ColorPicker value={iconColor} onChange={setIconColor} label="Color Tag" />

          <div className="my-1">
            <Divider label="Danger Zone" className="my-3" />
            <Button
              variant="danger"
              className="w-full h-9 text-sm"
              style={{ backgroundColor: 'transparent', border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
              onClick={() => setShowConfirmDelete(true)}
              type="button"
            >
              Delete Sub-series
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for deletion */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Confirm Delete Sub-series"
        size="sm"
        footer={deleteFooter}
      >
        <p className="text-sm text-[var(--color-text-primary)] leading-normal">
          Are you sure you want to delete <span className="font-semibold">{subSeries.name}</span>? Characters belonging to this sub-series will have their sub-series link cleared (they won't be deleted). This is an irreversible action.
        </p>
      </Modal>
    </>
  )
}
