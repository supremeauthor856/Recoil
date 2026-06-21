import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Wand2, Loader2, Copy, Download } from 'lucide-react'
import { ToolsLayout } from './ToolsLayout'
import { requestAI } from '../../../services/aiService'
import ReactMarkdown from 'react-markdown'
import { downloadBlob } from '../../export/utils/downloadHelper'
import { getWritingPieces } from '../../../services/writingService'
import type { WritingPiece } from '../../writing/types'

export function ChapterSummaryPage() {
  const { verseId = '' } = useParams<{ verseId: string }>()
  
  const [pieces, setPieces] = useState<WritingPiece[]>([])
  useEffect(() => {
    getWritingPieces(verseId).then(setPieces).catch(console.error)
  }, [verseId])
  
  const [selectedPieceId, setSelectedPieceId] = useState<string>('')
  const [result, setResult] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedPiece = pieces.find(p => p.id === selectedPieceId)

  const handleGenerate = async () => {
    if (!selectedPiece || !selectedPiece.content) return
    
    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const systemPrompt = "You are an expert editor. Summarize the following chapter. Provide a brief 2-3 sentence overview, followed by a bulleted list of key plot events and character developments."
      const userMessage = `Title: ${selectedPiece.title}\n\nContent:\n${selectedPiece.content}`

      const response = await requestAI({
        taskType: 'chapterSummary',
        systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        maxTokens: 500,
        injectGuidelines: false,
      })

      if (response.error && !response.content) {
        setError(response.error)
      } else {
        if (response.error) setError(response.error)
        setResult(response.content ?? null)
      }
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <ToolsLayout
      title="Chapter Summary Generator"
      description="Automatically generate synopses for your chapters."
      icon={<FileText size={20} />}
    >
      <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6 pb-24">
        
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-5 flex flex-col gap-4">
          <label className="text-[13px] font-semibold text-[var(--color-text-primary)]">Select a chapter/document to summarize</label>
          <select 
            className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
            value={selectedPieceId}
            onChange={e => setSelectedPieceId(e.target.value)}
          >
            <option value="">-- Choose a document --</option>
            {pieces.filter(p => !!p.content).map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          
          <button
            onClick={handleGenerate}
            disabled={!selectedPieceId || isGenerating || !selectedPiece?.content}
            className="mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 h-10 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {isGenerating ? 'Summarizing...' : 'Generate Summary'}
          </button>
          
          {selectedPiece && !selectedPiece.content && (
            <p className="text-xs text-red-500">This document has no content to summarize.</p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-sm text-red-500">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="bg-[var(--color-bg-base)] border border-[var(--color-accent-primary)] rounded-xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Summary: {selectedPiece?.title}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => navigator.clipboard.writeText(result)} className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" title="Copy">
                  <Copy size={16} />
                </button>
                <button onClick={() => downloadBlob(`Summary_${selectedPiece?.title}.md`, result, 'text/markdown')} className="p-1.5 hover:bg-[var(--color-bg-elevated)] rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" title="Export MD">
                  <Download size={16} />
                </button>
              </div>
            </div>
            <div className="ai-message-content text-sm bg-[var(--color-bg-elevated)] p-4 rounded-xl">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}

      </div>
    </ToolsLayout>
  )
}
