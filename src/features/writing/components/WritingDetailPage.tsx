import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Trash2, Calendar, FileText, ChevronRight, Feather } from 'lucide-react'
import { useWritingPiece } from '../hooks/useWritingPiece'
import { useWritingEditor } from '../hooks/useWritingEditor'
import { WritingEditor } from './WritingEditor'
import { ChapterList } from './ChapterList'
import { WritingMetadataPanel } from './WritingMetadataPanel'
import { Character } from '../../../shared/types/database'
import * as characterService from '../../../services/characterService'
import * as writingService from '../../../services/writingService'
import { ExportButton } from '../../export/components/ExportButton'

export const WritingDetailPage: React.FC = () => {
  const { verseId, pieceId } = useParams<{ verseId: string; pieceId: string }>()
  const navigate = useNavigate()

  // Primary piece and chapter management hook
  const {
    piece,
    chapters,
    loading,
    error,
    refetch,
    refetchChapters,
    addChapter,
    deleteChapter,
    reorderChapters,
  } = useWritingPiece(pieceId)

  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  
  // State for Distraction-free / Zen mode
  const [isZenMode, setIsZenMode] = useState<boolean>(() => {
    return localStorage.getItem('writing-zen-mode-preference') === 'true'
  })

  // Load verse characters for linking
  useEffect(() => {
    if (!verseId) return
    characterService.getCharacters({ verseId })
      .then(setCharacters)
      .catch((err) => console.error('Failed to load characters for linking:', err))
  }, [verseId])

  // Select first chapter automatically for novels
  useEffect(() => {
    if (piece && piece.type === 'novel' && chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(chapters[0].id)
    }
  }, [piece, chapters, selectedChapterId])

  const handleToggleZenMode = () => {
    setIsZenMode((prev) => {
      const next = !prev
      localStorage.setItem('writing-zen-mode-preference', String(next))
      return next
    })
  }

  // Determine current editing targets
  const activeChapter = chapters.find((c) => c.id === selectedChapterId)
  const initialEditorContent = piece?.type === 'novel' 
    ? (activeChapter ? activeChapter.content : null)
    : (piece ? piece.content : null)

  const activeChapterId = piece?.type === 'novel' ? selectedChapterId : null

  // Editor saving engine
  const { saveStatus, lastSaved, handleEditorUpdate } = useWritingEditor(
    pieceId || '',
    activeChapterId,
    initialEditorContent
  )

  const handleAddChapterClick = async () => {
    const titlePrompt = window.prompt('Enter chapter title (optional):')
    const finalTitle = titlePrompt?.trim() || undefined
    try {
      const newChapter = await addChapter(finalTitle)
      if (newChapter) {
        setSelectedChapterId(newChapter.id)
      }
    } catch (err) {
      alert('Failed to add chapter.')
    }
  }

  const handleUpdatePieceMeta = async (updatedData: any) => {
    if (!pieceId) return
    try {
      await writingService.updateWritingPiece(pieceId, updatedData)
      refetch()
    } catch (err) {
      console.error('Failed to update metadata:', err)
    }
  }

  const handleDeletePieceClick = async () => {
    if (!pieceId || !verseId) return
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${piece?.title}"?\nThis will permanently delete this writing piece, along with all its chapters, draft histories, and textual contents. This cannot be undone.`
    )
    if (confirmDelete) {
      try {
        const deleted = await writingService.deleteWritingPiece(pieceId)
        if (deleted) {
          navigate(`/verse/${verseId}/writing`)
        }
      } catch (err) {
        alert('Failed to delete writing piece.')
      }
    }
  }

  if (loading && !piece) {
    return (
      <div id="writing-detail-loading" className="flex h-screen items-center justify-center bg-bg-base text-text-secondary">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-primary border-t-transparent" />
          <span className="text-xs">Opening parchment...</span>
        </div>
      </div>
    )
  }

  if (error || !piece) {
    return (
      <div id="writing-detail-error" className="p-8 text-center text-text-primary bg-bg-base h-screen flex flex-col justify-center items-center gap-4">
        <div className="text-error font-medium">Error: {error || 'Writing piece not found'}</div>
        <Link
          to={`/verse/${verseId}/writing`}
          className="px-4 py-2 bg-bg-elevated hover:bg-bg-hover border border-border-default rounded-lg text-xs"
        >
          Return to Writing Studio
        </Link>
      </div>
    )
  }

  const isNovel = piece.type === 'novel'
  const needsCreateChapterPlaceholder = isNovel && chapters.length === 0

  return (
    <div id="writing-detail-page" className="flex flex-col h-[calc(100vh-48px)] bg-bg-base overflow-hidden">
      {/* Top Header Navigation Panel, hidden during severe Zen Mode if desired, but we can render a minimal bar */}
      {!isZenMode ? (
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border-default bg-bg-elevated/80 px-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-text-secondary min-w-0">
            <button
              id="back-to-studio-btn"
              onClick={() => navigate(`/verse/${verseId}/writing`)}
              className="flex items-center gap-1.5 rounded-md hover:bg-bg-hover p-1.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer shrink-0"
              title="Return to list"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <ChevronRight className="h-3 w-3 text-text-muted shrink-0" />
            <Link
              to={`/verse/${verseId}/writing`}
              className="hover:text-text-primary truncate shrink-0"
            >
              Writing Studio
            </Link>
            <ChevronRight className="h-3 w-3 text-text-muted shrink-0" />
            <span className="font-semibold text-text-primary truncate">{piece.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <ExportButton 
              scope={{ type: 'writing', piece, chapters }}
              title={`Export ${piece.title}`}
              allowedFormats={['epub', 'pdf', 'md', 'html', 'rtf', 'txt', 'fb2', 'fountain', 'json', 'yaml']} 
              className="h-7 text-xs bg-transparent border-border-default hover:bg-bg-hover text-text-secondary w-auto"
              iconOnly={true}
            />

            {/* Delete Piece Button */}
            <button
              id="delete-piece-btn"
              onClick={handleDeletePieceClick}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-error hover:bg-error-dim transition-colors cursor-pointer shrink-0"
              title="Delete entire writing piece"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete Piece</span>
            </button>
          </div>
        </div>
      ) : (
        /* Minimal Zen Mode Title Header to retain back escape navigation */
        <div className="flex h-9 shrink-0 items-center bg-bg-rail/40 px-4 justify-between border-b border-border-subtle">
          <button
            id="zen-back-btn"
            onClick={() => {
              if (saveStatus === 'saving') {
                const conf = window.confirm('Still auto-saving changes. Leave anyway?')
                if (!conf) return
              }
              navigate(`/verse/${verseId}/writing`)
            }}
            className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Studio</span>
          </button>
          <span className="text-[11px] font-mono text-text-muted select-none">{piece.title}</span>
          <div className="w-12 h-3" /> {/* Spacer spacer */}
        </div>
      )}

      {/* Main workspace layout */}
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Left chapter list (only for novels, hidden during Zen Mode) */}
        {isNovel && !isZenMode && (
          <ChapterList
            chapters={chapters}
            activeChapterId={selectedChapterId}
            onSelectChapter={setSelectedChapterId}
            onAddChapter={handleAddChapterClick}
            onDeleteChapter={deleteChapter}
            onReorderChapters={reorderChapters}
          />
        )}

        {/* Center TipTap content area */}
        <div id="workspace-center-area" className="flex-1 flex flex-col h-full overflow-hidden">
          {needsCreateChapterPlaceholder ? (
            /* Novel with no chapters placeholder */
            <div id="new-chapter-empty-state" className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-subtle/45">
              <div className="h-12 w-12 rounded-full bg-accent-primary-dim flex items-center justify-center border border-accent-primary mb-4 text-accent-highlight animate-pulse">
                <Feather className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Create your first chapter</h3>
              <p className="text-xs text-text-secondary max-w-xs mb-4">
                Novels group story lines inside nested chapters. Add a chapter first to launch the writing canvas.
              </p>
              <button
                id="workspace-add-first-chapter-btn"
                onClick={handleAddChapterClick}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent-primary hover:bg-accent-primary-hover text-text-primary px-4 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Create Chapter 1
              </button>
            </div>
          ) : (
            /* Editing Canvas */
            <WritingEditor
              initialContent={initialEditorContent}
              onUpdate={handleEditorUpdate}
              saveStatus={saveStatus}
              lastSaved={lastSaved}
              isZenMode={isZenMode}
              onToggleZenMode={handleToggleZenMode}
            />
          )}
        </div>

        {/* Right workspace metadata (hidden during Zen Mode) */}
        {!isZenMode && (
          <WritingMetadataPanel
            piece={piece}
            onUpdatePiece={handleUpdatePieceMeta}
            characters={characters}
          />
        )}
      </div>
    </div>
  )
}
export default WritingDetailPage
