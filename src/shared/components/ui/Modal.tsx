import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, size = 'md', footer, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md w-full',
    md: 'max-w-lg w-full',
    lg: 'max-w-2xl w-full',
    xl: 'max-w-5xl w-full',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={cn(
          'relative bg-[var(--color-bg-floating)] border border-[var(--color-border-strong)]/40 rounded-[var(--radius-2xl)] shadow-2xl flex flex-col overflow-hidden max-h-[90vh] z-10 transition-all duration-300 transform scale-100 animate-slide-up',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        <div className="h-[52px] px-5 flex items-center justify-between border-b border-[var(--color-border-subtle)]/30 shrink-0">
          <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] tracking-wide">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-custom p-5 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="h-[56px] px-5 bg-[var(--color-bg-elevated)]/20 border-t border-[var(--color-border-subtle)]/30 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
