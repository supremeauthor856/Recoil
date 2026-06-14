import { forwardRef } from 'react'
import { cn } from '../../utils/cn'
import { ChevronDown } from 'lucide-react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full relative">
        {label && (
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            ref={ref}
            className={cn(
              'w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] h-[32px] px-3 pr-8 appearance-none',
              'focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)]',
              'text-[14px] transition-all duration-150',
              error && 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-2 text-[var(--color-text-muted)] pointer-events-none" size={14} />
        </div>
        {error && (
          <span className="text-xs text-[var(--color-error)]">{error}</span>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
