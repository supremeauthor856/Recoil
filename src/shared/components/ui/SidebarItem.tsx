import React from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { useUIStore } from '../../../store/uiStore'

interface SidebarItemProps {
  label: string
  icon?: React.ReactNode
  to?: string
  badge?: string | number
  indent?: number
  active?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export function SidebarItem({
  label,
  icon,
  to,
  badge,
  indent = 0,
  active,
  onClick,
}: SidebarItemProps) {
  const setLeftSidebarOpen = useUIStore(state => state.setLeftSidebarOpen)
  
  const getIndentStyle = () => {
    if (indent === 1) return 'pl-7'
    if (indent === 2) return 'pl-10'
    return 'pl-3.5'
  }

  const commonClass = cn(
    'flex items-center justify-between gap-2.5 group h-[30px] pr-3.5 py-1.5 text-[12px] font-medium transition-all duration-150 select-none rounded-[var(--radius-md)] mx-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
    getIndentStyle(),
    active && 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-highlight)] hover:bg-[var(--color-accent-primary)]/15 font-semibold'
  )

  const innerContent = (
    <>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span className="shrink-0 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
            {icon}
          </span>
        )}
        <span className="truncate">{label}</span>
      </div>

      {badge !== undefined && badge !== null && (
        <span className="font-mono text-[9px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] min-w-[16px] h-4 rounded px-1 flex items-center justify-center border border-[var(--color-border-subtle)]/40 group-hover:bg-[var(--color-bg-hover)]">
          {badge}
        </span>
      )}
    </>
  )

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick(e)
    if (window.innerWidth < 768) {
      setLeftSidebarOpen(false)
    }
  }

  if (to) {
    return (
      <NavLink
        to={to}
        onClick={handleClick}
        className={({ isActive }) =>
          cn(
            'flex items-center justify-between gap-2.5 group h-[30px] pr-3.5 py-1.5 text-[12px] font-medium transition-all duration-150 select-none rounded-[var(--radius-md)] mx-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
            getIndentStyle(),
            (isActive || active) &&
              'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-highlight)] hover:bg-[var(--color-accent-primary)]/15 font-semibold'
          )
        }
      >
        {innerContent}
      </NavLink>
    )
  }

  return (
    <div role="button" tabIndex={0} onClick={handleClick} onKeyDown={(e) => { if (e.key === 'Enter') handleClick(e as any) }} className={cn(commonClass, onClick && 'cursor-pointer', 'w-[calc(100%-8px)] text-left')}>
      {innerContent}
    </div>
  )
}
