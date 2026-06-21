import { useState, useEffect, useCallback } from 'react'
import { WritingPiece, Chapter } from '../types'
import * as writingService from '../../../services/writingService'

export function useWritingPiece(id: string | undefined) {
  const [piece, setPiece] = useState<WritingPiece | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPieceAndChapters = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const pieceData = await writingService.getWritingPiece(id)
      setPiece(pieceData)

      if (pieceData && pieceData.type === 'novel') {
        const chaptersData = await writingService.getChapters(id)
        setChapters(chaptersData)
      } else {
        setChapters([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch writing piece or chapters')
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchChapters = useCallback(async () => {
    if (!id || !piece || piece.type !== 'novel') return
    try {
      const chaptersData = await writingService.getChapters(id)
      setChapters(chaptersData)
    } catch (err) {
      console.error('Failed to refetch chapters:', err)
    }
  }, [id, piece])

  useEffect(() => {
    fetchPieceAndChapters()
  }, [id])

  const addChapter = useCallback(async (title?: string) => {
    if (!id) return null
    try {
      const newChapter = await writingService.createChapter({
        writing_piece_id: id,
        title,
        chapter_number: chapters.length + 1,
      })
      await fetchChapters()
      return newChapter
    } catch (err) {
      console.error('Failed to add chapter:', err)
      throw err
    }
  }, [id, chapters.length, fetchChapters])

  const deleteChapter = useCallback(async (chapterId: string) => {
    try {
      const success = await writingService.deleteChapter(chapterId)
      if (success) {
        await fetchChapters()
      }
      return success
    } catch (err) {
      console.error('Failed to delete chapter:', err)
      throw err
    }
  }, [fetchChapters])

  const reorderChapters = useCallback(async (chapterIds: string[]) => {
    try {
      const success = await writingService.reorderChapters(chapterIds)
      if (success) {
        await fetchChapters()
      }
      return success
    } catch (err) {
      console.error('Failed to reorder chapters:', err)
      throw err
    }
  }, [fetchChapters])

  return {
    piece,
    chapters,
    loading,
    error,
    refetch: fetchPieceAndChapters,
    refetchChapters: fetchChapters,
    addChapter,
    deleteChapter,
    reorderChapters,
  }
}
