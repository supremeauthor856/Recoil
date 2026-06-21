import React, { useState } from 'react'
import { X, Sparkles, MessageSquare, Flame, BookOpen } from 'lucide-react'
import { AI_WORKSPACE_MODES, AIWorkspaceMode } from '../types'

interface ConversationCreateModalProps {
  onClose: () => void
  onCreate: (data: { title: string; description: string; mode: AIWorkspaceMode }) => void
  isCreating: boolean
}

const MODE_ICONS: Record<AIWorkspaceMode, React.ReactNode> = {
  chat: <MessageSquare className="w-5 h-5 text-indigo-400" />,
  oracle: <Sparkles className="w-5 h-5 text-amber-400" />,
  brainstorm: <Flame className="w-5 h-5 text-rose-400" />,
  'novel-writing': <BookOpen className="w-5 h-5 text-emerald-400" />,
}

export function ConversationCreateModal({
  onClose,
  onCreate,
  isCreating,
}: ConversationCreateModalProps) {
  const [selectedMode, setSelectedMode] = useState<AIWorkspaceMode>('chat')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({
      title: title.trim(),
      description: description.trim(),
      mode: selectedMode,
    })
  }

  return (
    <div id="create-conv-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        id="create-conv-modal-container"
        className="relative w-full max-w-xl bg-gray-950 border border-gray-800 rounded-xl shadow-2xl overflow-hidden mx-4"
      >
        <div id="create-conv-modal-header" className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            Initialize AI Workspace
          </h2>
          <button
            id="create-conv-modal-close"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mode Selection Grid */}
          <div id="create-conv-modal-modes" className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Select Workspace Mode
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AI_WORKSPACE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  id={`mode-card-${mode.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedMode(mode.id)
                    // Set default titles based on mode to speed up workflow
                    if (!title || AI_WORKSPACE_MODES.some(m => title === `${m.label} Session`)) {
                      setTitle(`${mode.label} Session`)
                    }
                  }}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 ${
                    selectedMode === mode.id
                      ? 'bg-indigo-950/20 border-indigo-500/60 ring-1 ring-indigo-500/20'
                      : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    {MODE_ICONS[mode.id]}
                    <span className="font-semibold text-white">{mode.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title input */}
          <div id="create-conv-modal-title" className="space-y-1.5">
            <label htmlFor="conv-title" className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Conversation Session Name
            </label>
            <input
              id="conv-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Brainstorming Act II, Oracle Q&A"
              className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-800 focus:border-indigo-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Description input */}
          <div id="create-conv-modal-desc" className="space-y-1.5">
            <label htmlFor="conv-desc" className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Objective or Context Focus (Optional)
            </label>
            <textarea
              id="conv-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what we are focusing on in this workspace session..."
              className="w-full px-4 py-2.5 text-sm bg-gray-900 border border-gray-800 focus:border-indigo-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
            />
          </div>

          <div id="create-conv-modal-footer" className="flex items-center justify-end gap-3 pt-3 border-t border-gray-900">
            <button
              id="btn-cancel"
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit"
              type="submit"
              disabled={isCreating || !title.trim()}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-gray-400 rounded-lg transition-colors shadow-lg active:scale-95 duration-100"
            >
              {isCreating ? 'Accessing Workspace...' : 'Initialize Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
