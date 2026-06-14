import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils/cn'

export interface TooltipProps {
  children: React.ReactNode
  content: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export const Tooltip = ({ children, content, side = 'top', delay = 250 }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const OFFSET = 8
        let x = 0, y = 0

        // We will roughly center it, we can refine this with ResizeObserver later if needed
        if (side === 'top') {
          x = rect.left + rect.width / 2
          y = rect.top - OFFSET
        } else if (side === 'bottom') {
          x = rect.left + rect.width / 2
          y = rect.bottom + OFFSET
        } else if (side === 'left') {
          x = rect.left - OFFSET
          y = rect.top + rect.height / 2
        } else if (side === 'right') {
          x = rect.right + OFFSET
          y = rect.top + rect.height / 2
        }

        setCoords({ x, y })
        setIsVisible(true)
      }
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const translateClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2'
  }

  return (
    <>
      <div 
        ref={triggerRef} 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave} 
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div 
          className={cn(
            "fixed z-[9999] pointer-events-none px-2 py-1 bg-[var(--color-bg-floating)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] shadow-xl",
            "text-[12px] text-[var(--color-text-secondary)] whitespace-nowrap max-w-[200px]",
            "animate-in fade-in duration-100",
            translateClasses[side]
          )}
          style={{ left: coords.x, top: coords.y }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  )
}
