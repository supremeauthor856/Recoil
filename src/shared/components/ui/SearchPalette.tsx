import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUIStore } from '../../../store/uiStore'
import { cn } from '../../utils/cn'
import { Search } from 'lucide-react'

export const SearchPalette = () => {
  const isOpen = useUIStore(state => state.searchPaletteOpen)
  const close = useUIStore(state => state.closeSearchPalette)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    } else if (!isOpen) {
      setQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) close()
  }

  // Placeholder for internal state representation
  const activeTab = 'All'
  const filters = ['All', 'Characters', 'Lore', 'Writing', 'Conversations']

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex animate-in fade-in duration-200"
      onMouseDown={handleOverlayClick}
    >
      <div className="absolute top-[20vh] left-1/2 -translate-x-1/2 w-[560px] max-h-[400px] bg-[var(--color-bg-floating)] border border-[var(--color-border-default)] rounded-[var(--radius-xl)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        <div className="flex items-center px-4 h-[52px]">
          <Search size={20} className="text-[var(--color-text-muted)] mr-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] h-full"
          />
        </div>
        
        <div className="h-px bg-[var(--color-border-default)] w-full" />
        
        <div className="flex items-center px-4 py-2 gap-2 overflow-x-auto scrollbar-none border-b border-[var(--color-border-subtle)] shrink-0">
          {filters.map(filter => (
            <button
              key={filter}
              className={cn(
                "px-2 py-1 rounded-[var(--radius-sm)] text-[11px] font-medium transition-colors",
                activeTab === filter 
                  ? "bg-[var(--color-bg-active)] text-[var(--color-text-primary)]" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-custom p-2">
          {/* Empty State placeholder */}
          <div className="flex items-center justify-center h-24 text-[13px] text-[var(--color-text-muted)]">
            {query ? 'No results found.' : 'Start typing to search...'}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
