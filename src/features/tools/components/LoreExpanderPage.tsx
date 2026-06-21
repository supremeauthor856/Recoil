import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ToolsLayout } from './ToolsLayout'
import { Wand2, Copy, X, Download, Plus, CheckCircle, Loader2 } from 'lucide-react'
import { useVerse } from '../../../features/verse/hooks/useVerse'
import { requestAI } from '../../../services/aiService'
import { api } from '../../../services/api'
import { downloadBlob } from '../../export/utils/downloadHelper'
import ReactMarkdown from 'react-markdown'
import { cn } from '../../../shared/utils/cn'

const GUIDELINE_CATEGORY_LABELS = [
  'General', 'World Rules', 'History', 'Faction', 'Location', 
  'Concept', 'Item', 'Event', 'Creature', 'Technology', 'Culture'
]

export function LoreExpanderPage() {
  const { verseId = '' } = useParams<{ verseId: string }>()
  const { verse } = useVerse(verseId)
  
  const [concept, setConcept] = useState('')
  const [category, setCategory] = useState('General')
  const [targetLength, setTargetLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [result, setResult] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleExpand = async () => {
    if (!concept.trim()) return
    setIsGenerating(true)
    setError(null)
    setResult(null)
    setSavedSuccess(false)

    try {
      const LENGTH_INSTRUCTIONS = {
        short: 'Write a concise lore entry of 200-400 words.',
        medium: 'Write a detailed lore entry of 400-800 words.',
        long: 'Write an extensive lore entry of 800-1500 words. Include sub-sections.',
      }

      const systemPrompt = `You are an expert worldbuilder writing lore entries for a fictional universe called "${verse?.name ?? 'this verse'}". Write rich, immersive lore that feels like an in-universe document or encyclopedia entry. Use evocative language. ${LENGTH_INSTRUCTIONS[targetLength]} Write in third person. Do not include meta-commentary. Just write the lore content directly.`
      
      const userMessage = `Write a lore entry for the following concept, categorized as "${category}":\n\n${concept}`

      const response = await requestAI({
        taskType: 'loreExpander',
        systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        maxTokens: targetLength === 'long' ? 2000 : targetLength === 'medium' ? 1200 : 600,
        injectGuidelines: true,
      })

      if (response.error && !response.content) {
        setError(response.error)
      } else {
        if (response.error) setError(response.error) // partial
        setResult(response.content ?? null)
      }
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!result) return
    setIsSaving(true)
    try {
      await api.post('/lore', {
        verse_id: verseId,
        title: concept.split('.')[0].slice(0, 80).trim() || 'Untitled Lore Entry',
        category: category.toLowerCase().replace(' ', '-'),
        content: result,
        summary: result.slice(0, 200) + '...',
      })
      setSavedSuccess(true)
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportMarkdown = () => {
    if (!result) return
    const title = concept.split('.')[0].slice(0, 40).trim() || 'lore-entry'
    downloadBlob(`${title}.md`, result, 'text/markdown')
  }

  return (
    <ToolsLayout
      title="Lore Expander"
      description="Turn a brief concept into a full, detailed lore entry."
      icon={<Wand2 size={20} />}
    >
      <div className="p-6 max-w-[760px] mx-auto flex flex-col gap-6 pb-24">
        {/* INPUT SECTION */}
        <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-subtle)] p-5 flex flex-col gap-4">
          <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)] leading-none m-0">What would you like to expand?</h2>
          
          <textarea
            autoFocus
            rows={6}
            className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] resize-none"
            placeholder="e.g. The ancient order that once governed the flow of memories between worlds, now fragmented after the Collapse..."
            value={concept}
            onChange={e => setConcept(e.target.value)}
          />

          <div className="flex flex-row gap-3 flex-wrap">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Category</label>
              <select
                className="h-9 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg px-3 text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {GUIDELINE_CATEGORY_LABELS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Length</label>
              <select
                className="h-9 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg px-3 text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                value={targetLength}
                onChange={e => setTargetLength(e.target.value as any)}
              >
                <option value="short">Short (200-400 words)</option>
                <option value="medium">Medium (400-800 words)</option>
                <option value="long">Long (800-1500 words)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleExpand}
            disabled={!concept.trim() || isGenerating}
            className="h-10 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 transition-all shadow-sm w-full"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {isGenerating ? 'Expanding...' : 'Expand Concept'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-[13px] text-red-500 flex flex-col gap-1">
            <span className="font-semibold">Generation Error</span>
            <span>{error}</span>
          </div>
        )}

        {/* RESULT SECTION */}
        {result && (
          <div className="bg-[var(--color-bg-base)] rounded-xl border border-[var(--color-accent-primary)] p-5 flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between">
              <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)] m-0">Generated Lore Entry</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  title="Copy text"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  title="Discard"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="ai-message-content text-[14px]">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>

            <div className="flex flex-row gap-2 justify-end mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
              <button
                onClick={handleExportMarkdown}
                className="h-8 px-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                Export as Markdown
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving || savedSuccess}
                className={cn(
                  "h-8 px-3 text-white rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-sm",
                  savedSuccess ? "bg-green-600 hover:bg-green-500" : "bg-indigo-600 hover:bg-indigo-500",
                  isSaving && "opacity-70 cursor-wait"
                )}
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : savedSuccess ? <CheckCircle size={14} /> : <Plus size={14} />}
                {isSaving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save as Lore Entry'}
              </button>
            </div>
            {savedSuccess && (
              <div className="text-right text-[11px] text-[var(--color-text-muted)] mt-1">
                <span title="Lore browser coming soon">Available in your Lore Database.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolsLayout>
  )
}
