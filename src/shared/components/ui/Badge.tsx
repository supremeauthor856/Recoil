import { cn } from '../../utils/cn'

export interface BadgeProps {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}

export const Badge = ({ variant = 'default', size = 'md', className, children }: BadgeProps) => {
  const variants = {
    default: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]',
    accent: 'bg-[var(--color-accent-primary-dim)] text-[var(--color-accent-highlight)]',
    success: 'bg-[var(--color-success-dim)] text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]',
    error: 'bg-[var(--color-error-dim)] text-[var(--color-error)]',
    info: 'bg-[var(--color-info-dim)] text-[var(--color-info)]',
  }

  const sizes = {
    sm: 'h-[14px] px-1.5 text-xs',
    md: 'h-[18px] px-2 text-sm',
    lg: 'h-[22px] px-2.5 text-base',
  }

  return (
    <span className={cn(
      "inline-flex items-center justify-center rounded-[var(--radius-full)] font-medium whitespace-nowrap",
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  )
}
