import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}

export const Dropdown = ({ trigger, children, align = 'right' }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  // Simple hardcoded positioning for now instead of full floating-ui
  return (
    <div className="relative inline-block" ref={triggerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className={cn(
          "absolute top-full mt-1 z-50 bg-[var(--color-bg-floating)] border border-[var(--color-border-default)] rounded-[var(--radius-md)] shadow-xl py-1 min-w-[180px]",
          align === 'right' ? 'right-0' : 'left-0',
          "animate-in fade-in zoom-in-95 duration-100"
        )}>
          {children}
        </div>
      )}
    </div>
  )
}

export const DropdownItem = ({ 
  label, 
  icon, 
  onClick 
}: { 
  label: React.ReactNode
  icon?: React.ReactNode
  onClick?: () => void 
}) => {
  return (
    <div
      onClick={onClick}
      className="w-full h-[32px] px-3 flex items-center gap-2 text-base text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
    >
      {icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
      <span className="flex-1 text-left">{label}</span>
    </div>
  )
}
