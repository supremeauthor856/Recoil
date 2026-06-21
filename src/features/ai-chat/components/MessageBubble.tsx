import { useState } from 'react'
import { marked } from 'marked'
import { Bot, User, Copy, Check, Info } from 'lucide-react'
import type { ConversationMessage } from '../types'

interface MessageBubbleProps {
  message: ConversationMessage
}

function sanitizeHtml(html: string): string {
  // Strip scripts
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  // Strip inline javascript handlers (e.g. onclick, onload, etc)
  sanitized = sanitized.replace(/\son\w+\s*=\s*(['"])(.*?)\1/gi, '')
  // Strip javascript: href protocols
  sanitized = sanitized.replace(/href\s*=\s*(['"])javascript:.*?\1/gi, '')
  return sanitized
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const getHtmlContent = () => {
    try {
      // Synchronous parsing is supported by default in modern marked
      const parsed = marked.parse(message.content) as string
      return { __html: sanitizeHtml(parsed) }
    } catch (e) {
      console.error('Marked parsing failure:', e)
      return { __html: sanitizeHtml(message.content) }
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      id={`message-bubble-${message.id}`}
      className={`flex gap-3 md:gap-4 max-w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Bot Icon */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-indigo-400" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative flex flex-col group max-w-[85%] rounded-xl px-4 py-3 border ${
          isUser
            ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-50 text-right select-text'
            : 'bg-gray-900/60 border-gray-800 text-gray-200 select-text leading-relaxed'
        }`}
      >
        {/* Copy Utility */}
        <button
          onClick={handleCopy}
          type="button"
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-white rounded-lg hover:bg-gray-850/50 transition-all duration-150"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Markdown Content */}
        <div
          className={`markdown-body text-xs md:text-sm prose prose-invert max-w-none break-words ${
            isUser ? 'text-left' : ''
          }`}
          dangerouslySetInnerHTML={getHtmlContent()}
        />

        {/* Stats metadata */}
        {!isUser && (message.provider || message.model) && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-500 border-t border-gray-800/60 pt-1.5 font-mono">
            <Info className="w-3 h-3 text-gray-600" />
            <span>
              {message.provider || 'AI Provider'} • {message.model || 'model'}
            </span>
            {message.token_count > 0 && (
              <span className="text-gray-650 ml-auto">
                {message.token_count} estimated tokens
              </span>
            )}
          </div>
        )}
      </div>

      {/* User Icon */}
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
  )
}
