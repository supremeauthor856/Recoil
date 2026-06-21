import React, { useState, useRef } from 'react'
import { Upload, FileText, AlertTriangle, Loader2 } from 'lucide-react'
import { useFileReader, ReadResult } from '../hooks/useFileReader'

interface FileDropZoneProps {
  onFileRead: (result: ReadResult) => void
  fileWarning: string | null
  setFileWarning: (warning: string | null) => void
}

export function FileDropZone({ onFileRead, fileWarning, setFileWarning }: FileDropZoneProps) {
  const [pasteMode, setPasteMode] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { readFile, readText, isReading, readError } = useFileReader()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const res = await readFile(files[0])
      if (res) {
        setFileWarning(res.warning ?? null)
        onFileRead(res)
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const res = await readFile(files[0])
      if (res) {
        setFileWarning(res.warning ?? null)
        onFileRead(res)
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleAnalyzeText = async () => {
    if (!pastedText.trim()) return
    const res = await readText(pastedText)
    setFileWarning(res.warning ?? null)
    onFileRead(res)
  }

  return (
    <div className="w-full space-y-5">
      {/* Segmented Control Tab Row */}
      <div className="flex border border-[var(--color-border-subtle)]/30 rounded-xl p-1 bg-[var(--color-bg-subtle)] w-full max-w-sm">
        <button
          type="button"
          onClick={() => setPasteMode(false)}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all min-h-[44px] flex items-center justify-center ${
            !pasteMode
              ? 'bg-[var(--color-bg-elevated)] shadow-sm text-indigo-400 font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setPasteMode(true)}
          className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all min-h-[44px] flex items-center justify-center ${
            pasteMode
              ? 'bg-[var(--color-bg-elevated)] shadow-sm text-indigo-400 font-bold'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Paste Text
        </button>
      </div>

      {/* Render selected mode */}
      {!pasteMode ? (
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.markdown,.html,.json,.docx,.pdf"
            className="hidden"
          />
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`h-[220px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-[var(--color-border-subtle)]/40 bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-subtle)]/80 hover:border-[var(--color-border-subtle)]/70'
            }`}
          >
            {isReading ? (
              <div className="space-y-3 flex flex-col items-center">
                <Loader2 className="animate-spin text-indigo-500" size={36} />
                <span className="text-xs font-mono text-[var(--color-text-secondary)] tracking-wider">READING FILE DATA...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-indigo-950/40 border border-indigo-700/35 flex items-center justify-center mx-auto text-indigo-400">
                  <Upload size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Drop a file here</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">or click to browse your system</p>
                </div>
              </div>
            )}
          </div>

          {/* Formats info bar */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-1 text-[11px] text-[var(--color-text-muted)] font-mono">
            <span className="flex items-center gap-1"><FileText size={12} /> TXT</span>
            <span className="flex items-center gap-1"><FileText size={12} /> Markdown</span>
            <span className="flex items-center gap-1"><FileText size={12} /> HTML</span>
            <span className="flex items-center gap-1"><FileText size={12} /> JSON Backup</span>
            <span className="flex items-center gap-1"><FileText size={12} /> DOCX</span>
            <span className="flex items-center gap-1"><FileText size={12} /> PDF (limited)</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={isReading}
            placeholder="Paste your text here — character profiles, story documents, lore notes, anything..."
            className="w-full min-h-[220px] p-4 text-xs font-mono bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/30 rounded-2xl focus:border-indigo-500 focus:outline-none text-[var(--color-text-primary)] leading-relaxed resize-y shadow-inner placeholder:text-[var(--color-text-muted)]/70 placeholder:font-sans"
          />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              {pastedText.length.toLocaleString()} characters
            </span>

            <button
              type="button"
              onClick={handleAnalyzeText}
              disabled={isReading || !pastedText.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold text-white rounded-xl transition-all shadow-sm flex items-center gap-2 min-h-[44px]"
            >
              {isReading ? (
                <>
                  <Loader2 className="animate-spin" size={13} />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Analyze Text</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Warnings & Errors */}
      {fileWarning && (
        <div className="p-4 bg-amber-950/20 border border-amber-600/30 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={15} />
          <p className="text-xs text-amber-300 leading-relaxed">{fileWarning}</p>
        </div>
      )}

      {readError && (
        <div className="p-4 bg-rose-950/20 border border-rose-600/30 rounded-2xl flex items-start gap-4 animate-fade-in">
          <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={15} />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-rose-300">File Reading Failed</p>
            <p className="text-xs text-rose-400">{readError}</p>
          </div>
        </div>
      )}
    </div>
  )
}
