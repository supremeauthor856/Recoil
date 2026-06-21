import { useState, useEffect, useCallback } from 'react'
import { conversationService } from '../../../services/conversationService'
import type { Conversation, ConversationMessage, ConversationChainEntry } from '../types'

export function useConversation(conversationId: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [chain, setChain] = useState<ConversationChainEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConversationData = useCallback(async () => {
    if (!conversationId) {
      setConversation(null)
      setMessages([])
      setChain([])
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const [convData, msgData, chainData] = await Promise.all([
        conversationService.getConversation(conversationId),
        conversationService.getMessages(conversationId),
        conversationService.getConversationChain(conversationId),
      ])

      setConversation(convData)
      setMessages(msgData)
      setChain(chainData)
    } catch (err: any) {
      console.error('Failed to load conversation:', err)
      setError(err.message || 'Failed to load conversation')
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    loadConversationData()
  }, [loadConversationData])

  const addMessageToState = (msg: ConversationMessage) => {
    setMessages((prev) => [...prev, msg])
  }

  const markLimitReached = async (summary: string) => {
    if (!conversationId) return
    try {
      await conversationService.markContextLimitReached(conversationId, summary)
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              is_context_limit_reached: true,
              summary,
            }
          : null
      )
      // refresh chain info
      const newChain = await conversationService.getConversationChain(conversationId)
      setChain(newChain)
    } catch (err) {
      console.error('Failed to mark limit reached:', err)
    }
  }

  return {
    conversation,
    messages,
    chain,
    isLoading,
    error,
    refresh: loadConversationData,
    addMessageToState,
    markLimitReached,
  }
}
