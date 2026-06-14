import { forwardRef } from 'react'
import { cn } from '../../utils/cn'
import { Spinner } from './Spinner'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: 'bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-[var(--color-text-inverse)] font-medium',
      secondary: 'bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]',
      ghost: 'bg-transparent hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
      danger: 'bg-[var(--color-error)] hover:bg-[var(--color-error)]/90 text-[var(--color-text-inverse)]'
    }

    const sizes = {
      sm: 'h-[28px] px-3 text-sm',
      md: 'h-[32px] px-4 text-base',
      lg: 'h-[40px] px-5 text-md' // md maps to 15px if we follow our custom size list
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-[var(--radius-md)] transition-all duration-150 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-base)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Spinner size="sm" className="mr-2 border-current" />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)
Button.displayName = 'Button'
