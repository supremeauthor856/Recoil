import { useState, useEffect, useRef, useCallback } from 'react'
import * as writingService from '../../../services/writingService'

export function useWritingEditor(
  pieceId: string,
  chapterId: string | null,
  initialContent: string | null
) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<number | null>(null)

  const timeoutRef = useRef<any>(null)
  const isFirstLoad = useRef(true)

  // When switching a chapter or piece, reset first-load gate and clear any timers
  useEffect(() => {
    isFirstLoad.current = true
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setSaveStatus('idle')
  }, [pieceId, chapterId])

  const handleEditorUpdate = useCallback((html: string) => {
    // If it's the first event after mount/switch, skip auto-saving the initial render content
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      return
    }

    setSaveStatus('saving')

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const wordCount = writingService.countWords(html)
        if (chapterId) {
          await writingService.updateChapter(chapterId, { content: html, word_count: wordCount })
        } else {
          await writingService.updateWritingPiece(pieceId, { content: html, word_count: wordCount })
        }
        setSaveStatus('saved')
        setLastSaved(Date.now())
        
        // Hide saved indicator after 2.5 seconds
        setTimeout(() => {
          setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev))
        }, 2500)
      } catch (err) {
        console.error('Auto-save error:', err)
        setSaveStatus('error')
      }
    }, 2000)
  }, [pieceId, chapterId])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    saveStatus,
    lastSaved,
    handleEditorUpdate,
  }
}
