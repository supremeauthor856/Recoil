import { useState } from 'react'
import { Link, Eye, EyeOff, BookOpen } from 'lucide-react'
import type { ConversationChainEntry } from '../types'

interface ConversationChainBannerProps {
  chain: ConversationChainEntry[]
  currentSegmentId: string
  onSelectSegment: (id: string) => void
}

export function ConversationChainBanner({
  chain,
  currentSegmentId,
  onSelectSegment,
}: ConversationChainBannerProps) {
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null)

  if (chain.length <= 1) {
    return null
  }

  const toggleSummary = (id: string) => {
    setExpandedSummaryId((prev) => (prev === id ? null : id))
  }

  return (
    <div id="conversation-chain-banner" className="bg-gray-950 border border-gray-900 rounded-xl overflow-hidden p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
        <Link className="w-4 h-4 text-indigo-400 rotate-45" />
        <span>Chained Historical Chronicles ({chain.length} Segments Linked)</span>
      </div>

      {/* Nodes Sequencer Grid */}
      <div id="chain-timeline-track" className="relative flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
        {chain.map((entry, idx) => {
          const isActive = entry.id === currentSegmentId
          const hasSummary = !!entry.summary

          return (
            <div
              key={entry.id}
              id={`chain-node-${entry.id}`}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div
                className={`flex flex-col p-2.5 rounded-lg border text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-950/20 border-indigo-500/50'
                    : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                  }`}>
                    #{idx + 1}
                  </span>
                  <button
                    onClick={() => onSelectSegment(entry.id)}
                    type="button"
                    className={`text-xs font-semibold hover:underline truncate max-w-[120px] transition-colors ${
                      isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {entry.title || `Segment ${idx + 1}`}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 mt-1">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {entry.total_messages} msgs
                  </span>

                  {hasSummary && (
                    <button
                      type="button"
                      onClick={() => toggleSummary(entry.id)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 transition-colors"
                    >
                      {expandedSummaryId === entry.id ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Hide Log
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> View Log
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {idx < chain.length - 1 && (
                <div className="text-gray-800 font-bold select-none px-1">➔</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Expanded Summary Box */}
      {expandedSummaryId && (
        <div id="chain-expanded-summary" className="bg-gray-900/60 border border-gray-800 rounded-lg p-3.5 space-y-1.5 animate-slide-down">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Condensed Chronicles for{' '}
              <strong className="text-indigo-300">
                {chain.find((c) => c.id === expandedSummaryId)?.title || 'Segment Summary'}
              </strong>
            </span>
          </div>
          <div className="text-[12px] text-gray-300 leading-relaxed font-mono whitespace-pre-wrap bg-gray-950/40 p-2.5 rounded border border-gray-900/50">
            {chain.find((c) => c.id === expandedSummaryId)?.summary}
          </div>
        </div>
      )}
    </div>
  )
}
