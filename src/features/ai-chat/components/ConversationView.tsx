import React, { useEffect, useRef } from 'react'
import { Eye, Bot, Cpu, AlertTriangle } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { ConversationChainBanner } from './ConversationChainBanner'
import { ContextWindowIndicator } from './ContextWindowIndicator'
import type { Conversation, ConversationMessage, ConversationChainEntry, VerseContextPackage, AIWorkspaceMode } from '../types'

interface ConversationViewProps {
  conversation: Conversation | null
  messages: ConversationMessage[]
  chain: ConversationChainEntry[]
  contextPackage: VerseContextPackage | null
  isStreaming: boolean
  streamingContent: string
  error: string | null
  onSendMessage: (text: string, option: 'general' | 'low-latency' | 'thinking') => void
  onSelectSegment: (id: string) => void
  onSummarizeTrigger: () => void
}

export function ConversationView({
  conversation,
  messages,
  chain,
  contextPackage,
  isStreaming,
  streamingContent,
  error,
  onSendMessage,
  onSelectSegment,
  onSummarizeTrigger,
}: ConversationViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages or active streaming content chunks
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, isStreaming])

  if (!conversation) {
    return (
      <div id="conv-view-empty" className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-950/20 text-center h-full border border-gray-900/40 rounded-xl select-text">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-center mb-4 animate-bounce">
          <Bot className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">No session loaded</h2>
        <p className="text-xs text-gray-400 max-w-sm mt-1 leading-relaxed">
          Select an existing session from the history sidebar, or initialize a fresh cognitive co-writing session to develop your verse.
        </p>
      </div>
    )
  }

  const detectedMode: AIWorkspaceMode = conversation.mode || (conversation.title?.toLowerCase().includes('oracle') ? 'oracle' : conversation.title?.toLowerCase().includes('brainstorm') ? 'brainstorm' : conversation.title?.toLowerCase().includes('novel') ? 'novel-writing' : 'chat')

  // Estimating consumed tokens for current segment
  const currentUsedTokens = conversation.total_tokens_used || 0
  const modelContextWindow = 1000000 // default to 1M for Gemini Flash model

  return (
    <div id={`conversation-view-${conversation.id}`} className="flex-1 flex flex-col h-full bg-gray-950/25 border border-gray-900/60 rounded-xl overflow-hidden shadow-2xl">
      {/* 1. Timeline Chained Banner (displays if chain exists) */}
      <div id="conv-view-chain" className="p-3 border-b border-gray-900 bg-gray-950/40">
        <ConversationChainBanner
          chain={chain}
          currentSegmentId={conversation.id}
          onSelectSegment={onSelectSegment}
        />
        {chain.length <= 1 && (
          <div className="flex items-center gap-2 px-1 text-xs text-gray-400">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-white">Active Segment:</span>
            <span className="text-gray-400 font-mono text-[11px] bg-gray-900/30 px-1.5 py-0.5 rounded border border-gray-800">
              {conversation.title || 'Untitled Session'}
            </span>
            <span className="text-gray-550 ml-auto font-mono text-[10px]">Independent Logs</span>
          </div>
        )}
      </div>

      {/* 2. Scrollable Message Feed Container */}
      <div id="conv-messages-feed" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-10 space-y-3 max-w-md mx-auto">
            <Cpu className="w-10 h-10 text-indigo-400/80 mx-auto animate-pulse" />
            <h3 className="text-sm font-semibold text-white">Initializing cognitive bridge...</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              We have compiled details of your active characters and relationships. Send a message below to begin developing your story.
            </p>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}

        {/* Streaming Placeholder */}
        {isStreaming && streamingContent && (
          <div id="streaming-bubble-placeholder">
            <MessageBubble
              message={{
                id: 'streaming-holder',
                conversation_id: conversation.id,
                role: 'assistant',
                content: streamingContent,
                token_count: 0,
                provider: conversation.provider_used || 'AI',
                model: conversation.model_used || 'Thinking...',
                created_at: Date.now(),
              }}
            />
          </div>
        )}

        {error && (
          <div id="chat-stream-error" className="flex items-center gap-2 p-3 bg-rose-950/20 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* 3. Bottom Utility: Horizontal indicator bar & Input composing */}
      <div id="conv-view-inputs" className="p-4 border-t border-gray-900 bg-gray-950/30 space-y-3">
        {/* Token indicator */}
        <ContextWindowIndicator
          estimatedTokens={currentUsedTokens}
          contextWindow={modelContextWindow}
          onSummarizeTrigger={onSummarizeTrigger}
        />

        <MessageInput
          onSend={onSendMessage}
          isStreaming={isStreaming}
          placeholder={
            detectedMode === 'oracle'
              ? 'Ask the Lore Oracle about history, cultures, rules...'
              : detectedMode === 'brainstorm'
              ? 'Generate 5 plot hooks for character, brainstorm twists...'
              : detectedMode === 'novel-writing'
              ? 'Write next page continuing paragraph, draft chapter dialog...'
              : 'Brainstorm or chat co-writing ideas...'
          }
        />
      </div>
    </div>
  )
}
