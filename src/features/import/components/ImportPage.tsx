import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useImport } from '../hooks/useImport'
import { getVerse } from '../../../services/verseService'
import { FileDropZone } from './FileDropZone'
import { ImportPreview } from './ImportPreview'
import { ImportProgressModal } from './ImportProgressModal'
import { ImportResultSummary } from './ImportResultSummary'
import { Verse } from '../../verse/types'
import { Sparkles, ArrowLeft, Loader2, AlertTriangle, ChevronRight, CornerDownRight, FileText, ChevronDown, ChevronUp } from 'lucide-react'

export default function ImportPage() {
  const { verseId = '' } = useParams<{ verseId: string }>()
  const [verse, setVerse] = useState<Verse | null>(null)
  const [isVerseLoading, setIsVerseLoading] = useState(true)
  const [fileWarning, setFileWarning] = useState<string | null>(null)
  const [showRawResponse, setShowRawResponse] = useState(false)

  const {
    status,
    fileName,
    fileType,
    fileContent,
    extraction,
    extractionError,
    rawAIResponse,
    existingCharacters,
    duplicates,
    importSummary,
    isRecoilBackup,
    importedSoFar,
    onFileReceived,
    extract,
    toggleItem,
    resolveDuplicate,
    startImport,
    reset,
  } = useImport(verseId)

  // Load verse details
  useEffect(() => {
    async function loadVerse() {
      if (!verseId) return
      try {
        setIsVerseLoading(true)
        const v = await getVerse(verseId)
        setVerse(v)
      } catch (err) {
        console.error('Error loading verse:', err)
      } finally {
        setIsVerseLoading(false)
      }
    }
    loadVerse()
  }, [verseId])

  if (isVerseLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-500" size={28} />
        <span className="text-xs font-mono text-[var(--color-text-secondary)] mt-3 tracking-wider uppercase">Loading Verse...</span>
      </div>
    )
  }

  if (!verse) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <AlertTriangle className="text-rose-500 mx-auto" size={40} />
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Verse Not Found</h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          The verse ID provided in the URL does not match any verse in your local database.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl transition-all"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-custom p-6 sm:p-8 space-y-6">
      {/* Navigation Breadcrumbs Header */}
      <div className="flex items-center gap-2.5 text-xs font-mono select-none">
        <Link to={`/verse/${verseId}`} className="text-[var(--color-text-muted)] hover:text-indigo-400 transition-colors">
          {verse.name}
        </Link>
        <ChevronRight size={12} className="text-[var(--color-text-muted)]/30" />
        <span className="text-[var(--color-text-primary)] font-bold">Import & Auto-fill</span>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Dynamic State Layout Routing */}

        {/* 1. IDLE STATE: Upload file */}
        {status === 'idle' && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-[var(--color-text-primary)] tracking-tight">Import & Auto-fill</h1>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Connect documents to your database instantly. Upload outlines, manuscript chapters, character notes, or worldbuilding files, and our companion AI will parse out characters, traits, relationships, and lore.
              </p>
            </div>

            <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/35 rounded-3xl p-6 sm:p-8 shadow-sm">
              <FileDropZone
                onFileRead={onFileReceived}
                fileWarning={fileWarning}
                setFileWarning={setFileWarning}
              />
            </div>
          </div>
        )}

        {/* 2. PENDING EXTRACTION STATE: File received but not yet parsed */}
        {status === 'reviewing' && !extraction && (
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/40 rounded-3xl p-6 sm:p-8 shadow-sm animate-fade-in space-y-6 select-none">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-2xl text-indigo-400 shrink-0">
                <FileText size={22} />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Ready for Extraction Analysis</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  We successfully read your file contents. Click below to begin extracting database fields using the companion AI.
                </p>
              </div>
            </div>

            {/* Read data indicators */}
            <div className="p-4 bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/15 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-muted)] font-mono text-[10px] uppercase">File Name:</span>
                <span className="font-bold text-[var(--color-text-primary)] font-mono truncate max-w-md">{fileName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-muted)] font-mono text-[10px] uppercase">Type Detected:</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-mono text-[10px] uppercase font-bold border border-indigo-500/15">
                  {fileType}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-muted)] font-mono text-[10px] uppercase">Length read:</span>
                <span className="font-mono text-[var(--color-text-primary)]">{(fileContent?.length ?? 0).toLocaleString()} characters</span>
              </div>
            </div>

            {/* Launch prompts */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2 border-t border-[var(--color-border-subtle)]/15 justify-end">
              <button
                type="button"
                onClick={reset}
                className="px-5 py-2 hover:bg-[var(--color-bg-hover)] rounded-xl border border-[var(--color-border-subtle)]/25 text-xs font-semibold text-[var(--color-text-secondary)] min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                Choose Another File
              </button>

              <button
                type="button"
                onClick={extract}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
              >
                <Sparkles size={14} className="animate-pulse text-indigo-200" />
                <span>Extract Literature Data</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. ACTIVE EXTRACTING STATE: Spinner page detailing AI activity */}
        {status === 'extracting' && (
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/35 rounded-3xl p-10 shadow-sm text-center space-y-6 flex flex-col items-center justify-center select-none animate-fade-in min-h-[300px]">
            <div className="relative w-14 h-14 bg-indigo-950/25 border border-indigo-500/10 rounded-full flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-500" size={26} />
              <Sparkles className="absolute top-1 right-1 text-indigo-400 animate-pulse" size={12} />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Extracting Narrative Anatomy</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Gemini is cataloging profiles, relationship vectors, lore category rules, and outlines from your uploaded prose...
              </p>
            </div>
          </div>
        )}

        {/* 4. EXTRACATION ERROR STATE: Beautiful card error handler */}
        {status === 'error' && (
          <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in text-left">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-950/20 border border-rose-500/10 rounded-2xl text-rose-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-400">Extraction Extraction Halted</h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  The parser model hit an error while trying to process this segment. Review details below:
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-950/10 border border-rose-600/20 rounded-2xl text-xs text-rose-300 font-mono whitespace-pre-wrap leading-relaxed">
              {extractionError}
            </div>

            {/* Debug panel toggle for raw response */}
            {rawAIResponse && (
              <div className="border border-[var(--color-border-subtle)]/15 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRawResponse(!showRawResponse)}
                  className="flex items-center justify-between w-full p-4 bg-[var(--color-bg-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <span>Show Raw AI Response (Debug Panel)</span>
                  {showRawResponse ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showRawResponse && (
                  <pre className="p-4 bg-black/40 text-[10px] font-mono text-gray-400 overflow-x-auto select-all max-h-[220px] scrollbar-custom border-t border-[var(--color-border-subtle)]/10">
                    {rawAIResponse}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 justify-end pt-2 border-t border-[var(--color-border-subtle)]/15">
              <button
                type="button"
                onClick={reset}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-sm min-h-[44px]"
              >
                Go Back & Retry
              </button>
            </div>
          </div>
        )}

        {/* 5. PREVIEW STATE: Render the visual board check table */}
        {status === 'reviewing' && extraction && (
          <ImportPreview
            extraction={extraction}
            duplicates={duplicates}
            existingCharacters={existingCharacters}
            toggleItem={toggleItem}
            resolveDuplicate={resolveDuplicate}
            startImport={startImport}
            isRecoilBackup={isRecoilBackup}
            onCancel={reset}
          />
        )}

        {/* 6. IMMERSIVE COMPLETED SUMMARY STATE */}
        {status === 'complete' && importSummary && (
          <ImportResultSummary
            summary={importSummary}
            onImportAnother={reset}
            verseId={verseId}
          />
        )}
      </div>

      {/* 7. BLOCKING SEQUENTIAL TRANSACTION OVERLAY */}
      <ImportProgressModal
        isOpen={status === 'importing'}
        status={status}
        extraction={extraction}
        importedSoFar={importedSoFar}
      />
    </div>
  )
}
