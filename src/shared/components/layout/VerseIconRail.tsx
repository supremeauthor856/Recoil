import { Home, Plus, Settings } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Tooltip } from '../ui/Tooltip'
import { NavLink } from 'react-router-dom'
import { useNavigationStore } from '../../../store/navigationStore'

export const VerseIconRail = () => {
  const activeVerseId = useNavigationStore(state => state.activeVerseId)

  return (
    <div className="w-[var(--rail-width)] bg-[var(--color-bg-rail)] border-r border-[var(--color-border-subtle)] h-full flex flex-col items-center py-4 justify-between shrink-0">
      
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Home Button */}
        <Tooltip content="Dashboard" side="right">
          <NavLink
            to="/"
            className={({ isActive }) => cn(
              "w-[48px] h-[48px] flex items-center justify-center transition-all duration-200 relative group text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
              isActive ? "bg-[var(--color-accent-primary)] text-white rounded-[24px]" : "bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] rounded-[16px] hover:rounded-[12px]"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute -left-[4px] w-[4px] h-[20px] bg-[var(--color-accent-primary)] rounded-full top-1/2 -translate-y-1/2" />}
                <Home size={24} color={isActive ? "white" : "currentColor"} />
              </>
            )}
          </NavLink>
        </Tooltip>

        <div className="w-8 h-[2px] bg-[var(--color-border-subtle)] rounded-full my-1" />

        {/* Placeholder Verse (simulate dynamic rendering for foundation) */}
        <Tooltip content="Current Verse" side="right">
          <button
            onClick={() => useNavigationStore.getState().setActiveVerse('placeholder')}
            className={cn(
              "w-[48px] h-[48px] flex items-center justify-center transition-all duration-200 relative group",
              activeVerseId === 'placeholder' ? "rounded-[24px]" : "rounded-[16px] hover:rounded-[12px] hover:scale-105"
            )}
            style={{ backgroundColor: 'var(--color-accent-primary)' }}
          >
            {activeVerseId === 'placeholder' && (
              <div className="absolute -left-[4px] w-[4px] h-[20px] bg-[var(--color-accent-primary)] rounded-full top-1/2 -translate-y-1/2" />
            )}
            <span className="text-[20px] font-semibold text-white">V</span>
          </button>
        </Tooltip>

        {/* Add Verse Button */}
        <Tooltip content="Create Verse" side="right">
          <button className="w-[48px] h-[48px] flex items-center justify-center transition-all duration-200 rounded-[16px] hover:rounded-[12px] border border-dashed border-[var(--color-border-strong)] bg-transparent hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
            <Plus size={24} />
          </button>
        </Tooltip>
      </div>

      <div className="flex flex-col items-center gap-3 w-full">
        <div className="w-8 h-[2px] bg-[var(--color-border-subtle)] rounded-full mb-1" />
        <Tooltip content="Settings" side="right">
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              "w-[48px] h-[48px] flex items-center justify-center transition-all duration-200 relative group text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
              isActive ? "bg-[var(--color-bg-active)] rounded-[24px]" : "rounded-[16px] hover:rounded-[12px] hover:bg-[var(--color-bg-hover)]"
            )}
          >
            <Settings size={24} />
          </NavLink>
        </Tooltip>
      </div>

    </div>
  )
}
