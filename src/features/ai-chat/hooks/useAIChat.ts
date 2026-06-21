import { useState } from 'react'
import { streamAI, estimateTokens } from '../../../services/aiService'
import { conversationService } from '../../../services/conversationService'
import type { Conversation, ConversationMessage, AIWorkspaceMode, VerseContextPackage } from '../types'

interface UseAIChatOptions {
  conversationId: string | null
  mode: AIWorkspaceMode
  contextPackage: VerseContextPackage | null
  existingMessages: ConversationMessage[]
  addMessageToState: (msg: ConversationMessage) => void
  onUpdateStats: () => void // triggers reloading the conversation and stats
}

export function useAIChat({
  conversationId,
  mode,
  contextPackage,
  existingMessages,
  addMessageToState,
  onUpdateStats,
}: UseAIChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const getSystemPrompt = (workspaceMode: AIWorkspaceMode, context: VerseContextPackage | null) => {
    let basePrompt = ''
    switch (workspaceMode) {
      case 'oracle':
        basePrompt =
          'You are an all-knowing lore keeper and oracle of this verse. Answer any questions about the world, history, factions, and rules in an elegant, descriptive, and in-universe-oriented manner.'
        break
      case 'brainstorm':
        basePrompt =
          'You are an energetic creative ideator. Generate unique plot hooks, interesting character concepts, and unexpected story twists. Structure ideas clearly with bullet points, being inventive and bold.'
        break
      case 'novel-writing':
        basePrompt =
          'You are a professional, peerless novelist. Collaborate with the user to write their story chapter-by-chapter. Follow their guidelines closely, maintain consistent characters, construct vivid imagery, and write rich narrative text.'
        break
      case 'chat':
      default:
        basePrompt =
          'You are a friendly, creative co-writer and story assistant. Analyze the verse context and help the writer develop their ideas, answer questions, and construct scenes.'
        break
    }

    if (context) {
      basePrompt += `\n\n=== VERSE LORE & ENVIRONMENT ===\n${context.verseOverview}\n\n=== KEY CHARACTERS ===\n${context.characterSummaries}\n\n=== CHARACTERS DETAILED PROFILES ===\n${context.detailedProfiles}\n\n=== CHARACTER RELATIONSHIPS ===\n${context.relationshipSummary}`
      if (context.previousSummaries && context.previousSummaries !== 'No historical context summaries available.') {
        basePrompt += `\n\n=== HISTORICAL LOGS/CHRONICLES OF PREVIOUS SEGMENTS ===\n${context.previousSummaries}`
      }
    }

    return basePrompt
  }

  const sendMessage = async (userContent: string) => {
    if (!conversationId) {
      setError('No active conversation selected.')
      return
    }
    if (!userContent.trim()) return

    setIsStreaming(true)
    setError(null)
    setStreamingContent('')

    try {
      // 1. Save user message to database
      const userMsgTokenCount = estimateTokens(userContent)
      const savedUserMsg = await conversationService.saveMessage({
        conversation_id: conversationId,
        role: 'user',
        content: userContent,
        token_count: userMsgTokenCount,
      })

      // 2. Add to local state
      addMessageToState(savedUserMsg)

      // 3. Build message history for the AI Service
      const systemPrompt = getSystemPrompt(mode, contextPackage)
      const aiMessages = [
        ...existingMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: userContent },
      ]

      let assistantResponseBuffer = ''

      // 4. Trigger streaming
      const aiResult = await streamAI(
        {
          taskType: mode === 'novel-writing' ? 'novelWriting' : mode === 'oracle' ? 'oracle' : mode === 'brainstorm' ? 'brainstormRoom' : 'longConversation',
          systemPrompt,
          messages: aiMessages,
          injectGuidelines: true,
        },
        (chunk: string) => {
          assistantResponseBuffer += chunk
          setStreamingContent(assistantResponseBuffer)
        }
      )

      // 5. Save assistant message to database when stream completes
      const assistantMsgTokenCount = estimateTokens(assistantResponseBuffer)
      const savedAssistantMsg = await conversationService.saveMessage({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantResponseBuffer,
        token_count: assistantMsgTokenCount,
        provider: aiResult.provider,
        model: aiResult.model,
      })

      // 6. Add assistant message to state
      addMessageToState(savedAssistantMsg)

      // 7. Update conversation logs metrics info
      const totalMessagesNum = existingMessages.length + 2
      const newTokensUsed =
        (existingMessages.reduce((sum, m) => sum + (m.token_count || 0), 0)) +
        userMsgTokenCount +
        assistantMsgTokenCount

      await conversationService.updateConversationStats(
        conversationId,
        totalMessagesNum,
        newTokensUsed,
        aiResult.provider,
        aiResult.model
      )

      onUpdateStats()
    } catch (err: any) {
      console.error('AI Stream Error:', err)
      setError(err.message || 'An error occurred during generating content.')
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }

  return {
    sendMessage,
    isStreaming,
    streamingContent,
    error,
  }
}
