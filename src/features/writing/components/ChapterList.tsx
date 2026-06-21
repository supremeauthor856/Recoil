import React, { useState } from 'react'
import { Plus, Trash2, GripVertical, FileText, Sparkles } from 'lucide-react'
import { Chapter } from '../types'

interface ChapterListProps {
  chapters: Chapter[]
  activeChapterId: string | null
  onSelectChapter: (id: string) => void
  onAddChapter: () => void
  onDeleteChapter: (id: string) => void
  onReorderChapters: (chapterIds: string[]) => void
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  onReorderChapters,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const reorderedIds = chapters.map((c) => c.id)
    const [draggedId] = reorderedIds.splice(draggedIndex, 1)
    reorderedIds.splice(index, 0, draggedId)

    onReorderChapters(reorderedIds)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDeleteClick = (e: React.MouseEvent, chapter: Chapter) => {
    e.stopPropagation()
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${chapter.title || `Chapter ${chapter.chapter_number}`}"?\nThis action is irreversible and all chapter text will be lost permanently.`
    )
    if (confirmDelete) {
      onDeleteChapter(chapter.id)
    }
  }

  return (
    <div
      id="chapter-list-sidebar"
      className="flex flex-col w-64 bg-bg-sidebar border-r border-border-default h-full"
    >
      {/* Chapter Sidebar Header */}
      <div className="flex h-12 items-center justify-between border-b border-border-default px-4 py-2 bg-bg-rail/20">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent-highlight" />
          Chapters
        </span>
        <button
          id="add-chapter-btn"
          onClick={onAddChapter}
          className="rounded-md border border-border-default hover:bg-bg-hover hover:border-border-strong p-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          title="Add new chapter"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Chapters list body */}
      <div
        id="chapters-list-scroller"
        className="flex-1 overflow-y-auto scrollbar-custom p-2 space-y-1.5"
      >
        {chapters.length === 0 ? (
          <div id="no-chapters-prompt" className="p-4 text-center text-xs text-text-muted italic">
            No chapters created yet. Click "+" to start writing.
          </div>
        ) : (
          chapters.map((chapter, idx) => {
            const isActive = chapter.id === activeChapterId
            const isDragging = idx === draggedIndex
            const isDragOver = idx === dragOverIndex

            return (
              <div
                key={chapter.id}
                id={`chapter-item-${chapter.id}`}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectChapter(chapter.id)}
                className={`group flex items-center justify-between rounded-lg p-2.5 cursor-grab border select-none transition-all duration-150 ${
                  isActive
                    ? 'bg-accent-primary-dim border-accent-primary text-text-primary'
                    : isDragging
                    ? 'opacity-40 bg-bg-hover border-border-strong border-dashed'
                    : 'bg-bg-base/60 border-border-subtle hover:bg-bg-hover hover:border-border-default text-text-secondary hover:text-text-primary'
                } ${isDragOver ? 'border-t-2 border-t-accent-highlight' : ''}`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Grip Handle */}
                  <span className="text-text-muted group-hover:text-text-secondary cursor-row-resize shrink-0 p-0.5">
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>

                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-semibold truncate leading-none">
                      {chapter.title || `Chapter ${chapter.chapter_number}`}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
                      <FileText className="h-2.5 w-2.5" />
                      <span>{chapter.word_count.toLocaleString()} words</span>
                    </div>
                  </div>
                </div>

                {/* Delete trigger */}
                <button
                  id={`delete-chapter-${chapter.id}`}
                  onClick={(e) => handleDeleteClick(e, chapter)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error hover:bg-error-dim rounded-md transition-all shrink-0 cursor-pointer"
                  title="Delete chapter"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
export default ChapterList
