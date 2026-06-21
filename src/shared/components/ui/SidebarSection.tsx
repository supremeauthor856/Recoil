import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { cn } from '../../utils/cn'

interface SidebarSectionProps {
  label: string
  count?: number
  onAdd?: () => void
  defaultExpanded?: boolean
  children: React.ReactNode
}

export function SidebarSection({
  label,
  count,
  onAdd,
  defaultExpanded = true,
  children,
}: SidebarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="flex flex-col mb-4 select-none">
      {/* Header */}
      <div className="group h-[28px] px-3.5 flex items-center justify-between text-[11px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] uppercase tracking-wider transition-colors cursor-pointer">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="truncate">{label}</span>
          {count !== undefined && count > 0 && (
            <span className="font-mono bg-[var(--color-bg-hover)] px-1 rounded-sm text-[9px] font-medium text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]">
              {count}
            </span>
          )}
        </div>
        {onAdd && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            className="p-0.5 rounded hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none"
            title={`Add item to ${label}`}
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {/* Children List */}
      {isExpanded && (
        <div className="flex flex-col gap-0.5 mt-1 animate-fade-in">{children}</div>
      )}
    </div>
  )
}
