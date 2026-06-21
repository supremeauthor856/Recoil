import { useState, useEffect, useMemo } from 'react'
import { useNavigationStore } from '../../../store/navigationStore'
import { useConversations } from '../hooks/useConversations'
import { useConversation } from '../hooks/useConversation'
import { useVerseContext } from '../hooks/useVerseContext'
import { useAIChat } from '../hooks/useAIChat'
import { ConversationSidebar } from './ConversationSidebar'
import { ConversationView } from './ConversationView'
import { VerseContextPanel } from './VerseContextPanel'
import { ConversationCreateModal } from './ConversationCreateModal'
import { SummarizationModal } from './SummarizationModal'
import { Sparkles, BrainCircuit, Globe, BookOpen } from 'lucide-react'
import { conversationService } from '../../../services/conversationService'

export default function AIWorkspacePage() {
  const activeVerseId = useNavigationStore((state) => state.activeVerseId)

  // 1. Sidebar Conversations Loader hook
  const {
    conversations,
    isLoading: isSidebarLoading,
    createConversation,
    deleteConversation,
    refresh: refreshSidebar,
  } = useConversations(activeVerseId)

  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)

  // Automatically select the first conversation when loaded, if none is selected
  useEffect(() => {
    if (conversations.length > 0 && !activeSegmentId) {
      setActiveSegmentId(conversations[0].id)
    }
  }, [conversations, activeSegmentId])

  // 2. Active Session Messages & Metrics hook
  const {
    conversation,
    messages,
    chain,
    isLoading: isConversationLoading,
    refresh: refreshConversation,
    addMessageToState,
    markLimitReached,
  } = useConversation(activeSegmentId)

  // Trace other segment summaries to pass into the prompt
  const previousSummariesArray = useMemo(() => {
    return chain
      .filter((c) => c.id !== activeSegmentId && c.summary)
      .map((c) => c.summary as string)
  }, [chain, activeSegmentId])

  // 3. Dynamic Verse Continuant Context Pack hook
  const { contextPackage, isLoading: isContextLoading } = useVerseContext(
    activeVerseId,
    previousSummariesArray
  )

  // 4. Modals visibility
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSummarizeOpen, setIsSummarizeOpen] = useState(false)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isChainingSession, setIsChainingSession] = useState(false)

  // 5. Streams & Transmission handler hook
  const {
    sendMessage,
    isStreaming,
    streamingContent,
    error: streamingError,
  } = useAIChat({
    conversationId: activeSegmentId,
    mode: conversation?.mode || 'chat',
    contextPackage,
    existingMessages: messages,
    addMessageToState,
    onUpdateStats: () => {
      // Reload both conversation attributes and sidebar metrics list
      refreshConversation()
      refreshSidebar()
    },
  })

  // Handlers
  const handleCreateSessionSubmit = async (data: {
    title: string
    description: string
    mode: any
  }) => {
    setIsCreatingSession(true)
    try {
      const created = await createConversation({
        title: data.title,
        description: data.description,
        mode: data.mode,
      })
      setActiveSegmentId(created.id)
      setIsCreateOpen(false)
    } catch (err) {
      console.error('Failed to initialize session:', err)
    } finally {
      setIsCreatingSession(false)
    }
  }

  const handleCommitSummarizeChaining = async (summary: string) => {
    if (!activeSegmentId || !conversation) return
    setIsChainingSession(true)
    try {
      // 1. Save summary & flag context limit on current segment
      await markLimitReached(summary)

      // 2. Clear old ID & create a successor segment with chaining properties
      const prevTitle = conversation.title || 'Previous Session'
      const newTitle = prevTitle.startsWith('Segment: ')
        ? prevTitle.replace(/Segment: (Continued )?/, 'Segment: Continued ')
        : `Segment: Continued ${prevTitle}`

      const successor = await conversationService.createConversation({
        verse_id: activeVerseId!,
        title: newTitle,
        description: conversation.description ?? undefined,
        previous_conversation_id: activeSegmentId,
        mode: conversation.mode || 'chat',
      })

      // 3. Select successor segment & reload
      setActiveSegmentId(successor.id)
      setIsSummarizeOpen(false)
      refreshSidebar()
    } catch (err) {
      console.error('Failed to segment chain:', err)
    } finally {
      setIsChainingSession(false)
    }
  }

  const handleDeleteSessionCheck = async (id: string, name: string) => {
    const ok = window.confirm(`Are you sure you want to delete this AI conversation session: "${name}"? This action cannot be undone.`)
    if (!ok) return
    try {
      await deleteConversation(id)
      if (activeSegmentId === id) {
        setActiveSegmentId(null)
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  // Guards against no verse state
  if (!activeVerseId) {
    return (
      <div id="no-verse-workspace-fall" className="min-h-[75vh] flex flex-col items-center justify-center p-8 bg-gray-950/20 text-center select-text">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-center mb-4 animate-bounce">
          <Globe className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">AI workspace requires active Verse</h2>
        <p className="text-xs text-gray-400 max-w-sm mt-1.5 leading-relaxed">
          Please select an existing Verse or initialize a new Verse structure in the left icon rail to configure your AI assistant.
        </p>
      </div>
    )
  }

  return (
    <div id="ai-workspace-dashboard" className="h-[90vh] flex flex-col md:flex-row bg-gray-950/20 border border-gray-900 rounded-2xl overflow-hidden p-2.5 gap-3">
      {/* SIDEBAR: HISTORY */}
      <div id="ai-sidebar-column" className="w-full md:w-64 flex-shrink-0">
        <ConversationSidebar
          conversations={conversations}
          selectedId={activeSegmentId}
          onSelect={setActiveSegmentId}
          onDelete={handleDeleteSessionCheck}
          onOpenCreateModal={() => setIsCreateOpen(true)}
          isLoading={isSidebarLoading}
        />
      </div>

      {/* CENTER: FEED */}
      <div id="ai-feed-column" className="flex-1 flex flex-col h-full overflow-hidden">
        <ConversationView
          conversation={conversation}
          messages={messages}
          chain={chain}
          contextPackage={contextPackage}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          error={streamingError}
          onSendMessage={sendMessage}
          onSelectSegment={setActiveSegmentId}
          onSummarizeTrigger={() => setIsSummarizeOpen(true)}
        />
      </div>

      {/* RIGHT: CONTEXT PANELS */}
      <div id="ai-context-column" className="w-full md:w-64 flex-shrink-0 h-full overflow-y-auto hidden lg:block">
        <VerseContextPanel contextPackage={contextPackage} isLoading={isContextLoading} />
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <ConversationCreateModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateSessionSubmit}
          isCreating={isCreatingSession}
        />
      )}

      {/* SUMMARIZE MODAL */}
      {isSummarizeOpen && (
        <SummarizationModal
          onClose={() => setIsSummarizeOpen(false)}
          onCommit={handleCommitSummarizeChaining}
          messages={messages}
          isCommitting={isChainingSession}
        />
      )}
    </div>
  )
}
