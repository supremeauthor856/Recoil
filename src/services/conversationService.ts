import { api } from './api'
import type { Conversation, ConversationMessage, ConversationChainEntry } from '../features/ai-chat/types'

function parseConversation(raw: Record<string, unknown>): Conversation {
  return {
    ...raw,
    is_context_limit_reached:
      raw.is_context_limit_reached === 1 || raw.is_context_limit_reached === true,
  } as unknown as Conversation
}

export const conversationService = {
  async getConversations(verseId: string): Promise<Conversation[]> {
    const result = await api.get<Record<string, unknown>[]>(
      `/ai/conversations?verseId=${verseId}`
    )
    return result.data?.map(parseConversation) ?? []
  },

  async getConversation(id: string): Promise<Conversation | null> {
    const result = await api.get<Record<string, unknown>>(`/ai/conversations/${id}`)
    if (!result.success || !result.data) return null
    return parseConversation(result.data)
  },

  async getConversationChain(id: string): Promise<ConversationChainEntry[]> {
    // Walk back through previous_conversation_id links
    // Returns chain in chronological order (oldest first)
    const result = await api.get<ConversationChainEntry[]>(
      `/ai/conversations/${id}/chain`
    )
    return result.data ?? []
  },

  async createConversation(data: {
    verse_id?: string
    title?: string
    description?: string
    previous_conversation_id?: string
    mode?: string
  }): Promise<Conversation> {
    const result = await api.post<Record<string, unknown>>('/ai/conversations', data)
    if (!result.success || !result.data) throw new Error(result.error ?? 'Create failed')
    return parseConversation(result.data)
  },

  async updateConversation(
    id: string,
    data: Partial<Conversation>
  ): Promise<Conversation> {
    const result = await api.put<Record<string, unknown>>(
      `/ai/conversations/${id}`, data
    )
    if (!result.success || !result.data) throw new Error(result.error ?? 'Update failed')
    return parseConversation(result.data)
  },

  async deleteConversation(id: string): Promise<boolean> {
    const result = await api.delete<unknown>(`/ai/conversations/${id}`)
    return result.success
  },

  async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    const result = await api.get<ConversationMessage[]>(
      `/ai/messages?conversationId=${conversationId}`
    )
    return result.data ?? []
  },

  async saveMessage(data: {
    conversation_id: string
    role: 'user' | 'assistant'
    content: string
    token_count?: number
    provider?: string | null
    model?: string | null
  }): Promise<ConversationMessage> {
    const result = await api.post<ConversationMessage>('/ai/messages', data)
    if (!result.success || !result.data) throw new Error(result.error ?? 'Save failed')
    return result.data
  },

  async updateConversationStats(
    id: string,
    totalMessages: number,
    totalTokensUsed: number,
    providerUsed?: string | null,
    modelUsed?: string | null
  ): Promise<void> {
    await api.put(`/ai/conversations/${id}`, {
      total_messages: totalMessages,
      total_tokens_used: totalTokensUsed,
      provider_used: providerUsed,
      model_used: modelUsed,
    })
  },

  async markContextLimitReached(id: string, summary: string): Promise<void> {
    await api.put(`/ai/conversations/${id}`, {
      is_context_limit_reached: true,
      summary,
    })
  },
}
