import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full relative">
        {label && (
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-[var(--color-text-muted)] w-[14px]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] h-[32px]',
              'focus:outline-none focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)]',
              'placeholder:text-[var(--color-text-muted)] text-[14px] transition-all duration-150',
              leftIcon ? 'pl-[34px]' : 'pl-3',
              rightIcon ? 'pr-[34px]' : 'pr-3',
              error && 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[var(--color-text-muted)] w-[14px]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs text-[var(--color-error)]">{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
