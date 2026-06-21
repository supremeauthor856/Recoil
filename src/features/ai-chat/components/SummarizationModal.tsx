import React, { useState, useEffect } from 'react'
import { X, RefreshCw, Cpu, Link, ClipboardCheck } from 'lucide-react'
import { requestAI } from '../../../services/aiService'
import type { ConversationMessage } from '../types'

interface SummarizationModalProps {
  onClose: () => void
  onCommit: (summary: string) => void
  messages: ConversationMessage[]
  isCommitting: boolean
}

export function SummarizationModal({
  onClose,
  onCommit,
  messages,
  isCommitting,
}: SummarizationModalProps) {
  const [summary, setSummary] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSummary = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      if (messages.length === 0) {
        setSummary('This conversation is currently empty.')
        setIsGenerating(false)
        return
      }

      const formattedHistory = messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n')

      const systemPrompt =
        'You are an expert story chronicler. Summarize the key events, character changes, plot adjustments, new faction ideas, and world state additions discussed in the following conversation logs. Be thorough, detailed, structure with bullet points, but keep it high-density so we can append it as a reference lore package.'

      const userPrompt = `Please summarize this chat history for our records:\n\n${formattedHistory}`

      const response = await requestAI({
        taskType: 'chapterSummary',
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        maxTokens: 1548,
        temperature: 0.7,
        injectGuidelines: false,
      })

      if (response.error) {
        throw new Error(response.error)
      }
      setSummary(response.content)
    } catch (err: any) {
      console.error('Failed to generate summary:', err)
      setError(err.message || 'Failed to auto-generate summary. You can write your own manually.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Trigger auto-generation on mount
  useEffect(() => {
    generateSummary()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!summary.trim()) return
    onCommit(summary.trim())
  }

  return (
    <div id="summarize-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        id="summarize-modal-container"
        className="relative w-full max-w-lg bg-gray-950 border border-gray-800 rounded-xl shadow-2xl overflow-hidden mx-4"
      >
        <div id="summarize-modal-header" className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Link className="w-5 h-5 text-indigo-400 rotate-45" />
            Summarize Segment & Chain
          </h2>
          <button
            id="summarize-modal-close"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            Approaching model's context threshold limit. By summarizing this conversation segment, we commit character actions, story twists, and lore choices to long term memory logs, starting a fresh conversation seamlessly while retaining all historic context!
          </p>

          <div id="summarize-preview" className="relative space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="summary-textarea" className="text-xs font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-1">
                <ClipboardCheck className="w-4 h-4 text-indigo-400" />
                Segment Memory Chronologies Preview
              </label>
              <button
                id="btn-regenerate-summary"
                type="button"
                onClick={generateSummary}
                disabled={isGenerating}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:text-gray-600 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
            </div>

            <div className="relative">
              <textarea
                id="summary-textarea"
                required
                rows={9}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Generating chronological segment summary log..."
                className="w-full px-4 py-3 text-xs md:text-sm bg-gray-900 border border-gray-800 focus:border-indigo-500 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none font-mono leading-relaxed"
                disabled={isGenerating}
              />
              {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/70 rounded-lg">
                  <Cpu className="w-8 h-8 text-indigo-500 animate-bounce mb-2" />
                  <span className="text-xs font-medium text-gray-300">Authoring Chronologies...</span>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <div id="summarize-modal-footer" className="flex items-center justify-end gap-3 pt-3 border-t border-gray-900">
            <button
              id="summarize-btn-cancel"
              type="button"
              onClick={onClose}
              disabled={isCommitting}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              id="summarize-btn-commit"
              type="submit"
              disabled={isCommitting || !summary.trim() || isGenerating}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 disabled:text-gray-500 rounded-lg transition-colors hover:shadow-lg active:scale-95 duration-100"
            >
              {isCommitting ? 'Chaining Context...' : 'Commit & Create New Segment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
