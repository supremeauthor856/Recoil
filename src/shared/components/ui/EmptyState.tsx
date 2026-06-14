import { cn } from '../../utils/cn'
import { Button } from './Button'

export interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-16 text-center w-full", className)}>
      <div className="text-[var(--color-text-muted)] mb-4 flex items-center justify-center">
        {/* We assume icon passed in handles its own size (e.g. 48px), wrapping it just in case */}
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[var(--color-text-secondary)] mb-2">{title}</h3>
      {description && (
        <p className="text-base text-[var(--color-text-muted)] max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
