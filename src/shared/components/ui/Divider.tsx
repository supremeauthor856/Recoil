import { cn } from '../../utils/cn'

export interface DividerProps {
  label?: string
  className?: string
}

export const Divider = ({ label, className }: DividerProps) => {
  if (label) {
    return (
      <div className={cn("flex items-center gap-4 py-2", className)}>
        <div className="flex-1 border-t border-[var(--color-border-subtle)]"></div>
        <span className="text-[12px] text-[var(--color-text-muted)] tracking-wider uppercase font-medium">{label}</span>
        <div className="flex-1 border-t border-[var(--color-border-subtle)]"></div>
      </div>
    )
  }

  return <div className={cn("w-full border-t border-[var(--color-border-subtle)] my-2", className)} />
}
