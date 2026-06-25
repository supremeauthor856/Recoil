import React from 'react'
import { Link } from 'react-router-dom'

export interface TopListItem {
  id: string
  title: string
  subtext: string
  metric: string
  linkPath?: string   // optional navigation route
}

interface TopListCardProps {
  title: string
  items: TopListItem[]
  className?: string
}

export const TopListCard = ({ title, items, className = '' }: TopListCardProps) => {
  return (
    <div
      className={`bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 rounded-xl p-5 flex flex-col gap-4 shadow-sm h-full ${className}`}
    >
      <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] tracking-tight">
        {title}
      </h3>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8 text-xs text-[var(--color-text-muted)] italic">
          No items recorded
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => {
            const rank = index + 1

            const InnerContent = (
              <div className="flex items-center justify-between gap-3 w-full py-1.5 px-2 rounded-lg transition-all duration-100 hover:bg-[var(--color-bg-subtle)]/50">
                {/* Left rank + title elements */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)]/40 flex items-center justify-center text-[10px] font-bold text-[var(--color-text-muted)] select-none">
                    {rank}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">
                      {item.subtext}
                    </span>
                  </div>
                </div>

                {/* Metric score on the right */}
                <span className="text-xs font-bold text-[var(--color-accent-primary)] text-right flex-shrink-0">
                  {item.metric}
                </span>
              </div>
            )

            if (item.linkPath) {
              return (
                <Link key={item.id} to={item.linkPath} className="block select-none">
                  {InnerContent}
                </Link>
              )
            }

            return <div key={item.id}>{InnerContent}</div>
          })}
        </div>
      )}
    </div>
  )
}
