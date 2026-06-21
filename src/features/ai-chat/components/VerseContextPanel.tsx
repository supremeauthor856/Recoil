import { useState } from 'react'
import { Sparkles, Users, Compass, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import type { VerseContextPackage } from '../types'
import { estimateTokensFromText } from '../types'

interface VerseContextPanelProps {
  contextPackage: VerseContextPackage | null
  isLoading: boolean
}

export function VerseContextPanel({ contextPackage, isLoading }: VerseContextPanelProps) {
  const [openSection, setOpenSection] = useState<'overview' | 'characters' | 'relationships' | 'summaries' | null>(null)

  if (isLoading) {
    return (
      <div id="verse-context-panel-loading" className="p-4 bg-gray-950 border border-gray-900 rounded-xl space-y-2 animate-pulse">
        <div className="h-4 bg-gray-900 rounded w-1/3" />
        <div className="h-2 bg-gray-900 rounded w-full" />
        <div className="h-10 bg-gray-900 rounded w-full" />
      </div>
    )
  }

  if (!contextPackage) {
    return (
      <div id="verse-context-panel-empty" className="p-4 bg-gray-950 border border-gray-900 rounded-xl text-center text-xs text-gray-500">
        No active verse background context loaded.
      </div>
    )
  }

  const toggleSection = (section: 'overview' | 'characters' | 'relationships' | 'summaries') => {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  const overviewTokens = estimateTokensFromText(contextPackage.verseOverview)
  const charTokens = estimateTokensFromText(contextPackage.characterSummaries + '\n\n' + contextPackage.detailedProfiles)
  const relTokens = estimateTokensFromText(contextPackage.relationshipSummary)
  const summariesTokens = estimateTokensFromText(contextPackage.previousSummaries)

  return (
    <div id="verse-context-panel-container" className="bg-gray-950 border border-gray-900 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-400 animate-spin-slow" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Active Verse Context Pack
          </h3>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-indigo-500/10 text-indigo-300 bg-indigo-950/10">
          ≈ {estimateTokensFromText(JSON.stringify(contextPackage)).toLocaleString()} Context Tokens
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-gray-400">
        The parameters below are continuously analyzed and automatically fed to the AI engine on every transmission to enforce absolute continuity.
      </p>

      {/* Expandable Sections Accordion */}
      <div id="verse-context-accordion" className="space-y-2">
        {/* SECTION 1: IDENTITY */}
        <div className="border border-gray-900 rounded-lg overflow-hidden bg-gray-900/10">
          <button
            type="button"
            onClick={() => toggleSection('overview')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-900/40 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Verse Identity
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-mono">~{overviewTokens} tok</span>
              {openSection === 'overview' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          {openSection === 'overview' && (
            <div className="px-3 pb-3 pt-1 text-xs text-gray-400 leading-relaxed font-mono bg-gray-950 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {contextPackage.verseOverview}
            </div>
          )}
        </div>

        {/* SECTION 2: CHARACTERS */}
        <div className="border border-gray-900 rounded-lg overflow-hidden bg-gray-900/10">
          <button
            type="button"
            onClick={() => toggleSection('characters')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-900/40 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Characters & Profiles
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-mono">~{charTokens} tok</span>
              {openSection === 'characters' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          {openSection === 'characters' && (
            <div className="p-3 text-xs text-gray-400 leading-relaxed font-mono bg-gray-950 space-y-3 max-h-48 overflow-y-auto">
              <div>
                <span className="text-[10px] text-indigo-400 font-sans font-bold uppercase block mb-1">Active Roster</span>
                <p className="whitespace-pre-wrap">{contextPackage.characterSummaries}</p>
              </div>
              <div className="border-t border-gray-900/55 pt-2">
                <span className="text-[10px] text-indigo-400 font-sans font-bold uppercase block mb-1">Details Context</span>
                <p className="whitespace-pre-wrap">{contextPackage.detailedProfiles}</p>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: RELATIONSHIPS */}
        <div className="border border-gray-900 rounded-lg overflow-hidden bg-gray-900/10">
          <button
            type="button"
            onClick={() => toggleSection('relationships')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-900/40 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Mapped Connections
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-mono">~{relTokens} tok</span>
              {openSection === 'relationships' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          {openSection === 'relationships' && (
            <div className="px-3 pb-3 pt-1 text-xs text-gray-400 leading-relaxed font-mono bg-gray-950 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {contextPackage.relationshipSummary}
            </div>
          )}
        </div>

        {/* SECTION 4: HISTORIC SUMMARIES */}
        <div className="border border-gray-900 rounded-lg overflow-hidden bg-gray-900/10">
          <button
            type="button"
            onClick={() => toggleSection('summaries')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-900/40 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Chained Chronicles
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 font-mono">~{summariesTokens} tok</span>
              {openSection === 'summaries' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          {openSection === 'summaries' && (
            <div className="px-3 pb-3 pt-1 text-xs text-gray-400 leading-relaxed font-mono bg-gray-950 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {contextPackage.previousSummaries}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
