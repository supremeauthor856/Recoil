import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Search, User, BookOpen, X, ChevronRight, Menu, HelpCircle, CornerDownRight } from 'lucide-react'
import { db } from '../../../services/db'
import { useUIStore } from '../../../store/uiStore'
import { useNavigationStore } from '../../../store/navigationStore'
import type { Character } from '../../types/database'
import type { WritingPiece } from '../../../features/writing/types'

interface SearchResult {
  id: string
  verse_id: string
  verseName: string
  title: string
  type: 'character' | 'lore'
  subtitle?: string
  url: string
}

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verseId } = useParams<{ verseId: string }>()
  const { leftSidebarOpen, setLeftSidebarOpen, openSearchPalette } = useUIStore()
  const { activeVerseId } = useNavigationStore()

  const [searchVal, setSearchVal] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Current Active Verse Meta Info
  const [currentVerseName, setCurrentVerseName] = useState<string | null>(null)

  useEffect(() => {
    const fetchVerseMeta = async () => {
      const vId = verseId || activeVerseId
      if (vId) {
        try {
          const verse = await db.verses.get(vId)
          if (verse) {
            setCurrentVerseName(verse.name)
          } else {
            setCurrentVerseName(null)
          }
        } catch {
          setCurrentVerseName(null)
        }
      } else {
        setCurrentVerseName(null)
      }
    }
    fetchVerseMeta()
  }, [verseId, activeVerseId])

  // Debounce logic for query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchVal.trim())
    }, 200)

    return () => clearTimeout(handler)
  }, [searchVal])

  // Fetch and filter results based on debouncedQuery
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      setIsSearching(false)
      return
    }

    const performSearch = async () => {
      setIsSearching(true)
      try {
        const queryLower = debouncedQuery.toLowerCase()
        
        // 1. Get verses to map names
        const versesList = await db.verses.toArray()
        const verseMap = new Map<string, string>()
        versesList.forEach(v => verseMap.set(v.id, v.name))

        // 2. Query and filter characters
        const matchedChars: SearchResult[] = []
        const characters = await db.characters.toArray()
        characters.forEach((c: Character) => {
          const nameMatches = c.name?.toLowerCase().includes(queryLower)
          const roleMatches = c.role?.toLowerCase().includes(queryLower)
          const descMatches = c.description?.toLowerCase().includes(queryLower)

          if (nameMatches || roleMatches || descMatches) {
            matchedChars.push({
              id: c.id,
              verse_id: c.verse_id,
              verseName: verseMap.get(c.verse_id) || 'Unknown Verse',
              title: c.name,
              type: 'character',
              subtitle: c.role || c.species || 'Character',
              url: `/verse/${c.verse_id}/characters/${c.id}`
            })
          }
        })

        // 3. Query and filter lore entries (WritingPieces of type 'lore-article')
        const matchedLore: SearchResult[] = []
        const writingPieces = await db.writing_pieces.toArray()
        writingPieces.forEach((wp: WritingPiece) => {
          if (wp.type === 'lore-article') {
            const titleMatches = wp.title?.toLowerCase().includes(queryLower)
            const summaryMatches = wp.summary?.toLowerCase().includes(queryLower)

            if (titleMatches || summaryMatches) {
              matchedLore.push({
                id: wp.id,
                verse_id: wp.verse_id,
                verseName: verseMap.get(wp.verse_id) || 'Unknown Verse',
                title: wp.title,
                type: 'lore',
                subtitle: wp.summary || 'Lore Article',
                url: `/verse/${wp.verse_id}/writing/${wp.id}`
              })
            }
          }
        })

        // Priority sorting:
        // - Move items belonging to current active verse to the top
        const activeVId = verseId || activeVerseId
        const combined = [...matchedChars, ...matchedLore].sort((a, b) => {
          if (activeVId) {
            if (a.verse_id === activeVId && b.verse_id !== activeVId) return -1
            if (a.verse_id !== activeVId && b.verse_id === activeVId) return 1
          }
          // fallback to alphabetical title match
          return a.title.localeCompare(b.title)
        })

        setResults(combined)
      } catch (err) {
        console.error('Unified Quick Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [debouncedQuery, verseId, activeVerseId])

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut for focusing this specific search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Single forward slash '/' focusing search bar (unless inside input fields)
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
        setDropdownOpen(true)
      }
      if (e.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dropdownOpen])

  const handleSelectItem = (url: string) => {
    navigate(url)
    setDropdownOpen(false)
    setSearchVal('')
  }

  // Segmenting results
  const charsResults = results.filter(r => r.type === 'character')
  const loreResults = results.filter(r => r.type === 'lore')

  // Generate page-specific breadcrumbs for display in the header
  const renderBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean)
    const isSettings = parts.includes('settings')
    
    if (isSettings) {
      return (
        <span className="flex items-center text-[13px] font-medium text-[var(--color-text-secondary)]">
          Settings <ChevronRight size={12} className="mx-1.5 opacity-50" />
          <span className="text-[var(--color-text-muted)] capitalize">
            {parts[parts.length - 1] === 'settings' ? 'General' : parts[parts.length - 1].replace('-', ' ')}
          </span>
        </span>
      )
    }

    if (currentVerseName) {
      return (
        <span className="flex items-center text-[13px] font-medium text-[var(--color-text-secondary)] truncate">
          <span className="font-semibold text-[var(--color-text-primary)] max-w-[140px] truncate">{currentVerseName}</span>
          {parts.includes('characters') && (
            <>
              <ChevronRight size={12} className="mx-1.5 opacity-40 shrink-0" />
              <span className="text-[var(--color-text-muted)] font-normal">Characters</span>
            </>
          )}
          {parts.includes('writing') && (
            <>
              <ChevronRight size={12} className="mx-1.5 opacity-40 shrink-0" />
              <span className="text-[var(--color-text-muted)] font-normal">Manuscripts</span>
            </>
          )}
          {parts.includes('tools') && (
            <>
              <ChevronRight size={12} className="mx-1.5 opacity-40 shrink-0" />
              <span className="text-[var(--color-text-muted)] font-normal capitalize">
                {parts[parts.length - 1].replace('-', ' ')}
              </span>
            </>
          )}
        </span>
      )
    }

    return (
      <span className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
        Recoil Verse Studio
      </span>
    )
  }

  return (
    <header className="h-[56px] border-b border-[var(--color-border-subtle)]/60 bg-[var(--color-bg-elevated)] flex justify-between items-center px-4 md:px-6 shrink-0 relative z-40 select-none">
      
      {/* Left section: Hamburger (mobile) + Breadcrumbs */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="md:hidden p-1.5 rounded bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors mr-1 cursor-pointer focus:outline-none"
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          {renderBreadcrumbs()}
        </div>
      </div>

      {/* Middle/Right section: Persistent Search Bar */}
      <div ref={containerRef} className="relative w-full max-w-[340px] md:max-w-[400px] mx-3">
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-3 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            className="w-full h-9 pl-9 pr-16 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-lg text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)]/20 transition-all shadow-sm"
            placeholder="Quick search characters or lore..."
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value)
              setDropdownOpen(true)
            }}
            onFocus={() => setDropdownOpen(true)}
          />
          {searchVal ? (
            <button
              onClick={() => {
                setSearchVal('')
                inputRef.current?.focus()
              }}
              className="absolute right-9 p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none"
            >
              <X size={13} />
            </button>
          ) : (
            <div className="absolute right-9 hidden sm:flex items-center gap-0.5 opacity-40 hover:opacity-60 transition-opacity">
              <kbd className="text-[10px] font-mono px-1 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] leading-none select-none p-[2px]">/</kbd>
            </div>
          )}
          
          <button
            onClick={openSearchPalette}
            className="absolute right-3 p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors max-md:hidden focus:outline-none"
            title="Open command palette (⌘K)"
          >
            <HelpCircle size={14} />
          </button>
        </div>

        {/* Floating results Dropdown container */}
        {dropdownOpen && searchVal.trim().length > 0 && (
          <div className="absolute top-[calc(100%+6px)] right-0 left-0 w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] shadow-2xl rounded-xl z-50 flex flex-col overflow-hidden max-h-[420px] scrollbar-custom animate-slide-up">
            
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--color-bg-base)]/60 border-b border-[var(--color-border-subtle)]/40 text-[11px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
              <span>Quick Search Results</span>
              {isSearching ? (
                <span className="text-[10px] lowercase italic animate-pulse">Searching...</span>
              ) : (
                <span className="text-[10px] capitalize font-normal text-[var(--color-text-muted)]">
                  {results.length} found
                </span>
              )}
            </div>

            <div className="overflow-y-auto max-h-[340px] divide-y divide-[var(--color-border-subtle)]/30">
              
              {/* Characters Section */}
              {charsResults.length > 0 && (
                <div className="p-1">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Characters ({charsResults.length})
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {charsResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item.url)}
                        className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <User size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-highlight)] transition-colors truncate">
                              {item.title}
                            </span>
                            <span className="text-[9px] shrink-0 font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] truncate max-w-[100px]">
                              {item.verseName}
                            </span>
                          </div>
                          {item.subtitle && (
                            <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5 font-normal leading-normal">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lore Section */}
              {loreResults.length > 0 && (
                <div className="p-1">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Lore Entries ({loreResults.length})
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {loreResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item.url)}
                        className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <BookOpen size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-highlight)] transition-colors truncate">
                              {item.title}
                            </span>
                            <span className="text-[9px] shrink-0 font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] truncate max-w-[100px]">
                              {item.verseName}
                            </span>
                          </div>
                          {item.subtitle && (
                            <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5 font-normal leading-normal">
                              {item.subtitle.replace(/<[^>]*>/g, '')}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty placeholder */}
              {results.length === 0 && (
                <div className="p-6 text-center text-xs text-[var(--color-text-muted)] flex flex-col items-center justify-center gap-1">
                  <span className="font-semibold text-[var(--color-text-secondary)]">No results match "{searchVal}"</span>
                  <span>Try searching character details, lore titles, or summaries.</span>
                </div>
              )}
            </div>

            {/* Quick palette suggestion footer */}
            <div className="p-2 border-t border-[var(--color-border-subtle)]/40 bg-[var(--color-bg-base)] text-[10px] text-[var(--color-text-muted)] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CornerDownRight size={10} />
                <span>Press <kbd className="font-mono text-[9px] px-0.5">Esc</kbd> to dismiss</span>
              </span>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  openSearchPalette()
                }}
                className="hover:text-[var(--color-text-primary)] transition-colors underline focus:outline-none"
              >
                Launch full command list (⌘K)
              </button>
            </div>

          </div>
        )}
      </div>

    </header>
  )
}
