import React from 'react'
import { cn } from '../../utils/cn'

export interface DividerProps {
  label?: string
  className?: string
}

export function Divider({ label, className }: DividerProps) {
  return (
    <div className={cn('relative flex py-2 items-center w-full select-none', className)}>
      <div className="flex-grow border-t border-[var(--color-border-subtle)]/50" />
      {label && (
        <span className="flex-shrink mx-4 text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex-grow border-t border-[var(--color-border-subtle)]/50" />
    </div>
  )
}
