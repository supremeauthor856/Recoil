import React, { useState, useRef, useEffect } from 'react'
import { FileText, Upload, AlertTriangle, Eye } from 'lucide-react'
import { GUIDELINE_CATEGORIES, GUIDELINE_CATEGORY_LABELS, GuidelineCategory } from '../types'
import { guidelineService } from '../../../services/guidelineService'
import { useUIStore } from '../../../store/uiStore'
import { Modal } from '../../../shared/components/ui/Modal'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { Textarea } from '../../../shared/components/ui/Textarea'

interface GuidelineUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
}

type TabType = 'paste' | 'upload'

export const GuidelineUploadModal: React.FC<GuidelineUploadModalProps> = ({
  isOpen,
  onClose,
  onAdded,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('paste')
  const [displayName, setDisplayName] = useState('')
  const [category, setCategory] = useState<GuidelineCategory>('general')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fileSelectedName, setFileSelectedName] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const addToast = useUIStore((state) => state.addToast)

  // Clear fields on close or open
  useEffect(() => {
    if (isOpen) {
      setActiveTab('paste')
      setDisplayName('')
      setCategory('general')
      setContent('')
      setFileSelectedName('')
      setErrorMessage('')
    }
  }, [isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setErrorMessage('Please select a valid .txt or .md text file.')
      return
    }

    setErrorMessage('')
    setFileSelectedName(file.name)
    
    // Automatically pre-fill display name if empty or default
    if (!displayName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      setDisplayName(cleanName)
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setContent(text || '')
    }
    reader.onerror = () => {
      setErrorMessage('Error reading the selected file.')
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    const trimmedContent = content.trim()
    if (!displayName.trim()) {
      setErrorMessage('Display name is required.')
      return
    }
    if (!trimmedContent) {
      setErrorMessage('Guideline content cannot be empty.')
      return
    }

    setIsSubmitting(true)

    try {
      await guidelineService.create({
        display_name: displayName.trim(),
        category,
        content: trimmedContent,
        filename: fileSelectedName || displayName.trim(),
      })

      addToast({
        title: 'Guidelines added successfully',
        type: 'success',
      })
      onAdded()
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save coordinates.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSaveDisabled = isSubmitting || !displayName.trim() || !content.trim()
  const contentCharCount = content.length
  const showLargeFileWarning = contentCharCount > 50000

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Writing Guidelines"
      size="lg" // 720px equivalent
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[750px] overflow-y-auto">
        {/* Custom Tab switcher */}
        <div className="flex border-b border-[var(--color-border-subtle)] pb-2 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('paste')
              setContent('')
              setFileSelectedName('')
            }}
            className={`px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors cursor-pointer focus:outline-none ${
              activeTab === 'paste'
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] border-b border-[var(--color-accent-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            Paste Text
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload')
              setContent('')
              setFileSelectedName('')
            }}
            className={`px-4 py-2 text-[12px] font-semibold rounded-lg transition-colors cursor-pointer focus:outline-none ${
              activeTab === 'upload'
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] border-b border-[var(--color-accent-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            Upload File
          </button>
        </div>

        {/* SHARED FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Display Name"
            placeholder="e.g. Character Voice Rules"
            value={displayName}
            required
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GuidelineCategory)}
              className="w-full h-[34px] px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)]/40 rounded-[var(--radius-md)] text-[12px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]/80 focus:ring-1 focus:ring-[var(--color-accent-primary)]/40 transition-shadow"
            >
              {GUIDELINE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[var(--color-bg-sidebar)]">
                  {GUIDELINE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PASTE TAB CONTENT */}
        {activeTab === 'paste' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Guidelines Content
            </label>
            <Textarea
              rows={16}
              value={content}
              placeholder="Paste your writing guidelines, notes, pacing limits, or character specifications here..."
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[280px] font-mono text-[12px] leading-relaxed resize-y scrollbar-custom"
            />
          </div>
        )}

        {/* UPLOAD TAB CONTENT */}
        {activeTab === 'upload' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Upload File (.txt, .md)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-[var(--color-border-strong)]/50 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload size={24} className="text-[var(--color-accent-primary)]" />
                <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                  {fileSelectedName ? `Selected: ${fileSelectedName}` : 'Click to choose file'}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  Plain text or Markdown documents up to 2MB
                </span>
              </div>
            </div>

            {/* PREVIEW FIELD */}
            {content && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center gap-1">
                  <Eye size={12} /> File Content Preview
                </span>
                <textarea
                  readOnly
                  rows={8}
                  value={content}
                  className="w-full p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-md text-[11px] font-mono text-[var(--color-text-muted)] focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* CHARACTERS INFO / WARNINGS */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex justify-between text-[11px] font-mono text-[var(--color-text-muted)] pl-1">
            <span>Size: {contentCharCount.toLocaleString()} characters</span>
          </div>

          {showLargeFileWarning && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-[var(--color-warning)] p-3 rounded-md">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">
                This file is very large and may slow down AI requests. Consider splitting it.
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-[var(--color-error)] p-3 rounded-md flex items-center gap-2 text-[11px]">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center gap-2 justify-end border-t border-[var(--color-border-subtle)]/70 pt-4 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaveDisabled}>
            {isSubmitting ? 'Saving...' : 'Save Guidelines'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
