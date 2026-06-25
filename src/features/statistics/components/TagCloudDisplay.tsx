import React from 'react'
import { TagFrequency } from '../types'
import { Hash } from 'lucide-react'

interface TagCloudDisplayProps {
  tags: TagFrequency[]
}

export const TagCloudDisplay = ({ tags }: TagCloudDisplayProps) => {
  // Limit to top 20 for absolute clean layout
  const visibleTags = tags.slice(0, 20)

  // Compute boundaries for tag scaling calculations
  const counts = tags.map((t) => t.count)
  const maxCount = counts.length > 0 ? Math.max(...counts, 1) : 1
  const minCount = counts.length > 0 ? Math.min(...counts, 0) : 0

  const getFontSize = (count: number): string => {
    if (maxCount === minCount) return '13px'
    // Normalize safely between 11px and 22px
    const size = 11 + ((count - minCount) / (maxCount - minCount)) * (22 - 11)
    return `${Math.round(size)}px`
  }

  return (
    <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 flex flex-col gap-4 shadow-sm w-full">
      <div className="flex flex-col">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
          Character Tag Cloud
        </h3>
        <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Vocabulary metadata extracted client-side from character profiles
        </span>
      </div>

      {visibleTags.length === 0 ? (
        <div className="py-12 flex items-center justify-center text-xs text-[var(--color-text-muted)] italic">
          No tags found on characters yet. Tag bio fields to populate this cloud!
        </div>
      ) : (
        <div className="bg-[var(--color-bg-subtle)]/30 border border-[var(--color-border-subtle)]/40 p-6 rounded-xl flex flex-wrap gap-2.5 items-center justify-center min-h-[140px] select-none">
          {visibleTags.map((tag, idx) => {
            const fontSizeVal = getFontSize(tag.count)

            return (
              <span
                key={`tag-${idx}`}
                style={{ fontSize: fontSizeVal }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-subtle)] hover:scale-[1.04] active:scale-95 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] font-bold border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-primary)]/45 rounded-full shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
              >
                <Hash size={11} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-primary)]" />
                <span>{tag.name}</span>
                <span className="text-[9px] px-1 py-0.2 bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] rounded">
                  {tag.count}
                </span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
