import React from 'react'
import { IntensityDimension } from '../types'
import { cn } from '../../../shared/utils/cn'

interface IntensitySliderProps {
  dimension: IntensityDimension
  value: number
  onChange: (value: number) => void
  readOnly?: boolean
}

export function IntensitySlider({
  dimension,
  value,
  onChange,
  readOnly = false,
}: IntensitySliderProps) {
  const { label, bipolar, minLabel, maxLabel } = dimension

  // Constants
  const min = bipolar ? -5 : 0
  const max = bipolar ? 5 : 10
  const step = 0.5

  // Percentage calculated for thumb placement
  const pct = bipolar ? ((value + 5) / 10) * 100 : (value / 10) * 100

  // Bipolar value color styling
  const getValueColorClass = () => {
    if (!bipolar) return 'text-[var(--color-text-primary)]'
    if (value > 0) return 'text-emerald-400'
    if (value < 0) return 'text-rose-400'
    return 'text-[var(--color-text-muted)]'
  }

  // Format value label
  const formattedValue = bipolar ? (value > 0 ? `+${value}` : value) : value

  return (
    <div className={cn('w-full flex flex-col gap-1', readOnly && 'opacity-60 pointer-events-none')}>
      {/* Label and Value Row */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-[var(--color-text-secondary)]">
          {label}
        </span>
        <span className={cn('text-[13px] font-bold font-mono', getValueColorClass())}>
          {formattedValue}
        </span>
      </div>

      {/* Slider Track Area */}
      <div className="relative h-6 flex items-center select-none w-full">
        {/* Base Track Line */}
        <div className="absolute left-0 right-0 h-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/20 rounded-full" />

        {/* Center Marker for Bipolar */}
        {bipolar && (
          <div className="absolute left-1/2 -translate-x-1/2 w-[2px] h-3 bg-[var(--color-border-subtle)]/70 z-10" />
        )}

        {/* Dynamic Filled Region */}
        {bipolar ? (
          value > 0 ? (
            <div
              className="absolute h-1 bg-emerald-500/80 rounded-full"
              style={{ left: '50%', width: `${pct - 50}%` }}
            />
          ) : value < 0 ? (
            <div
              className="absolute h-1 bg-rose-500/80 rounded-full"
              style={{ left: `${pct}%`, width: `${50 - pct}%` }}
            />
          ) : null
        ) : (
          <div
            className="absolute h-1 bg-[var(--color-accent-highlight)] rounded-full"
            style={{ left: '0', width: `${pct}%` }}
          />
        )}

        {/* Visual Custom Thumb */}
        <div
          className="absolute w-4 h-4 rounded-full bg-white shadow-md border-2 border-[var(--color-accent-highlight)] -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center transition-all duration-75"
          style={{ left: `${pct}%` }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-highlight)]" />
        </div>

        {/* Real Native Range Input Invisible Overlay */}
        {!readOnly && (
          <input
            id={`slider-${dimension.key}`}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-30"
          />
        )}
      </div>

      {/* Extreme Labels Row */}
      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] italic leading-tight">
        <span className="text-left max-w-[45%] truncate" title={minLabel}>
          {minLabel}
        </span>
        <span className="text-right max-w-[45%] truncate" title={maxLabel}>
          {maxLabel}
        </span>
      </div>
    </div>
  )
}
