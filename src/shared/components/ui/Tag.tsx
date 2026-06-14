import { cn } from '../../utils/cn'
import { X } from 'lucide-react'

export interface TagProps {
  label: string
  color?: string
  onRemove?: () => void
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export const Tag = ({ label, color = 'var(--color-accent-primary)', onRemove, onClick, disabled, className }: TagProps) => {
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 h-[22px] px-2 rounded-[var(--radius-sm)] text-[12px] font-medium transition-colors border",
        onClick && !disabled ? "cursor-pointer hover:brightness-110" : "",
        disabled ? "opacity-50 pointer-events-none" : "",
        className
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        color: color,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`
      }}
      onClick={onClick}
    >
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          disabled={disabled}
          className="hover:bg-black/20 rounded-full p-0.5 -mr-1 transition-colors"
        >
          <X size={10} />
        </button>
      )}
    </div>
  )
}
