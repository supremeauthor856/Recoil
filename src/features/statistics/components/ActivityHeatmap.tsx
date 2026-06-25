import React, { useState, useRef, useEffect } from 'react'
import { ActivityDay, HEATMAP_LEVELS } from '../types'

interface ActivityHeatmapProps {
  activityDays: ActivityDay[]
}

export const ActivityHeatmap = ({ activityDays }: ActivityHeatmapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedCell, setSelectedCell] = useState<{ date: string; count: number; x: number; y: number } | null>(null)

  // 1. Core measurements
  const cellSize = 12
  const gap = 2
  const labelWidth = 24
  const labelHeight = 20
  const width = labelWidth + 52 * (cellSize + gap)
  const height = labelHeight + 7 * (cellSize + gap)

  // 2. Build 52x7 date grid starting 364 days ago on nearest Monday
  const today = new Date()
  const startDate = new Date(today.getTime() - 363 * 24 * 60 * 60 * 1000)
  const dayOfWeek = startDate.getDay() // 0 = Sunday, 1 = Monday,...
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  startDate.setDate(startDate.getDate() - daysToSubtract)

  const dateMap = new Map<string, number>()
  activityDays.forEach((d) => dateMap.set(d.date, d.count))

  const cells: { date: string; count: number; week: number; day: number }[] = []
  for (let w = 0; w < 52; w++) {
    for (let d = 0; d < 7; d++) {
      const current = new Date(startDate.getTime() + (w * 7 + d) * 24 * 60 * 60 * 1000)
      const dateStr = current.toISOString().slice(0, 10)
      const count = dateMap.get(dateStr) ?? 0
      cells.push({ date: dateStr, count, week: w, day: d })
    }
  }

  // 3. Count total active days
  const activeDaysCount = activityDays.filter((d) => d.count > 0).length

  // Find most active day
  const mostActiveDateObj = activityDays.length > 0
    ? activityDays.reduce((max, d) => (d.count > max.count ? d : max), activityDays[0])
    : null

  const getLevel = (count: number): number => {
    if (count <= 0) return 0
    if (count <= 2) return 1
    if (count <= 5) return 2
    if (count <= 9) return 3
    return 4
  }

  // 4. Compute Month markers safely without overlapping
  const monthLabels: { text: string; col: number }[] = []
  let lastMonth = -1
  for (let w = 0; w < 52; w++) {
    const current = new Date(startDate.getTime() + w * 7 * 24 * 60 * 60 * 1000)
    const month = current.getMonth()
    if (month !== lastMonth) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      monthLabels.push({ text: months[month], col: w })
      lastMonth = month
    }
  }

  let lastPlacedCol = -4
  const safeMonthLabels = monthLabels.filter((item) => {
    if (item.col - lastPlacedCol >= 3) {
      lastPlacedCol = item.col
      return true
    }
    return false
  })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleCellClick = (e: React.MouseEvent<SVGRectElement>, date: string, count: number) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()

    if (containerRect) {
      setSelectedCell({
        date,
        count,
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height + 6,
      })
    }
  }

  // Close tooltip when clicking elsewhere
  useEffect(() => {
    const handleGlobalClick = () => setSelectedCell(null)
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-6 flex flex-col gap-4 w-full shadow-sm"
    >
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Activity Heatmap
          </h3>
          <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {activeDaysCount} active days in the past year
          </span>
        </div>
        {mostActiveDateObj && mostActiveDateObj.count > 0 && (
          <span className="text-[11px] text-[var(--color-text-muted)] font-medium sm:text-right">
            Most active: <strong className="text-[var(--color-text-secondary)]">{formatDate(mostActiveDateObj.date)}</strong> ({mostActiveDateObj.count} updates)
          </span>
        )}
      </div>

      {/* SVG Grid Containment */}
      <div className="w-full overflow-x-auto scrollbar-custom pb-2">
        <div className="relative" style={{ width: `${width}px` }}>
          <svg width={width} height={height} className="overflow-visible select-none">
            {/* Safe Months rendering */}
            {safeMonthLabels.map((m, idx) => (
              <text
                key={`month-${idx}`}
                x={labelWidth + m.col * (cellSize + gap)}
                y={12}
                className="text-[9px] fill-[var(--color-text-muted)] font-medium"
              >
                {m.text}
              </text>
            ))}

            {/* Weekday indicators on the left (M, W, F) */}
            <text x={2} y={labelHeight + 0 * (cellSize + gap) + 10} className="text-[9px] fill-[var(--color-text-muted)] font-medium">
              M
            </text>
            <text x={2} y={labelHeight + 2 * (cellSize + gap) + 10} className="text-[9px] fill-[var(--color-text-muted)] font-medium">
              W
            </text>
            <text x={2} y={labelHeight + 4 * (cellSize + gap) + 10} className="text-[9px] fill-[var(--color-text-muted)] font-medium">
              F
            </text>

            {/* Grid Elements */}
            {cells.map((cell) => {
              const level = getLevel(cell.count)
              const cellX = labelWidth + cell.week * (cellSize + gap)
              const cellY = labelHeight + cell.day * (cellSize + gap)
              const isSelected = selectedCell?.date === cell.date

              return (
                <rect
                  key={cell.date}
                  x={cellX}
                  y={cellY}
                  width={cellSize}
                  height={cellSize}
                  rx={2.5}
                  ry={2.5}
                  fill={HEATMAP_LEVELS[level]}
                  className={`cursor-pointer transition-all stroke-[1.5px] ${
                    isSelected
                      ? 'stroke-[var(--color-accent-primary)] shadow-md scale-105'
                      : 'stroke-transparent hover:stroke-[var(--color-border-default)]'
                  }`}
                  onClick={(e) => handleCellClick(e, cell.date, cell.count)}
                />
              )
            })}
          </svg>
        </div>
      </div>

      {/* Footnote & Legend */}
      <div className="flex justify-between items-center text-[10px] text-[var(--color-text-muted)] mt-1">
        <span>Click any square to inspect activity on that day.</span>
        <div className="flex items-center gap-1.5 select-none font-medium">
          <span>Less</span>
          {HEATMAP_LEVELS.map((col, i) => (
            <div
              key={`legend-${i}`}
              className="w-3 h-3 rounded-[2.5px] border border-black/10"
              style={{ backgroundColor: col }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Touch-safe, absolute-positioned overlay tooltip */}
      {selectedCell && (
        <div
          className="absolute z-10 bg-[var(--color-bg-floating)] border border-[var(--color-border-default)] rounded-lg px-3 py-1.5 shadow-xl text-center flex flex-col gap-0.5"
          style={{
            left: `${selectedCell.x}px`,
            top: `${selectedCell.y}px`,
            transform: 'translateX(-50%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">
            {formatDate(selectedCell.date)}
          </span>
          <span className="text-xs font-bold text-[var(--color-accent-primary)] whitespace-nowrap">
            {selectedCell.count === 0 ? 'No activity' : `${selectedCell.count} update${selectedCell.count === 1 ? '' : 's'}`}
          </span>
        </div>
      )}
    </div>
  )
}
