import React from 'react'
import { FORMAT_DEFINITIONS, FORMAT_GROUPS, type FormatGroup, type ExportFormat, type ExportScope } from '../types'
import * as Icons from 'lucide-react'

interface FormatOptionGridProps {
  formats: ExportFormat[]
  availableFor: ExportScope['type']
  onSelect: (format: ExportFormat) => void
  isExporting: boolean
}

export function FormatOptionGrid({ formats, availableFor, onSelect, isExporting }: FormatOptionGridProps) {
  // Filter formats based on scope available
  const availableDefs = FORMAT_DEFINITIONS.filter(def => 
    def.availableFor.includes(availableFor) && 
    (formats.length === 0 || formats.includes(def.id))
  )

  // Group definitions
  const grouped = availableDefs.reduce<Record<FormatGroup, typeof availableDefs>>((acc, def) => {
    if (!acc[def.group]) acc[def.group] = []
    acc[def.group].push(def)
    return acc
  }, {} as any)

  const groupKeys = Object.keys(grouped) as FormatGroup[]
  const orderedGroups = ['document', 'ebook', 'data', 'code', 'image', 'archive'].filter(g => groupKeys.includes(g as FormatGroup)) as FormatGroup[]

  return (
    <div className="flex flex-col gap-6">
      {orderedGroups.map(group => (
        <div key={group} className="flex flex-col gap-3">
          <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)] pb-2">
            {FORMAT_GROUPS[group]}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grouped[group].map(def => {
              const Icon = (Icons as any)[def.icon] || Icons.FileText
              return (
                <button
                  type="button"
                  key={def.id}
                  disabled={isExporting}
                  onClick={() => onSelect(def.id)}
                  className="flex items-start text-left gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-sidebar)] flex items-center justify-center shrink-0 text-[var(--color-accent-primary)] group-hover:scale-105 transition-transform">
                    <Icon size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="font-semibold text-[13px] text-[var(--color-text-primary)] flex items-center gap-2">
                      {def.label}
                      <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-sidebar)] px-1.5 py-0.5 rounded uppercase font-medium">
                        .{def.extension}
                      </span>
                    </div>
                    <div className="text-[12px] text-[var(--color-text-secondary)] mt-0.5 line-clamp-2 leading-relaxed tracking-wide">
                      {def.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
