import React from 'react'
import { cn } from '../../utils/cn'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'dim' | 'accent'
  size?: 'xs' | 'sm' | 'md'
  className?: string
  children: React.ReactNode
}

export function Badge({ variant = 'default', size = 'sm', className, children }: BadgeProps) {
  const base = 'inline-flex items-center justify-center font-medium font-mono select-none rounded-[var(--radius-sm)] border tracking-wide uppercase'

  const variants = {
    default: 'bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]',
    success: 'bg-[var(--color-success-dim)] border-[var(--color-success)]/20 text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-dim)] border-[var(--color-warning)]/20 text-[var(--color-warning)]',
    danger: 'bg-[var(--color-error-dim)] border-[var(--color-error)]/20 text-[var(--color-error)]',
    info: 'bg-[var(--color-info-dim)] border-[var(--color-info)]/20 text-[var(--color-info)]',
    dim: 'bg-[var(--color-bg-subtle)] border-transparent text-[var(--color-text-muted)]',
    accent: 'bg-[var(--color-accent-primary-dim)] border-[var(--color-accent-primary)]/20 text-[var(--color-accent-highlight)]'
  }

  const sizes = {
    xs: 'h-4 px-1 text-[8px] leading-none',
    sm: 'h-5 px-1.5 text-[9px] leading-none',
    md: 'h-6 px-2 text-[10px] leading-none'
  }

  return (
    <span className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}
