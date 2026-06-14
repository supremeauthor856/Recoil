import { Avatar } from '../ui/Avatar'
import { useUIStore } from '../../../store/uiStore'

interface RightSidebarProps {
  isMobile?: boolean
}

export const RightSidebar = ({ isMobile }: RightSidebarProps) => {
  const rightSidebarOpen = useUIStore(state => state.rightSidebarOpen)

  // Empty state logic as defined in prompt
  return (
    <div 
      className="bg-[var(--color-bg-sidebar)] h-full overflow-hidden flex flex-col shrink-0 border-l border-[var(--color-border-subtle)]"
      style={{
        width: isMobile ? '100%' : rightSidebarOpen ? 'var(--sidebar-width)' : '0px',
        transition: 'width 200ms ease-in-out'
      }}
    >
      <div className="h-[40px] px-4 flex items-center shrink-0">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
          In This Verse
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-custom p-2">
        {/* Placeholder for character list */}
        <div className="px-2 py-4 flex items-center justify-center text-xs text-[var(--color-text-muted)] text-center">
          No characters in this verse yet.
        </div>
        
        {/*
        Example Item:
        <div className="h-[36px] px-2 flex items-center gap-3 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] cursor-pointer group transition-colors">
          <Avatar size="sm" initials="AC" color="var(--color-accent-primary)" />
          <span className="text-[13px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] truncate">Anna Croft</span>
        </div>
        */}
      </div>
    </div>
  )
}
