import { useState, useEffect, useCallback } from 'react'
import { conversationService } from '../../../services/conversationService'
import type { Conversation, AIWorkspaceMode } from '../types'

export function useConversations(verseId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = useCallback(async () => {
    if (!verseId) {
      setConversations([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await conversationService.getConversations(verseId)
      setConversations(data)
    } catch (err: any) {
      console.error('Failed to load conversations:', err)
      setError(err.message || 'Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }, [verseId])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const createConversation = async (data: {
    title: string
    description?: string
    previous_conversation_id?: string | null
    mode?: AIWorkspaceMode
  }) => {
    if (!verseId) throw new Error('No active verse')
    setIsLoading(true)
    setError(null)
    try {
      const created = await conversationService.createConversation({
        verse_id: verseId,
        title: data.title,
        description: data.description,
        previous_conversation_id: data.previous_conversation_id || undefined,
        mode: data.mode,
      })
      setConversations((prev) => [created, ...prev])
      return created
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteConversation = async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const success = await conversationService.deleteConversation(id)
      if (success) {
        setConversations((prev) => prev.filter((c) => c.id !== id))
      } else {
        throw new Error('Deletion rejected by server')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateConversationTitle = async (id: string, title: string) => {
    try {
      const updated = await conversationService.updateConversation(id, { title })
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c))
      )
    } catch (err: any) {
      console.error('Failed to update conversation title:', err)
      throw err
    }
  }

  return {
    conversations,
    isLoading,
    error,
    refresh: loadConversations,
    createConversation,
    deleteConversation,
    updateConversationTitle,
  }
}
