import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'
import { X } from 'lucide-react'

export interface SheetProps {
  isOpen: boolean
  onClose: () => void
  side?: 'left' | 'right'
  title?: string
  children: React.ReactNode
}

export const Sheet = ({
  isOpen,
  onClose,
  side = 'left',
  title,
  children
}: SheetProps) => {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  const slideClass = side === 'left' ? 'slide-in-from-left' : 'slide-in-from-right'
  const positionClass = side === 'left' ? 'left-0 border-r' : 'right-0 border-l'

  return createPortal(
    <div
      ref={overlayRef}
      onMouseDown={handleOverlayClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
    >
      <div
        className={cn(
          "fixed top-0 bottom-0 w-[80vw] max-w-[320px] bg-[var(--color-bg-floating)] border-[var(--color-border-default)] shadow-2xl flex flex-col",
          "animate-in duration-250 ease-out",
          slideClass,
          positionClass
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--color-border-subtle)] shrink-0">
          {title ? (
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
          ) : <div />}
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1 rounded-md hover:bg-[var(--color-bg-hover)]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-custom p-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
