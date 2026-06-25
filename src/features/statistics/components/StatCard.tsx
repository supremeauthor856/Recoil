import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
  accentColor?: string    // CSS variable or hex — if set, icon + value use this color
  trend?: { value: number; label: string }   // optional trend indicator
  className?: string
}

export const StatCard = ({
  label,
  value,
  subtext,
  icon,
  accentColor,
  trend,
  className = '',
}: StatCardProps) => {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value

  // Inline styling for accentColor or fallback
  const accentStyleIcon = accentColor ? { color: accentColor } : undefined
  const accentStyleValue = accentColor ? { color: accentColor } : undefined

  return (
    <div
      className={`bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl px-5 py-4 flex flex-col gap-1.5 transition-all duration-150 hover:border-[var(--color-border-default)] shadow-sm ${className}`}
    >
      {/* Target header section */}
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 text-[var(--color-text-muted)]" style={accentStyleIcon}>
          {icon}
        </div>
        <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          {label}
        </span>
      </div>

      {/* Metric value */}
      <div
        className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]"
        style={accentStyleValue}
      >
        {formattedValue}
      </div>

      {/* Sub-labeling text */}
      {subtext && (
        <span className="text-xs text-[var(--color-text-muted)] min-h-[16px] leading-relaxed">
          {subtext}
        </span>
      )}

      {/* Trend indicator if specified */}
      {trend && (
        <div className="mt-1 flex items-center">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              trend.value > 0
                ? 'bg-emerald-500/10 text-emerald-400'
                : trend.value < 0
                ? 'bg-rose-500/10 text-rose-400'
                : 'bg-zinc-500/10 text-zinc-400'
            }`}
          >
            {trend.value > 0 ? (
              <span className="font-mono">↑</span>
            ) : trend.value < 0 ? (
              <span className="font-mono">↓</span>
            ) : (
              <span className="font-mono">-</span>
            )}
            <span>{trend.label}</span>
          </span>
        </div>
      )}
    </div>
  )
}
