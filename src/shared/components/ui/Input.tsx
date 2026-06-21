import React, { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold text-[var(--color-text-secondary)] select-none">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          id={id}
          className={cn(
            'w-full h-[34px] px-3 bg-[var(--color-bg-base)] border border-[var(--color-border-strong)]/40 rounded-[var(--radius-md)] text-[12px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)]/80 focus:ring-1 focus:ring-[var(--color-accent-primary)]/40 transition-shadow',
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

Input.displayName = 'Input'
