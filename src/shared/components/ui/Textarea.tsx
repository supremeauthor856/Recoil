import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full relative">
        {label && (
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] min-h-[80px] p-3',
            'focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)]',
            'placeholder:text-[var(--color-text-muted)] text-[14px] transition-all duration-150 resize-y',
            'scrollbar-custom',
            error && 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-[var(--color-error)]">{error}</span>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
