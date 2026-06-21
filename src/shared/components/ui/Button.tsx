import React, { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dim'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'secondary',
      size = 'md',
      leftIcon,
      rightIcon,
      loading,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyle =
      'inline-flex items-center justify-center font-medium rounded-[var(--radius-lg)] transition-all duration-200 select-none cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 shrink-0'

    const variants = {
      primary:
        'bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white shadow-sm hover:shadow active:scale-[0.98]',
      secondary:
        'border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]',
      danger:
        'bg-[var(--color-error)] hover:bg-[var(--color-error)]/90 text-white shadow-sm hover:shadow active:scale-[0.98]',
      ghost:
        'bg-transparent hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
      dim:
        'bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-dim)]/80',
    }

    const sizes = {
      sm: 'h-8 px-3 text-[12px] gap-1.5',
      md: 'h-9 px-4 text-[13px] gap-2',
      lg: 'h-10 px-5 text-[14px] font-semibold gap-2.5',
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(baseStyle, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-3.5 w-3.5 text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
