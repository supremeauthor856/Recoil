import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Target, Wand2, Loader2, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { ToolsLayout } from './ToolsLayout'
import { requestAI } from '../../../services/aiService'
import type { PlotHoleAnalysis, PlotHoleIssue } from '../types'
import { cn } from '../../../shared/utils/cn'

import { getWritingPieces } from '../../../services/writingService'
import { getCharacters } from '../../../services/characterService'
import { getVerse } from '../../../services/verseService'
import type { WritingPiece } from '../../writing/types'
import type { Character, Verse } from '../../../shared/types/database'

export function PlotHoleDetectorPage() {
  const { verseId = '' } = useParams<{ verseId: string }>()
  
  const [pieces, setPieces] = useState<WritingPiece[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [verse, setVerse] = useState<Verse | null>(null)

  useEffect(() => {
    getWritingPieces(verseId).then(setPieces).catch(console.error)
    getCharacters({ verseId }).then(data => setCharacters(data || [])).catch(console.error)
    getVerse(verseId).then(setVerse).catch(console.error)
  }, [verseId])
  
  const [selectedPieceId, setSelectedPieceId] = useState<string>('')
  const [analysis, setAnalysis] = useState<PlotHoleAnalysis | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedPiece = pieces.find(p => p.id === selectedPieceId)

  const handleDetect = async () => {
    if (!selectedPiece || !selectedPiece.content) return
    
    setIsGenerating(true)
    setError(null)
    setAnalysis(null)

    try {
      const activeChars = characters.slice(0, 10).map(c => `- ${c.name}: ${c.description?.slice(0,100)}`).join('\n')
      
      const systemPrompt = `You are a strict continuity editor. Analyze the provided chapter against the known character baseline. Detect any contradictions, timeline issues, character inconsistencies, or logic gaps.

Return ONLY a valid JSON object matching this schema exactly. No markdown fences.
{
  "summary": "High level overview of issues found.",
  "issues": [
    {
      "type": "contradiction" | "inconsistency" | "plot-hole" | "character-inconsistency" | "lore-conflict",
      "severity": "high" | "medium" | "low",
      "title": "Short descriptive title",
      "description": "Detailed explanation of the issue.",
      "affectedContent": ["Quote or reference to the text"],
      "suggestion": "How to fix it."
    }
  ],
  "contextUsed": { "characterCount": ${characters.length}, "loreEntryCount": 0, "writingCount": 1 }
}

Baseline Context:
${activeChars}`

      const userMessage = `Title: ${selectedPiece.title}\n\nContent:\n${selectedPiece.content}`

      const response = await requestAI({
        taskType: 'plotHoleDetector',
        systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        maxTokens: 1500,
        injectGuidelines: true,
      })

      if (response.error && !response.content) {
        throw new Error(response.error)
      }

      const raw = response.content || ''
      // Robust JSON extraction
      let jsonStr = raw
      const fenceMatch = raw.match(/```json\n([\s\S]*?)\n```/)
      if (fenceMatch) jsonStr = fenceMatch[1]
      else {
        const firstBrace = raw.indexOf('{')
        const lastBrace = raw.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = raw.substring(firstBrace, lastBrace + 1)
        }
      }
      
      const parsed = JSON.parse(jsonStr) as PlotHoleAnalysis
      setAnalysis({ ...parsed, analysisDate: Date.now() })

    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <ToolsLayout
      title="Plot Hole Detector"
      description="Scan chapters against your global lore for inconsistencies."
      icon={<Target size={20} />}
    >
      <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6 pb-24">
        
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-5 flex flex-col gap-4">
          <label className="text-sm font-semibold">Select a document to scan</label>
          <select 
            className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500"
            value={selectedPieceId}
            onChange={e => setSelectedPieceId(e.target.value)}
          >
            <option value="">-- Choose a document --</option>
            {pieces.filter(p => !!p.content).map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          
          <button
            onClick={handleDetect}
            disabled={!selectedPieceId || isGenerating}
            className="mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 h-11 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Target size={18} />}
            {isGenerating ? 'Scanning for Plot Holes...' : 'Scan Document'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-sm text-red-500">
            <strong>Error mapping response to JSON:</strong> {error}
          </div>
        )}

        {analysis && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-5 text-sm leading-relaxed">
              <h3 className="font-semibold text-[15px] mb-2 flex items-center gap-2">
                <Target size={16} className="text-indigo-400" /> Analysis Summary
              </h3>
              <p className="text-[var(--color-text-secondary)]">{analysis.summary}</p>
            </div>

            {analysis.issues.length === 0 ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3">
                <CheckCircle2 size={32} className="text-green-500" />
                <h3 className="font-semibold text-green-600 dark:text-green-400 text-lg">No Issues Detected</h3>
                <p className="text-sm text-green-700/80 dark:text-green-400/80 max-w-md">
                  This document appears highly consistent with the provided context baseline.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2 pl-1">
                   Detected Issues <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full text-xs">{analysis.issues.length}</span>
                </h3>
                {analysis.issues.map((issue, idx) => (
                  <div key={idx} className="bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden">
                    <div className={cn(
                      "absolute top-0 left-0 bottom-0 w-1.5",
                      issue.severity === 'high' ? 'bg-red-500' : issue.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                    )} />
                    
                    <div className="flex justify-between items-start pl-2">
                      <h4 className="font-semibold text-sm max-w-[80%]">{issue.title}</h4>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] px-2 py-0.5 rounded">
                           {issue.type.replace('-', ' ')}
                         </span>
                      </div>
                    </div>
                    
                    <p className="text-[13px] text-[var(--color-text-secondary)] pl-2 leading-relaxed">
                      {issue.description}
                    </p>
                    
                    {issue.affectedContent?.length > 0 && (
                      <div className="pl-2 mt-1">
                        <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">Context Match:</span>
                        <div className="bg-[var(--color-bg-elevated)] border-l-2 border-[var(--color-border-subtle)] pl-3 py-2 text-[12px] italic text-[var(--color-text-secondary)]">
                          "{issue.affectedContent[0]}"
                        </div>
                      </div>
                    )}
                    
                    <div className="pl-2 mt-2 pt-3 border-t border-[var(--color-border-subtle)]">
                       <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block text-indigo-400">Suggestion:</span>
                       <p className="text-[13px] text-[var(--color-text-primary)]">{issue.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        )}
      </div>
    </ToolsLayout>
  )
}
