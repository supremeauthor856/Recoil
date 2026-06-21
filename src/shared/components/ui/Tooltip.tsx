import React, { useState, useEffect } from 'react'
import { cn } from '../../utils/cn'

interface TooltipProps {
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  children: React.ReactElement
}

export function Tooltip({ content, side = 'top', children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    // Robust heuristic for touch to prevent tooltip intercepting first taps on mobile
    const checkTouch = () => {
      const hasTouchParams = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsTouch(hasTouchParams)
    }
    checkTouch()
  }, [])

  const sideStyle = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  }

  const arrowStyle = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--color-bg-floating)] border-x-transparent border-t-4 border-x-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--color-bg-floating)] border-y-transparent border-r-4 border-y-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--color-bg-floating)] border-x-transparent border-b-4 border-x-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--color-bg-floating)] border-y-transparent border-l-4 border-y-4',
  }

  return (
    <div
      onMouseEnter={isTouch ? undefined : () => setIsVisible(true)}
      onMouseLeave={isTouch ? undefined : () => setIsVisible(false)}
      onFocus={isTouch ? undefined : () => setIsVisible(true)}
      onBlur={isTouch ? undefined : () => setIsVisible(false)}
      className="relative inline-flex items-center justify-center"
    >
      {children}
      {isVisible && !isTouch && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 bg-[var(--color-bg-floating)] border border-[var(--color-border-strong)]/30 text-white text-[10px] uppercase tracking-wider font-semibold rounded-[var(--radius-sm)] shadow-lg whitespace-nowrap pointer-events-none animate-fade-in',
            sideStyle[side]
          )}
        >
          {content}
          <div className={cn('absolute w-0 h-0 border-solid', arrowStyle[side])} />
        </div>
      )}
    </div>
  )
}
