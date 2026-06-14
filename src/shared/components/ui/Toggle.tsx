import { forwardRef, useId } from 'react'
import { cn } from '../../utils/cn'

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId()
    const inputId = props.id || id
    return (
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="relative flex items-center cursor-pointer">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            className="sr-only peer"
            {...props}
          />
          <div className={cn(
            "w-[36px] h-[20px] bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-full peer",
            "peer-focus:ring-2 peer-focus:ring-[var(--color-accent-primary)] peer-focus:ring-offset-2 peer-focus:ring-offset-[var(--color-bg-base)]",
            "peer-checked:bg-[var(--color-accent-primary)] peer-checked:border-[var(--color-accent-primary)]",
            "transition-all duration-200 ease-in-out",
            className
          )}></div>
          <div className="absolute left-[2px] top-[2px] w-[14px] h-[14px] bg-white rounded-full peer-checked:translate-x-[16px] transition-transform duration-200 ease-in-out"></div>
        </label>
        {label && (
          <span className="text-[14px] text-[var(--color-text-secondary)] select-none cursor-pointer" onClick={() => document.getElementById(inputId)?.click()}>
            {label}
          </span>
        )}
      </div>
    )
  }
)
Toggle.displayName = 'Toggle'
