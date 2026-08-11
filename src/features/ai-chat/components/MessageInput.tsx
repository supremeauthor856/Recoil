import React, { useState, useRef, useEffect } from 'react'
import { SendHorizontal, Loader2, Sparkles, Zap, Brain } from 'lucide-react'
import { estimateTokensFromText } from '../types'

interface MessageInputProps {
  onSend: (content: string, option: 'general' | 'low-latency' | 'thinking') => void
  isStreaming: boolean
  placeholder?: string
}

export function MessageInput({
  onSend,
  isStreaming,
  placeholder = 'Message AI co-writer...',
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [intelligenceOption, setIntelligenceOption] = useState<'general' | 'low-latency' | 'thinking'>('general')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!content.trim() || isStreaming) return
    onSend(content.trim(), intelligenceOption)
    setContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Auto-resize textarea heights
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(220, textarea.scrollHeight)}px`
  }, [content])

  const tokenCount = estimateTokensFromText(content)

  return (
    <form onSubmit={handleSubmit} className="relative bg-gray-950 border border-gray-900 rounded-xl p-3 space-y-2 shadow-inner">
      <textarea
        ref={textareaRef}
        id="chat-textarea-input"
        rows={1}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isStreaming}
        className="w-full bg-transparent px-2.5 py-1 text-xs md:text-sm text-gray-200 placeholder-gray-500 focus:outline-none resize-none leading-relaxed select-text"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-900/60 pt-2.5 px-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Intelligence Mode Segmented Selector */}
          <div className="flex items-center bg-gray-900/60 border border-gray-800/80 rounded-lg p-0.5 text-[11px] font-sans">
            <button
              type="button"
              onClick={() => setIntelligenceOption('general')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                intelligenceOption === 'general'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Balanced, general-purpose intelligence (Gemini 3.5 Flash)"
            >
              <Sparkles className="w-3 h-3" />
              <span>General</span>
            </button>
            <button
              type="button"
              onClick={() => setIntelligenceOption('low-latency')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                intelligenceOption === 'low-latency'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Lightning-fast, snappy responses (Gemini 3.1 Flash Lite)"
            >
              <Zap className="w-3 h-3" />
              <span>Fast</span>
            </button>
            <button
              type="button"
              onClick={() => setIntelligenceOption('thinking')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                intelligenceOption === 'thinking'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : 'text-gray-400 hover:text-amber-400/90'
              }`}
              title="Complex reasoning, High Thinking level (Gemini 3.1 Pro Preview)"
            >
              <Brain className="w-3 h-3 animate-pulse text-amber-300" />
              <span>Deep Think</span>
            </button>
          </div>

          {content.length > 0 && (
            <span className="text-[10px] text-gray-500 font-mono">
              <strong>{content.length}</strong> chars ≈ <strong className="text-indigo-400">{tokenCount}</strong> tokens
            </span>
          )}
        </div>

        <button
          id="chat-btn-submit-msg"
          type="submit"
          disabled={!content.trim() || isStreaming}
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-900 disabled:text-gray-700 rounded-lg transition-all shadow active:scale-95 duration-700 w-full sm:w-auto"
        >
          {isStreaming ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Streaming...</span>
            </>
          ) : (
            <>
              <SendHorizontal className="w-3.5 h-3.5" />
              <span>Send</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
