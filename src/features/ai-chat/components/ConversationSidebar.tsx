import { Plus, MessageSquare, Trash2, Cpu, Sparkles, Flame, BookOpen } from 'lucide-react'
import type { Conversation, AIWorkspaceMode } from '../types'

interface ConversationSidebarProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string, title: string) => void
  onOpenCreateModal: () => void
  isLoading: boolean
}

const MODE_ICONS: Record<AIWorkspaceMode, React.ReactNode> = {
  chat: <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />,
  oracle: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
  brainstorm: <Flame className="w-3.5 h-3.5 text-rose-400" />,
  'novel-writing': <BookOpen className="w-3.5 h-3.5 text-emerald-400" />,
}

export function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  onDelete,
  onOpenCreateModal,
  isLoading,
}: ConversationSidebarProps) {
  return (
    <div id="conversation-sidebar" className="flex flex-col h-full bg-gray-950 border-r border-gray-900 w-full select-none">
      {/* Header section with Create Button */}
      <div id="side-header" className="p-4 border-b border-gray-900/60 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">AI Sessions</h2>
          <p className="text-[10px] text-gray-500">Chained cognitive workspaces</p>
        </div>

        <button
          id="btn-open-create-conv"
          onClick={onOpenCreateModal}
          className="p-2 text-indigo-400 hover:text-white bg-indigo-950/20 border border-indigo-500/20 hover:border-indigo-500/55 rounded-lg transition-all shadow duration-150 flex items-center gap-1 text-xs font-semibold"
          title="Initialize new cognitive session"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Main List Box */}
      <div id="side-history-list" className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-none">
        {isLoading && conversations.length === 0 ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-gray-900/45 border border-gray-900 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center justify-center space-y-2.5 h-48 select-text">
            <Cpu className="w-8 h-8 text-gray-700 animate-bounce" />
            <div>
              <p className="font-semibold text-gray-400">No sessions initialized.</p>
              <p className="text-[10px] leading-relaxed mt-0.5 text-gray-650">Initialize a new session above to configure your AI companion mode.</p>
            </div>
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === selectedId
            // Infer mode from title/properties if not present, default to chat
            const inferredMode: AIWorkspaceMode = c.mode || (c.title?.toLowerCase().includes('oracle') ? 'oracle' : c.title?.toLowerCase().includes('brainstorm') ? 'brainstorm' : c.title?.toLowerCase().includes('novel') ? 'novel-writing' : 'chat')

            const rawTokenCount = c.total_tokens_used || 0
            const displayTokenCount =
              rawTokenCount > 1000
                ? `${(rawTokenCount / 1000).toFixed(1)}k`
                : rawTokenCount.toLocaleString()

            return (
              <div
                key={c.id}
                id={`session-card-${c.id}`}
                className={`relative group flex items-start justify-between p-3 rounded-lg border text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-950/25 border-indigo-500/40'
                    : 'bg-transparent border-transparent hover:border-gray-900 hover:bg-gray-900/30'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold">
                    {MODE_ICONS[inferredMode] || MODE_ICONS.chat}
                    <span className={`truncate block block-overflow ${isActive ? 'text-white font-bold' : 'text-gray-300'}`}>
                      {c.title || 'Untitled Session'}
                    </span>
                  </div>

                  {c.description && (
                    <p className="text-[10px] text-gray-500 truncate mb-1 leading-relaxed">
                      {c.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-550 font-mono">
                    <span>{c.total_messages} messages</span>
                    <span>•</span>
                    <span className="text-indigo-400/80">{displayTokenCount} tok</span>
                  </div>
                </button>

                {/* Delete button (displays on hover) */}
                <button
                  id={`btn-del-session-${c.id}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(c.id, c.title || 'Untitled Session')
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-650 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-all duration-150 self-center ml-2 flex-shrink-0"
                  title="Archive session logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
