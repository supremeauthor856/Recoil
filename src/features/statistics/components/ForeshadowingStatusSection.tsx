import React from 'react'
import { VerseFullStats } from '../types'
import { MapPin, Eye, CheckCircle, TrendingUp } from 'lucide-react'

interface ForeshadowingStatusSectionProps {
  foreshadowing: VerseFullStats['foreshadowing']
}

export const ForeshadowingStatusSection = ({ foreshadowing }: ForeshadowingStatusSectionProps) => {
  const resolutionRate = foreshadowing.total > 0
    ? Math.round((foreshadowing.resolved / foreshadowing.total) * 100)
    : 0

  const activeThreads = foreshadowing.planted + foreshadowing.pendingPayoff

  return (
    <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 flex flex-col gap-5 shadow-sm w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Plot Foreshadowing Tracker
          </h3>
          <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Story elements planted early with targeted payoffs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
            Resolution Rate
          </span>
          <span className="text-sm font-extrabold text-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 px-2 py-0.5 rounded">
            {resolutionRate}%
          </span>
        </div>
      </div>

      {foreshadowing.total === 0 ? (
        <div className="py-10 flex items-center justify-center text-xs text-[var(--color-text-muted)] italic">
          No foreshadowing entries tracked in this verse yet. Plan some plot threads!
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Completion Progress Bar */}
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between text-[11px] font-medium text-[var(--color-text-muted)]">
              <span>{foreshadowing.resolved} resolved payoff{foreshadowing.resolved === 1 ? '' : 's'}</span>
              <span>{activeThreads} ongoing thread{activeThreads === 1 ? '' : 's'}</span>
            </div>
            <div className="w-full bg-[var(--color-bg-subtle)] hover:border-[var(--color-border-default)]/30 border border-transparent h-2.5 rounded-full overflow-hidden flex transition-all">
              <div
                style={{ width: `${resolutionRate}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              />
              <div
                style={{ width: `${foreshadowing.total > 0 ? (foreshadowing.pendingPayoff / foreshadowing.total) * 100 : 0}%` }}
                className="bg-amber-400 h-full transition-all duration-300"
              />
              <div
                style={{ width: `${foreshadowing.total > 0 ? (foreshadowing.planted / foreshadowing.total) * 100 : 0}%` }}
                className="bg-zinc-500/40 dark:bg-zinc-600/45 h-full transition-all duration-300"
              />
            </div>
          </div>

          {/* Cards Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Planted */}
            <div className="bg-[var(--color-bg-subtle)]/40 hover:bg-[var(--color-bg-subtle)]/60 border border-[var(--color-border-subtle)]/40 p-3.5 rounded-lg flex items-center gap-3 transition-all duration-100">
              <div className="p-2 rounded-md bg-zinc-500/10 text-zinc-400">
                <MapPin size={15} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                  Planted Hints
                </span>
                <span className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">
                  {foreshadowing.planted} entry{foreshadowing.planted === 1 ? '' : 'ies'}
                </span>
              </div>
            </div>

            {/* Pending Payoff */}
            <div className="bg-[var(--color-bg-subtle)]/40 hover:bg-[var(--color-bg-subtle)]/60 border border-[var(--color-border-subtle)]/40 p-3.5 rounded-lg flex items-center gap-3 transition-all duration-100">
              <div className="p-2 rounded-md bg-amber-400/10 text-amber-400">
                <Eye size={15} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                  Pending Payoffs
                </span>
                <span className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">
                  {foreshadowing.pendingPayoff} thread{foreshadowing.pendingPayoff === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Resolved */}
            <div className="bg-[var(--color-bg-subtle)]/40 hover:bg-[var(--color-bg-subtle)]/60 border border-[var(--color-border-subtle)]/40 p-3.5 rounded-lg flex items-center gap-3 transition-all duration-100">
              <div className="p-2 rounded-md bg-emerald-400/10 text-emerald-400">
                <CheckCircle size={15} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">
                  Resolved Payoffs
                </span>
                <span className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">
                  {foreshadowing.resolved} thread{foreshadowing.resolved === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
