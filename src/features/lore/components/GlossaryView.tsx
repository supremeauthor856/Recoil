import React, { useMemo } from 'react'
import { LoreEntry } from '../types'
import { LoreCard } from './LoreCard'

interface GlossaryViewProps {
  entries: LoreEntry[]
  onDelete: (id: string) => void
  onTogglePin: (id: string, isPinned: boolean) => void
}

export const GlossaryView: React.FC<GlossaryViewProps> = ({
  entries,
  onDelete,
  onTogglePin,
}) => {
  // Group entries by uppercase first letter of title
  const groups = useMemo(() => {
    const map: Record<string, LoreEntry[]> = {}
    
    for (const entry of entries) {
      if (!entry.title) continue
      const firstChar = entry.title.trim()[0] || '#'
      const letter = firstChar.toUpperCase()
      const groupKey = /^[A-Z]$/.test(letter) ? letter : '#'
      
      if (!map[groupKey]) {
        map[groupKey] = []
      }
      map[groupKey].push(entry)
    }

    // Sort group keys alphabetically, with '#' at the end
    const keys = Object.keys(map).sort((a, b) => {
      if (a === '#') return 1
      if (b === '#') return -1
      return a.localeCompare(b)
    })

    return keys.map((key) => ({
      letter: key,
      entries: map[key].sort((a, b) => a.title.localeCompare(b.title)),
    }))
  }, [entries])

  // Get list of active letters
  const activeLetters = useMemo(
    () => new Set(groups.map((g) => g.letter)),
    [groups]
  )

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')

  const handleLetterClick = (letter: string) => {
    const element = document.getElementById(`glossary-letter-${letter}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-[12px] text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-bg-subtle)]/30">
        No entries match the Glossary categories. Add concepts, rules, items, or creatures to list them here.
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start relative select-none">
      {/* Alphabet quick jump index sidebar */}
      <div className="flex md:flex-col gap-1 md:gap-1.5 flex-wrap md:flex-nowrap justify-center p-3 rounded-xl border border-[var(--color-border-subtle)]/50 bg-[var(--color-bg-elevated)] md:sticky md:top-24 w-full md:w-12 shrink-0 md:max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-none shadow-sm">
        {alphabet.map((letter) => {
          const isActive = activeLetters.has(letter)
          return (
            <button
              key={letter}
              disabled={!isActive}
              onClick={() => handleLetterClick(letter)}
              className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-mono font-semibold transition-colors ${
                isActive
                  ? 'text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-dim)] cursor-pointer font-bold'
                  : 'text-[var(--color-text-muted)]/30 cursor-not-allowed'
              }`}
            >
              {letter}
            </button>
          )
        })}
      </div>

      {/* Glossary sections main body */}
      <div className="flex-1 flex flex-col gap-8 w-full">
        {groups.map(({ letter, entries: groupEntries }) => (
          <div
            key={letter}
            id={`glossary-letter-${letter}`}
            className="flex flex-col gap-3 scroll-mt-24"
          >
            {/* Elegant big letter heading */}
            <div className="flex items-center gap-3">
              <span className="text-[24px] font-mono font-semibold text-[var(--color-text-muted)] leading-none select-none">
                {letter}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-[var(--color-border-subtle)] to-transparent" />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupEntries.map((entry) => (
                <LoreCard
                  key={entry.id}
                  entry={entry}
                  onDelete={onDelete}
                  onTogglePin={onTogglePin}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
