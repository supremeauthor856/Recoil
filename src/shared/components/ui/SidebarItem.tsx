import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

export interface SidebarItemProps {
  label: string
  icon?: React.ReactNode
  to?: string
  active?: boolean
  badge?: string | number
  onClick?: () => void
  indent?: number
}

export const SidebarItem = ({ label, icon, to, active, badge, onClick, indent = 0 }: SidebarItemProps) => {
  
  const content = (isActiveClass = false) => {
    const isActuallyActive = active || isActiveClass
    return (
      <>
        {/* Custom border for active state using shadow to avoid layout shift */}
        {isActuallyActive && <div className="absolute left-0 top-[4px] bottom-[4px] w-[3px] bg-[var(--color-accent-primary)] rounded-r-md" />}
        
        {icon && (
          <div className={cn(
            "w-4 h-4 flex items-center justify-center mr-2 relative z-10 transition-colors",
            isActuallyActive ? "text-[var(--color-accent-primary)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
          )}>
            {icon}
          </div>
        )}
        
        <span className="flex-1 truncate text-left relative z-10">{label}</span>
        
        {badge !== undefined && (
          <span className="ml-2 px-1.5 py-0.5 bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] text-[10px] rounded-full relative z-10">
            {badge}
          </span>
        )}
      </>
    )
  }

  const baseClasses = cn(
    "group w-full h-[32px] flex items-center rounded-[var(--radius-md)] mx-2 pr-2 text-[14px] transition-colors relative cursor-pointer",
    `pl-[${8 + (indent * 12)}px]`
  )

  // Use dynamic style logic for inline padding since tailwind arbitrary classes might not compile dynamically cleanly if they are missing in the JIT analysis
  const inlineStyle = {
    paddingLeft: `${8 + (indent * 12)}px`,
    width: 'calc(100% - 16px)' // account for mx-2
  }

  if (to) {
    return (
      <NavLink 
        to={to} 
        onClick={onClick}
        style={inlineStyle}
        className={({ isActive }) => cn(
          baseClasses,
          (active || isActive) 
            ? "bg-[var(--color-bg-active)] text-[var(--color-text-primary)] font-medium" 
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
        )}
      >
        {({ isActive }) => content(isActive)}
      </NavLink>
    )
  }

  return (
    <button
      onClick={onClick}
      style={inlineStyle}
      className={cn(
        baseClasses,
        active 
          ? "bg-[var(--color-bg-active)] text-[var(--color-text-primary)] font-medium" 
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
      )}
    >
      {content()}
    </button>
  )
}
