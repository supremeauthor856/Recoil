import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  children: React.ReactNode
}

export const ContextMenu = ({ x, y, onClose, children }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [onClose])

  // Adjust position to stay in viewport
  let posX = x
  let posY = y
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect()
    if (x + rect.width > window.innerWidth) posX = window.innerWidth - rect.width - 8
    if (y + rect.height > window.innerHeight) posY = window.innerHeight - rect.height - 8
  }

  return createPortal(
    <div
      ref={menuRef}
      style={{ left: posX, top: posY }}
      className="fixed z-50 bg-[var(--color-bg-floating)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] shadow-xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
    >
      {children}
    </div>,
    document.body
  )
}

export const ContextMenuItem = ({ 
  label, 
  icon, 
  shortcut, 
  danger = false, 
  onClick 
}: { 
  label: string
  icon?: React.ReactNode
  shortcut?: string
  danger?: boolean
  onClick: () => void 
}) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "w-full h-[32px] px-3 flex items-center gap-2 text-base text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors",
        danger ? "text-[var(--color-error)] hover:bg-[var(--color-error-dim)]" : "hover:bg-[var(--color-bg-hover)]"
      )}
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center pointer-events-none">{icon}</span>}
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-[11px] text-[var(--color-text-muted)] pointer-events-none">{shortcut}</span>}
    </button>
  )
}

export const ContextMenuSeparator = () => (
  <div className="h-px bg-[var(--color-border-default)] my-1" />
)
