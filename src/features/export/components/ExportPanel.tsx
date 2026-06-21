import React, { useState } from 'react'
import { Download, X, AlertCircle, Loader2 } from 'lucide-react'
import { useExport } from '../hooks/useExport'
import { FormatOptionGrid } from './FormatOptionGrid'
import type { ExportFormat, ExportScope } from '../types'

interface ExportPanelProps {
  isOpen: boolean
  onClose: () => void
  scope: ExportScope
  title: string
  subtitle?: string
  allowedFormats?: ExportFormat[]
}

export function ExportPanel({ isOpen, onClose, scope, title, subtitle, allowedFormats = [] }: ExportPanelProps) {
  const { isExporting, error, executeExport } = useExport()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleExport = async (format: ExportFormat) => {
    setSuccessMsg(null)
    const success = await executeExport(format, scope)
    if (success) {
      setSuccessMsg(`Successfully exported as ${format.toUpperCase()}.`)
      setTimeout(() => setSuccessMsg(null), 3000)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-2xl bg-[var(--color-bg-base)] border border-[var(--color-border-strong)]/30 rounded-[var(--radius-xl)] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0 bg-[var(--color-bg-elevated)]/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] flex items-center justify-center shrink-0">
              <Download size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-[18px] font-bold text-[var(--color-text-primary)] truncate tracking-tight">{title}</h2>
              {subtitle && <p className="text-[13px] text-[var(--color-text-secondary)] font-medium">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-full transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto scrollbar-custom bg-[var(--color-bg-base)] flex-1">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Export Failed</span>
                <span className="text-[13px] opacity-90">{error}</span>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-semibold text-[13px]">{successMsg}</span>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] mb-1">Select Format</h3>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Choose an export format from the available options below. The generated file will download automatically.
            </p>
          </div>

          <FormatOptionGrid
            formats={allowedFormats}
            availableFor={scope.type}
            onSelect={handleExport}
            isExporting={isExporting}
          />
        </div>

        {/* Footer Overlay when Exporting */}
        {isExporting && (
          <div className="absolute inset-0 z-10 bg-[var(--color-bg-base)]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <Loader2 size={40} className="text-[var(--color-accent-primary)] animate-spin mb-4" />
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Generating Export...</h3>
            <p className="text-[14px] text-[var(--color-text-secondary)] max-w-[280px]">
              Please wait while your files are assembled. For large scopes or EPUB/PDF formats, this may take a few moments.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
