import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  children,
  footer
}: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-[400px]',
    md: 'max-w-[560px]',
    lg: 'max-w-[720px]',
    xl: 'max-w-[900px]'
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose()
    }
  }

  return createPortal(
    <div
      ref={overlayRef}
      onMouseDown={handleOverlayClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        className={cn(
          "w-full bg-[var(--color-bg-floating)] border border-[var(--color-border-default)] rounded-[var(--radius-xl)] shadow-2xl flex flex-col",
          "animate-in zoom-in-95 duration-150 ease-out",
          sizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
          </div>
        )}
        <div className="p-6 overflow-y-auto max-h-[70vh] scrollbar-custom">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] rounded-b-[var(--radius-xl)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
