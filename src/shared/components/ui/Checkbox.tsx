import { forwardRef, useId } from 'react'
import { cn } from '../../utils/cn'
import { Check } from 'lucide-react'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId()
    const inputId = props.id || id
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-4 h-4">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            className={cn(
              'peer appearance-none w-4 h-4 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-transparent',
              'checked:bg-[var(--color-accent-primary)] checked:border-[var(--color-accent-primary)]',
              'hover:border-[var(--color-border-strong)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-base)]',
              'transition-all duration-150 cursor-pointer',
              className
            )}
            {...props}
          />
          <Check size={12} className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-150" />
        </div>
        {label && (
          <label htmlFor={inputId} className="text-[14px] text-[var(--color-text-secondary)] cursor-pointer select-none">
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'
