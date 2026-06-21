import React, { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../../store/uiStore'
import { db } from '../../../services/db'
import { Search, Folder, User, BookOpen, PenTool, LayoutDashboard, Settings } from 'lucide-react'

interface SearchItem {
  id: string
  groupId: string // e.g. verse_id
  groupName: string // e.g. Verse Name
  title: string
  type: 'verse' | 'character' | 'writing' | 'tool' | 'settings' | 'lore'
  url: string
}

export function GlobalCommandPalette() {
  const navigate = useNavigate()
  const { searchPaletteOpen, closeSearchPalette } = useUIStore()
  
  const [items, setItems] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!searchPaletteOpen) return

    const loadItems = async () => {
      setLoading(true)
      try {
        const verses = await db.verses.toArray()
        const characters = await db.characters.toArray()
        const writingPieces = await db.writing_pieces.toArray()
        
        const newItems: SearchItem[] = []
        
        const verseMap = new Map<string, string>()
        
        verses.forEach(v => {
          verseMap.set(v.id, v.name)
          newItems.push({
            id: v.id,
            groupId: 'global',
            groupName: 'Global',
            title: v.name,
            type: 'verse',
            url: `/verse/${v.id}`
          })
        })

        characters.forEach(c => {
          newItems.push({
            id: c.id,
            groupId: c.verse_id,
            groupName: verseMap.get(c.verse_id) || 'Unknown Verse',
            title: c.name,
            type: 'character',
            url: `/verse/${c.verse_id}/characters/${c.id}`
          })
        })

        writingPieces.forEach(w => {
          newItems.push({
            id: w.id,
            groupId: w.verse_id,
            groupName: verseMap.get(w.verse_id) || 'Unknown Verse',
            title: w.title,
            type: w.type === 'lore-article' ? 'lore' : 'writing',
            url: `/verse/${w.verse_id}/writing/${w.id}`
          })
        })
        
        verses.forEach(v => {
          const tools = [
            { path: 'tools/lore-expander', name: 'Lore Expander' },
            { path: 'tools/foreshadowing', name: 'Foreshadowing Planner' },
            { path: 'tools/arc-board', name: 'Arc Status Board' },
            { path: 'tools/headcanon-vault', name: 'Headcanon Vault' },
            { path: 'tools/chapter-summary', name: 'Chapter Summary Generator' },
            { path: 'tools/plot-hole-detector', name: 'Plot Hole Detector' },
            { path: 'verse-map', name: 'Verse Map' },
            { path: 'ai', name: 'AI Workspace' },
          ]
          tools.forEach(t => {
            newItems.push({
              id: `${v.id}-tool-${t.path}`,
              groupId: v.id,
              groupName: v.name,
              title: `${t.name}`,
              type: 'tool',
              url: `/verse/${v.id}/${t.path}`
            })
          })
        })

        newItems.push({
          id: 'settings',
          groupId: 'global',
          groupName: 'Global',
          title: 'Settings',
          type: 'settings',
          url: '/settings'
        })
        
        newItems.push({
          id: 'dashboard',
          groupId: 'global',
          groupName: 'Global',
          title: 'Dashboard',
          type: 'settings',
          url: '/'
        })

        setItems(newItems)
      } catch (err) {
        console.error('Search load failed', err)
      } finally {
        setLoading(false)
      }
    }

    loadItems()
  }, [searchPaletteOpen])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (searchPaletteOpen) {
          closeSearchPalette()
        } else {
          useUIStore.getState().openSearchPalette()
        }
      }
      if (e.key === 'Escape' && searchPaletteOpen) {
        e.preventDefault()
        closeSearchPalette()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [searchPaletteOpen, closeSearchPalette])

  if (!searchPaletteOpen) return null

  const handleSelect = (url: string) => {
    navigate(url)
    closeSearchPalette()
  }

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.groupName]) acc[item.groupName] = []
    acc[item.groupName].push(item)
    return acc
  }, {} as Record<string, SearchItem[]>)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pt-[10vh] pb-4 px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={closeSearchPalette}
      />
      
      {/* Palette */}
      <Command 
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] shadow-2xl"
        label="Global Command Palette"
      >
        <div className="flex items-center border-b border-[var(--color-border-subtle)] px-3">
          <Search className="mr-2 h-5 w-5 text-[var(--color-text-secondary)] shrink-0" />
          <Command.Input 
            autoFocus
            className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:opacity-50 text-[var(--color-text-primary)]"
            placeholder="Search verses, characters, lore, or tools... (or type a command)" 
          />
        </div>
        
        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden pt-2 pb-2 scrollbar-custom">
          <Command.Empty className="py-6 text-center text-sm text-[var(--color-text-secondary)]">
            {loading ? 'Loading...' : 'No results found.'}
          </Command.Empty>
          
          {Object.entries(grouped).map(([groupName, groupItems]) => (
            <Command.Group key={groupName} heading={groupName} className="px-2 text-xs font-medium text-[var(--color-text-secondary)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 ">
              {groupItems.map(item => {
                let Icon = Folder
                if (item.type === 'character') Icon = User
                if (item.type === 'tool') Icon = PenTool
                if (item.type === 'settings') Icon = Settings
                if (item.type === 'verse') Icon = LayoutDashboard
                if (item.type === 'writing') Icon = BookOpen
                if (item.type === 'lore') Icon = BookOpen
                
                // Override edge cases
                if (item.title === 'AI Workspace') Icon = PenTool
                if (item.title === 'Verse Map') Icon = LayoutDashboard

                return (
                  <Command.Item
                    key={item.id}
                    value={`${groupName} ${item.title} ${item.type}`}
                    onSelect={() => handleSelect(item.url)}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none data-[selected=true]:bg-indigo-500/10 data-[selected=true]:text-indigo-400 text-[var(--color-text-primary)] hover:bg-slate-800"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                    <span className="ml-[6px] rounded px-1.5 py-0.5 bg-[var(--color-bg-base)] text-[10px] uppercase text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)] leading-none tracking-wider opacity-60">
                      {item.type}
                    </span>
                  </Command.Item>
                )
              })}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  )
}
