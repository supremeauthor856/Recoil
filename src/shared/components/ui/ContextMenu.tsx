import React, { useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  children: React.ReactNode
}

export function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    // Bind the event listener on capture phase to ensure it runs before normal clicks handler
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [onClose])

  // Prevent spilling off screen edges
  const positionStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${Math.min(y, window.innerHeight - 150)}px`,
    left: `${Math.min(x, window.innerWidth - 180)}px`,
  }

  return (
    <div
      ref={menuRef}
      style={positionStyle}
      className="z-50 min-w-[150px] bg-[var(--color-bg-floating)] border border-[var(--color-border-strong)]/40 rounded-[var(--radius-lg)] p-1.5 shadow-xl animate-fade-in flex flex-col gap-0.5 select-none"
    >
      {children}
    </div>
  )
}

interface ContextMenuItemProps {
  label: string
  onClick: () => void
  danger?: boolean
}

export function ContextMenuItem({ label, onClick, danger }: ContextMenuItemProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'w-full text-left px-3 py-1.5 rounded-[var(--radius-sm)] text-[11px] font-medium transition-colors cursor-pointer focus:outline-none',
        danger
          ? 'text-[var(--color-error)] hover:bg-[var(--color-error)]/10'
          : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
      )}
    >
      {label}
    </button>
  )
}

export function ContextMenuSeparator() {
  return <div className="border-t border-[var(--color-border-subtle)]/40 my-1 mx-1" />
}
