import React from 'react'
import { Button } from './Button'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dim'
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto h-full min-h-[250px] animate-fade-in', className)}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/65 text-[var(--color-text-secondary)] flex items-center justify-center mb-4 shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6">
        {description}
      </p>
      {action && (
        <Button
          variant={action.variant || 'secondary'}
          size="sm"
          onClick={action.onClick}
          className="font-medium"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
