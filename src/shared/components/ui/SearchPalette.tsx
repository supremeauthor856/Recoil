import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as LucideIcons from 'lucide-react'
import { cn } from '../../utils/cn'
import { useUIStore } from '../../../store/uiStore'
import { useNavigationStore } from '../../../store/navigationStore'
import { searchService, recentSearches, getResultPath, getResultNavState,
         SEARCH_TYPE_LABELS, SEARCH_TYPE_ICONS } from '../../../services/searchService'
import type { SearchResult, SearchResultType } from '../../../services/searchService'

// ─── LOCAL DEBOUNCE HOOK ──────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// ─── FILTER CHIPS ─────────────────────────────────────────────────────────────
const FILTER_OPTIONS: Array<{ id: SearchResultType | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'character', label: 'Characters' },
  { id: 'writing', label: 'Writing' },
  { id: 'lore', label: 'Lore' },
  { id: 'conversation', label: 'Conversations' },
  { id: 'arc', label: 'Arcs' },
]

// ─── ICON RESOLVER ────────────────────────────────────────────────────────────
function DynIcon({ name, className }: { name: string; className?: string }) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  const Icon = icons[name]
  if (!Icon) return <LucideIcons.File className={className} />
  return <Icon className={className} />
}

// ─── LOCAL SPINNER ────────────────────────────────────────────────────────────
function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-3',
  }
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-transparent border-[var(--color-accent-primary)]',
        sizeClasses[size]
      )}
    />
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function SearchPalette() {
  const { searchPaletteOpen, closeSearchPalette } = useUIStore()
  const { activeVerseId } = useNavigationStore()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<SearchResultType | 'all'>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recent, setRecent] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const debouncedQuery = useDebounce(query, 180)

  // ─── LOAD RECENT ON OPEN ──────────────────────────────────────────────────
  useEffect(() => {
    if (searchPaletteOpen) {
      setRecent(recentSearches.get())
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setActiveFilter('all')
      setError(null)
      // Focus input after animation frame
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [searchPaletteOpen])

  // ─── SEARCH ON DEBOUNCED QUERY CHANGE ─────────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery.trim() || !activeVerseId) {
      setResults([])
      setSelectedIndex(0)
      return
    }

    let cancelled = false

    const doSearch = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const types = activeFilter === 'all'
          ? undefined
          : [activeFilter] as SearchResultType[]
        const data = await searchService.search(activeVerseId, debouncedQuery, types)
        if (!cancelled) {
          setResults(data)
          setSelectedIndex(0)
        }
      } catch {
        if (!cancelled) setError('Search failed. Try again.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    doSearch()
    return () => { cancelled = true }
  }, [debouncedQuery, activeFilter, activeVerseId])

  // ─── DISPLAY ITEMS (results or recent) ────────────────────────────────────
  const hasQuery = query.trim().length > 0
  const displayItems: SearchResult[] = hasQuery ? results : recent

  // ─── NAVIGATE TO RESULT ───────────────────────────────────────────────────
  const navigateTo = useCallback((result: SearchResult) => {
    if (!activeVerseId) return
    recentSearches.add(result)
    setRecent(recentSearches.get())
    const path = getResultPath(result, activeVerseId)
    const state = getResultNavState(result)
    navigate(path, state ? { state } : undefined)
    closeSearchPalette()
  }, [activeVerseId, navigate, closeSearchPalette])

  // ─── KEYBOARD NAVIGATION ──────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      closeSearchPalette()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, displayItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (displayItems[selectedIndex]) {
        navigateTo(displayItems[selectedIndex])
      }
    }
  }, [displayItems, selectedIndex, navigateTo, closeSearchPalette])

  // ─── SCROLL SELECTED INTO VIEW ────────────────────────────────────────────
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const selected = list.children[selectedIndex] as HTMLElement | undefined
    selected?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // ─── BACKDROP CLICK ───────────────────────────────────────────────────────
  if (!searchPaletteOpen) return null

  const grouped = displayItems.reduce<Record<string, SearchResult[]>>((acc, item) => {
    const key = item.type
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const groupOrder: SearchResultType[] = ['character', 'writing', 'lore', 'conversation', 'arc', 'headcanon', 'foreshadowing']

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onPointerDown={e => { if (e.target === e.currentTarget) closeSearchPalette() }}
    >
      <div
        className="w-full max-w-[560px] rounded-xl border overflow-hidden shadow-2xl flex flex-col"
        style={{
          maxHeight: '480px',
          background: 'var(--color-bg-floating)',
          borderColor: 'var(--color-border-default)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
      >
        {/* ── SEARCH INPUT ─────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4"
          style={{ borderBottom: '1px solid var(--color-border-subtle)', height: '52px' }}
        >
          {isLoading
            ? <Spinner size="sm" />
            : <LucideIcons.Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search everything..."
            aria-label="Search"
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
              className="p-1 rounded"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Clear search"
            >
              <LucideIcons.X className="w-4 h-4" />
            </button>
          )}
          <kbd
            className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px]"
            style={{
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border-default)',
            }}
          >
            Esc
          </kbd>
        </div>

        {/* ── FILTER CHIPS ─────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-1 px-3 overflow-x-auto"
          style={{
            borderBottom: '1px solid var(--color-border-subtle)',
            height: '36px',
            scrollbarWidth: 'none',
          }}
        >
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => { setActiveFilter(opt.id as typeof activeFilter); setSelectedIndex(0) }}
              className={cn(
                'flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
              )}
              style={{
                background: activeFilter === opt.id
                  ? 'var(--color-accent-primary-dim)'
                  : 'transparent',
                color: activeFilter === opt.id
                  ? 'var(--color-text-accent)'
                  : 'var(--color-text-secondary)',
                border: activeFilter === opt.id
                  ? '1px solid var(--color-border-accent)'
                  : '1px solid transparent',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── RESULTS ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          {!error && !hasQuery && recent.length === 0 && (
            <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Start typing to search across all your content
            </p>
          )}

          {!error && !hasQuery && recent.length > 0 && (
            <div>
              <div
                className="flex items-center justify-between px-4 pt-2 pb-1"
              >
                <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                  Recent
                </span>
                <button
                  onClick={() => { recentSearches.clear(); setRecent([]) }}
                  className="text-[11px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Clear
                </button>
              </div>
              <ul ref={listRef} role="listbox">
                {recent.map((item, i) => (
                  <SearchResultRow
                    key={`${item.type}-${item.id}`}
                    result={item}
                    isSelected={i === selectedIndex}
                    onSelect={() => navigateTo(item)}
                    onHover={() => setSelectedIndex(i)}
                    showType
                  />
                ))}
              </ul>
            </div>
          )}

          {!error && hasQuery && displayItems.length === 0 && !isLoading && (
            <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No results for <strong style={{ color: 'var(--color-text-secondary)' }}>"{query}"</strong>
            </p>
          )}

          {!error && hasQuery && displayItems.length > 0 && (
            <ul ref={listRef} role="listbox">
              {groupOrder.map(groupType => {
                const groupItems = grouped[groupType]
                if (!groupItems?.length) return null
                return (
                  <li key={groupType}>
                    <div
                      className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-widest"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {SEARCH_TYPE_LABELS[groupType]}
                    </div>
                    <ul>
                      {groupItems.map(item => {
                        const globalIdx = displayItems.indexOf(item)
                        return (
                          <SearchResultRow
                            key={`${item.type}-${item.id}`}
                            result={item}
                            isSelected={globalIdx === selectedIndex}
                            onSelect={() => navigateTo(item)}
                            onHover={() => setSelectedIndex(globalIdx)}
                          />
                        )
                      })}
                    </ul>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            borderTop: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-muted)',
          }}
        >
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <kbd className="px-1 rounded" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)' }}>↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 rounded" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)' }}>↵</kbd>
              open
            </span>
          </div>
          {!activeVerseId && (
            <span className="text-[11px]" style={{ color: 'var(--color-warning)' }}>
              Select a verse to search its content
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── RESULT ROW ───────────────────────────────────────────────────────────────
interface SearchResultRowProps {
  result: SearchResult
  isSelected: boolean
  onSelect: () => void
  onHover: () => void
  showType?: boolean
}

function SearchResultRow({
  result, isSelected, onSelect, onHover, showType,
}: SearchResultRowProps) {
  const iconName = SEARCH_TYPE_ICONS[result.type]

  return (
    <li
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      onPointerEnter={onHover}
      className="flex items-center gap-3 px-4 cursor-pointer transition-colors"
      style={{
        height: '44px',
        background: isSelected ? 'var(--color-bg-active)' : 'transparent',
      }}
    >
      <DynIcon
        name={iconName}
        className="w-4 h-4 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm truncate font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {result.title}
        </p>
        {result.subtitle && (
          <p
            className="text-[11px] truncate"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {result.subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {result.meta && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{
              background: 'var(--color-bg-hover)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {result.meta}
          </span>
        )}
        {showType && (
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {SEARCH_TYPE_LABELS[result.type]}
          </span>
        )}
        {isSelected && (
          <LucideIcons.CornerDownLeft
            className="w-3 h-3"
            style={{ color: 'var(--color-text-muted)' }}
          />
        )}
      </div>
    </li>
  )
}
