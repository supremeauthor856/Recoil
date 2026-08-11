import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation, NavLink } from 'react-router-dom'
import { Search, User, BookOpen, X, ChevronRight, Menu, HelpCircle, CornerDownRight, Bell, Mail, Layers, Sparkles } from 'lucide-react'
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

  const targetVId = verseId || activeVerseId

  // Pill Nav Config
  const navTabs = [
    { label: 'Relationships', path: targetVId ? `/verse/${targetVId}/relationships` : '/' },
    { label: 'Characters', path: targetVId ? `/verse/${targetVId}/characters` : '/' },
    { label: 'Lore', path: targetVId ? `/verse/${targetVId}/lore` : '/' },
    { label: 'Journeys', path: targetVId ? `/verse/${targetVId}` : '/' },
    { label: 'Manuscripts', path: targetVId ? `/verse/${targetVId}/writing` : '/' },
    { label: 'Reports', path: targetVId ? `/verse/${targetVId}/stats` : '/' },
    { label: 'AI Companion', path: targetVId ? `/verse/${targetVId}/ai` : '/' },
    { label: 'Tools', path: targetVId ? `/verse/${targetVId}/tools/lore-expander` : '/settings' },
  ]

  return (
    <header className="h-[64px] border-b border-slate-200/60 dark:border-slate-800 bg-[var(--color-bg-base)] flex justify-between items-center px-4 md:px-8 shrink-0 relative z-40 select-none">
      
      {/* 1. Brand Logo Mark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="md:hidden p-2 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer"
        >
          <Menu size={18} />
        </button>

        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            <Layers size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono leading-none">
              recoil<span className="text-blue-600 dark:text-blue-400">crm</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
              {currentVerseName || 'Universe Studio'}
            </span>
          </div>
        </NavLink>
      </div>

      {/* 2. Center Top Navigation Capsule Pills */}
      <nav className="hidden lg:flex items-center gap-1.5 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-md">
        {navTabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.label === 'Journeys' && (location.pathname === '/' || location.pathname.startsWith('/verse/')))
          
          return (
            <NavLink
              key={tab.label}
              to={tab.path}
              className={({ isActive: linkActive }) => {
                const active = linkActive || (tab.label === 'Journeys' && (location.pathname === '/' || (location.pathname.startsWith('/verse/') && !location.pathname.includes('/characters') && !location.pathname.includes('/lore') && !location.pathname.includes('/writing') && !location.pathname.includes('/relationships') && !location.pathname.includes('/stats') && !location.pathname.includes('/ai') && !location.pathname.includes('/tools'))))
                return `px-4 py-1.5 rounded-full text-xs md:text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/40 dark:hover:bg-slate-700/50'
                }`
              }}
            >
              {tab.label}
            </NavLink>
          )
        })}
      </nav>

      {/* 3. Right Action Bar Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Search Palette Circle */}
        <div ref={containerRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-xs flex items-center justify-center cursor-pointer transition-all hover:scale-105"
            title="Quick Search (Click or /)"
          >
            <Search size={18} />
          </button>

          {/* Quick Search Modal/Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-12 right-0 w-[320px] md:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl z-50 p-3 animate-slide-up">
              <div className="relative flex items-center mb-2">
                <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full h-9 pl-9 pr-8 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Search characters or lore..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  autoFocus
                />
                {searchVal && (
                  <button onClick={() => setSearchVal('')} className="absolute right-2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Search Results */}
              <div className="max-h-[260px] overflow-y-auto space-y-1 scrollbar-custom">
                {results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item.url)}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      {item.type === 'character' ? <User size={14} /> : <BookOpen size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{item.subtitle}</p>
                    </div>
                  </button>
                ))}
                {searchVal && results.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-4">No results found for "{searchVal}"</p>
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                <span>Press Cmd+K for command palette</span>
                <button onClick={openSearchPalette} className="text-blue-600 font-semibold hover:underline">
                  Open ⌘K
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inbox / Messages Icon */}
        <button
          onClick={() => navigate(targetVId ? `/verse/${targetVId}/ai` : '/')}
          className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-xs flex items-center justify-center cursor-pointer transition-all hover:scale-105 relative"
          title="AI Inbox & Workspace"
        >
          <Mail size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
        </button>

        {/* Notifications Bell Icon */}
        <button
          onClick={openSearchPalette}
          className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-xs flex items-center justify-center cursor-pointer transition-all hover:scale-105 relative"
          title="Notifications & Updates"
        >
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-800" />
        </button>

        {/* Profile / Active Verse Avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 p-0.5 shadow-xs cursor-pointer hover:scale-105 transition-transform"
               onClick={() => navigate('/settings')}>
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase">
                {currentVerseName ? currentVerseName.charAt(0) : 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </header>
  )
}
