import React, { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 3, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold text-[var(--color-text-secondary)] select-none">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={cn(
            'w-full p-3 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)]/40 rounded-[var(--radius-md)] text-[12px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]/80 focus:ring-1 focus:ring-[var(--color-accent-primary)]/40 transition-shadow resize-y min-h-[60px]',
            error && 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/30',
            props.disabled && 'opacity-60 cursor-not-allowed bg-transparent',
            className
          )}
          {...props}
        />
        {error && <span className="text-[10px] text-[var(--color-error)]">{error}</span>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
