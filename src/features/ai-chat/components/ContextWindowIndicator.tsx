import { getContextLimitStatus } from '../types'
import { AlertCircle, HelpCircle } from 'lucide-react'

interface ContextWindowIndicatorProps {
  estimatedTokens: number
  contextWindow: number
  onSummarizeTrigger: () => void
}

export function ContextWindowIndicator({
  estimatedTokens,
  contextWindow,
  onSummarizeTrigger,
}: ContextWindowIndicatorProps) {
  const percentage = Math.min(100, Math.max(0, (estimatedTokens / contextWindow) * 100))
  const status = getContextLimitStatus(estimatedTokens, contextWindow)

  const getStatusColor = () => {
    switch (status) {
      case 'limit-reached':
        return {
          bar: 'bg-rose-500',
          text: 'text-rose-400 border-rose-500/30 bg-rose-950/20',
          btn: 'bg-rose-600 hover:bg-rose-500 text-white',
        }
      case 'critical':
        return {
          bar: 'bg-orange-500',
          text: 'text-orange-400 border-orange-500/30 bg-orange-950/20',
          btn: 'bg-orange-600 hover:bg-orange-500 text-white',
        }
      case 'warning':
        return {
          bar: 'bg-amber-500',
          text: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
          btn: 'bg-amber-600 hover:bg-amber-500 text-gray-900',
        }
      case 'caution':
        return {
          bar: 'bg-indigo-500',
          text: 'text-indigo-400 border-indigo-500/20 bg-indigo-950/10',
          btn: 'bg-indigo-600 hover:bg-indigo-500 text-white',
        }
      case 'safe':
      default:
        return {
          bar: 'bg-emerald-500',
          text: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/10',
          btn: 'bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800',
        }
    }
  }

  const colors = getStatusColor()

  return (
    <div id="context-indicator-card" className="p-4 bg-gray-950 border border-gray-900 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className={`w-4 h-4 ${colors.text.split(' ')[0]}`} />
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Context Memory Bounds
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${colors.text}`}>
            {status.toUpperCase().replace('-', ' ')}
          </span>
          <span className="text-[11px] text-gray-500 font-mono">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div id="progress-bar-track" className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
        <div
          id="progress-bar-fill"
          style={{ width: `${percentage}%` }}
          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-400 leading-relaxed max-w-sm">
          <HelpCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span>
            {estimatedTokens.toLocaleString()} / {contextWindow.toLocaleString()} estimated tokens consumed in current segment
          </span>
        </div>

        <button
          id="btn-trigger-summarize-context"
          type="button"
          onClick={onSummarizeTrigger}
          className={`text-[11px] font-semibold px-3 py-1 rounded-lg transition-all duration-150 ${colors.btn}`}
        >
          Summarize & Chain Segment
        </button>
      </div>
    </div>
  )
}
