import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, PanelRight, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react'
import { useLoreEntry } from '../hooks/useLoreEntry'
import { LoreEditor } from './LoreEditor'
import { LoreMetadataPanel } from './LoreMetadataPanel'
import { Button } from '../../../shared/components/ui/Button'
import { useUIStore } from '../../../store/uiStore'

export const LoreEntryPage: React.FC = () => {
  const { verseId, id } = useParams<{ verseId: string; id: string }>()
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const {
    entry,
    linkedCharacters,
    linkedLore,
    loading,
    saveStatus,
    error,
    updateField,
    updateArrayField,
  } = useLoreEntry(id || null)

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false)

  // Markdown Export Handler
  const handleExportMarkdown = () => {
    if (!entry) return
    setIsExportDropdownOpen(false)

    // Convert rich HTML to crude Markdown content or just download raw
    const mdContent = `# ${entry.title}\n\n**Category**: ${entry.category}\n${
      entry.summary ? `**Summary**: ${entry.summary}\n` : ''
    }\n${entry.tags?.length > 0 ? `**Tags**: ${entry.tags.join(', ')}\n` : ''}\n## Content\n\n${
      entry.content || '*No content documented yet.*'
    }\n`

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(mdContent)
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${entry.title.replace(/\s+/g, '_').toLowerCase()}_lore.md`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()

    addToast({
      title: 'Exported as Markdown',
      type: 'success',
    })
  }

  // JSON Export Handler
  const handleExportJSON = () => {
    if (!entry) return
    setIsExportDropdownOpen(false)

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entry, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${entry.title.replace(/\s+/g, '_').toLowerCase()}_lore.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()

    addToast({
      title: 'Exported as JSON',
      type: 'success',
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full select-none">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-primary)] mb-2" />
        <span className="text-[12px] text-[var(--color-text-muted)] font-medium">Loading lore entry...</span>
      </div>
    )
  }

  if (error || !entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-4 select-none">
        <div className="max-w-md w-full border border-[var(--color-error)]/20 bg-[var(--color-error-dim)] rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[var(--color-error)]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <h3 className="text-[14px] font-bold">Error Loading Entry</h3>
          </div>
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            {error || 'This lore entry does not exist or has been deleted.'}
          </p>
          <Button
            variant="ghost"
            onClick={() => navigate(`/verse/${verseId}/lore`)}
            className="self-start text-[11px] gap-1 px-3 h-8 mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Lore Index
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 py-6 w-full h-full min-h-[calc(100vh-80px)] select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4 gap-4">
        <button
          onClick={() => navigate(`/verse/${verseId}/lore`)}
          className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lore Index</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Export Action */}
          <div className="relative">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="h-8 px-3 rounded-md border border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-secondary)] cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-[var(--color-text-muted)]" />
            </button>

            {isExportDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setIsExportDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-40 rounded-lg border border-[var(--color-border-strong)]/30 bg-[var(--color-bg-floating)] p-1 shadow-xl z-50 animate-fade-in flex flex-col gap-0.5">
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full text-left px-3 py-1.5 rounded text-[11px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
                  >
                    Export as Markdown
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full text-left px-3 py-1.5 rounded text-[11px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors"
                  >
                    Export as JSON
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Toggle Metadata Sidebar */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`h-8 w-8 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
              isSidebarOpen
                ? 'bg-[var(--color-accent-primary-dim)] border-[var(--color-accent-primary)] text-[var(--color-text-primary)]'
                : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
            title="Toggle Sidebar Panel"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Edit Screen Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0 w-full">
        {/* Left column (Editor controls) */}
        <div className="flex-1 flex flex-col gap-5 w-full min-w-0">
          {/* Big borderless Title Input */}
          <input
            type="text"
            value={entry.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Untitled Lore Aspect..."
            className="text-2xl font-bold bg-transparent border-0 border-b border-transparent focus:border-[var(--color-border-default)]/30 focus:ring-0 px-0 pb-1 w-full text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none"
            style={{ fontFamily: 'inherit' }}
          />

          {/* Inline Summary Area */}
          <div className="flex flex-col gap-1 bg-[var(--color-bg-subtle)]/30 border border-[var(--color-border-subtle)]/40 rounded-xl p-3">
            <label className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Summary Preview
            </label>
            <textarea
              value={entry.summary || ''}
              onChange={(e) => updateField('summary', e.target.value)}
              placeholder="Provide a concise summary excerpt..."
              rows={2}
              className="w-full bg-transparent border-none p-0 text-[12px] text-[var(--color-text-secondary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-0 resize-none leading-relaxed"
            />
          </div>

          {/* Rich Tiptap Editor */}
          <LoreEditor
            initialContent={entry.content || ''}
            onChange={(html) => updateField('content', html)}
          />
        </div>

        {/* Right column (Metadata Sidebar) */}
        {isSidebarOpen && (
          <div className="w-full lg:w-[300px] shrink-0 border border-[var(--color-border-subtle)]/80 bg-[var(--color-bg-elevated)] p-4 rounded-2xl flex flex-col gap-6">
            <LoreMetadataPanel
              entry={entry}
              updateField={updateField}
              updateArrayField={updateArrayField}
              saveStatus={saveStatus}
              linkedCharacters={linkedCharacters}
              linkedLore={linkedLore}
            />
          </div>
        )}
      </div>
    </div>
  )
}
export default LoreEntryPage
