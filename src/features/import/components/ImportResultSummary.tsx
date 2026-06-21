import React, { useState } from 'react'
import { ImportSummary } from '../types'
import { CheckCircle2, ChevronDown, ChevronUp, AlertCircle, RefreshCw, Users, FileText, Heart, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ImportResultSummaryProps {
  summary: ImportSummary
  onImportAnother: () => void
  verseId: string
}

export function ImportResultSummary({
  summary,
  onImportAnother,
  verseId,
}: ImportResultSummaryProps) {
  const [showErrors, setShowErrors] = useState(summary.errors.length > 0)

  // Calculate total successful records created or updated
  const totalSuccess =
    summary.charactersCreated +
    summary.charactersUpdated +
    summary.loreCreated +
    summary.relationshipsCreated +
    summary.writingCreated

  return (
    <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/40 rounded-3xl p-8 max-w-4xl mx-auto space-y-8 select-none shadow-sm text-center animate-fade-in">
      
      {/* Top Banner Circle */}
      <div className="space-y-3.5 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight">Import Sequence Complete</h2>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          The requested data structure parsing of your source document finished. We added or updated <strong className="text-emerald-500">{totalSuccess}</strong> entities inside this universe!
        </p>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
        {/* Characters Cell */}
        <div className="p-4 bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/15 rounded-2xl flex flex-col items-center justify-center space-y-2">
          <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/10 text-indigo-400">
            <Users size={16} />
          </div>
          <p className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">CHARACTERS</p>
          <div className="text-center">
            <p className={`text-md font-bold leading-none ${summary.charactersCreated + summary.charactersUpdated > 0 ? 'text-emerald-500' : 'text-[var(--color-text-muted)]'}`}>
              +{summary.charactersCreated + summary.charactersUpdated}
            </p>
            {summary.charactersUpdated > 0 && (
              <p className="text-[9px] font-mono text-[var(--color-text-muted)] mt-1">
                ({summary.charactersUpdated} updated)
              </p>
            )}
          </div>
        </div>

        {/* Lore Cell */}
        <div className="p-4 bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/15 rounded-2xl flex flex-col items-center justify-center space-y-2">
          <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/10 text-purple-400">
            <Globe size={16} />
          </div>
          <p className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">LORE ARTICLES</p>
          <p className={`text-md font-bold leading-none ${summary.loreCreated > 0 ? 'text-emerald-500' : 'text-[var(--color-text-muted)]'}`}>
            +{summary.loreCreated}
          </p>
        </div>

        {/* Relationships Cell */}
        <div className="p-4 bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/15 rounded-2xl flex flex-col items-center justify-center space-y-2">
          <div className="p-2 rounded-xl bg-pink-950/40 border border-pink-500/10 text-pink-400">
            <Heart size={16} />
          </div>
          <p className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">RELATIONSHIPS</p>
          <p className={`text-md font-bold leading-none ${summary.relationshipsCreated > 0 ? 'text-emerald-500' : 'text-[var(--color-text-muted)]'}`}>
            +{summary.relationshipsCreated}
          </p>
        </div>

        {/* Writing Pieces Cell */}
        <div className="p-4 bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/15 rounded-2xl flex flex-col items-center justify-center space-y-2">
          <div className="p-2 rounded-xl bg-teal-950/40 border border-teal-500/10 text-teal-400">
            <FileText size={16} />
          </div>
          <p className="text-[10px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">WRITINGS</p>
          <p className={`text-md font-bold leading-none ${summary.writingCreated > 0 ? 'text-emerald-500' : 'text-[var(--color-text-muted)]'}`}>
            +{summary.writingCreated}
          </p>
        </div>
      </div>

      {/* Lore System Warning Note if skipped */}
      {summary.loreSkipped > 0 && (
        <div className="p-4 bg-amber-950/15 border border-amber-600/20 rounded-2xl flex items-start gap-3.5 max-w-2xl mx-auto text-left">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={15} />
          <p className="text-xs text-amber-300 leading-relaxed font-sans">
            We skipped <strong>{summary.loreSkipped}</strong> lore entry records. Lore entries will be importable once the lore system is fully ready.
          </p>
        </div>
      )}

      {/* Errors Section */}
      {summary.errors.length > 0 && (
        <div className="border border-rose-950/30 bg-rose-950/10 rounded-2xl p-4 max-w-2xl mx-auto text-left space-y-3.5">
          <button
            type="button"
            onClick={() => setShowErrors(!showErrors)}
            className="flex items-center justify-between w-full text-rose-400 hover:text-rose-300 font-bold text-xs"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span>Some items could not be imported ({summary.errors.length})</span>
            </div>
            {showErrors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showErrors && (
            <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-custom pr-1 text-xs">
              {summary.errors.map((err, idx) => (
                <div key={idx} className="p-2.5 bg-rose-950/20 border border-rose-900/35 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-rose-300 truncate max-w-xs">{err.item}</span>
                  <span className="text-[11px] text-rose-400 font-mono italic">{err.error}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-4.5 pt-5 border-t border-[var(--color-border-subtle)]/15 max-w-md mx-auto">
        <button
          type="button"
          onClick={onImportAnother}
          className="flex-1 px-5 py-2.5 border border-[var(--color-border-subtle)]/30 hover:bg-[var(--color-bg-hover)] text-xs font-semibold text-[var(--color-text-secondary)] rounded-xl transition-colors min-h-[44px] flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw size={12.5} />
          <span>Import Another File</span>
        </button>

        <Link
          to={`/verse/${verseId}`}
          className="flex-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl transition-all shadow-sm min-h-[44px] flex items-center justify-center cursor-pointer"
        >
          View Verse Dashboard
        </Link>
      </div>
    </div>
  )
}
