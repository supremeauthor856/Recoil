import React, { useState, useRef, useEffect } from 'react'
import { SendHorizontal, Loader2 } from 'lucide-react'
import { estimateTokensFromText } from '../types'

interface MessageInputProps {
  onSend: (content: string) => void
  isStreaming: boolean
  placeholder?: string
}

export function MessageInput({
  onSend,
  isStreaming,
  placeholder = 'Message AI co-writer...',
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!content.trim() || isStreaming) return
    onSend(content.trim())
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

      <div className="flex items-center justify-between border-t border-gray-900/60 pt-2 px-1">
        <div className="flex items-center gap-2">
          {content.length > 0 && (
            <span className="text-[10px] md:text-xs text-gray-500 font-mono">
              <strong>{content.length}</strong> chars ≈ <strong className="text-indigo-400">{tokenCount}</strong> tokens
            </span>
          )}
        </div>

        <button
          id="chat-btn-submit-msg"
          type="submit"
          disabled={!content.trim() || isStreaming}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-900 disabled:text-gray-700 rounded-lg transition-all shadow active:scale-95 duration-700"
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
