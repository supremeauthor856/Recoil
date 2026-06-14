import { forwardRef, useState, useEffect } from 'react'
import { cn } from '../../utils/cn'

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, min = 0, max = 100, step = 1, value, defaultValue, onChange, ...props }, ref) => {
    const [current, setCurrent] = useState<number>(Number(value || defaultValue || min))

    useEffect(() => {
      if (value !== undefined) {
        setCurrent(Number(value))
      }
    }, [value])

    const calculatePercentage = (val: number) => {
      return ((val - Number(min)) / (Number(max) - Number(min))) * 100
    }

    const percentage = calculatePercentage(current)

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <div className="flex justify-between items-center text-xs font-medium text-[var(--color-text-secondary)]">
            <label>{label}</label>
            <span>{current}</span>
          </div>
        )}
        <div className="relative w-full h-4 flex items-center">
          {/* Background Track */}
          <div className="absolute w-full h-1 bg-[var(--color-bg-elevated)] rounded-full pointer-events-none" />
          {/* Fill Track */}
          <div 
            className="absolute h-1 bg-[var(--color-accent-primary)] rounded-full pointer-events-none"
            style={{ width: `${percentage}%` }}
          />
          <input
            type="range"
            ref={ref}
            min={min}
            max={max}
            step={step}
            value={current}
            onChange={(e) => {
              setCurrent(Number(e.target.value))
              if (onChange) onChange(e)
            }}
            className={cn(
              "w-full h-full appearance-none bg-transparent cursor-pointer relative z-10 focus:outline-none",
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
              "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-accent-primary)]",
              "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:shadow-[0_0_0_4px_rgba(123,94,167,0.15)]",
              "[&::-webkit-slider-thumb]:transition-shadow",
              className
            )}
            {...props}
          />
        </div>
      </div>
    )
  }
)
Slider.displayName = 'Slider'
