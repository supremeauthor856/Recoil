import { useState } from 'react'
import { Home, Plus, Settings } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Tooltip } from '../ui/Tooltip'
import { NavLink } from 'react-router-dom'
import { useNavigationStore } from '../../../store/navigationStore'
import { useVerses } from '../../../features/verse/hooks/useVerses'
import { VerseCreateModal } from '../../../features/verse/components/VerseCreateModal'

export const VerseIconRail = () => {
  const activeVerseId = useNavigationStore((state) => state.activeVerseId)
  const { verses, refetch } = useVerses()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <div className="w-[var(--rail-width)] bg-[var(--color-bg-rail)] border-r border-[var(--color-border-subtle)] h-full flex flex-col items-center py-4 justify-between shrink-0">
      <div className="flex flex-col items-center gap-3 w-full overflow-y-auto no-scrollbar py-1">
        {/* Home Button */}
        <Tooltip content="Dashboard" side="right">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                'w-[48px] h-[48px] flex items-center justify-center transition-all duration-200 relative group text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                isActive
                  ? 'bg-[var(--color-accent-primary)] text-white rounded-[24px]'
                  : 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] rounded-[16px] lg:hover:rounded-[12px]'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute -left-[4px] w-[4px] h-[20px] bg-[var(--color-accent-primary)] rounded-full top-1/2 -translate-y-1/2" />
                )}
                <Home size={24} color={isActive ? 'white' : 'currentColor'} />
              </>
            )}
          </NavLink>
        </Tooltip>

        <div className="w-8 h-[2px] bg-[var(--color-border-subtle)] rounded-full my-1 shrink-0" />

        {/* Dynamic Verse Lists */}
        <div className="flex flex-col items-center gap-3 w-full">
          {verses.map((verse) => {
            const isSelfActive = activeVerseId === verse.id
            return (
              <Tooltip key={verse.id} content={verse.name} side="right">
                <NavLink
                  to={`/verse/${verse.id}`}
                  className={({ isActive }) =>
                    cn(
                      'w-[48px] h-[48px] flex items-center justify-center transition-all duration-200 relative group text-white text-[18px] font-bold uppercase select-none',
                      isActive ? 'rounded-[18px] scale-100 shadow-md' : 'rounded-[16px] lg:hover:rounded-[12px] lg:hover:scale-105'
                    )
                  }
                  style={{ backgroundColor: verse.icon_color }}
                >
                  {({ isActive }) => (
                    <>
                      {(isActive || isSelfActive) && (
                        <div className="absolute -left-[4px] w-[4px] h-[20px] bg-white rounded-full top-1/2 -translate-y-1/2" />
                      )}
                      <span>{verse.icon_letter || verse.name.charAt(0).toUpperCase()}</span>
                    </>
                  )}
                </NavLink>
              </Tooltip>
            )
          })}
        </div>

        {/* Add Verse Button */}
        <Tooltip content="Create Verse" side="right">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-[48px] h-[48px] flex items-center justify-center transition-all duration-200 rounded-[16px] lg:hover:rounded-[12px] border border-dashed border-[var(--color-border-strong)] bg-transparent hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] shrink-0 cursor-pointer focus:outline-none"
          >
            <Plus size={24} />
          </button>
        </Tooltip>
      </div>

      <div className="flex flex-col items-center gap-3 w-full shrink-0">
        <div className="w-8 h-[2px] bg-[var(--color-border-subtle)] rounded-full mb-1" />
        <Tooltip content="Settings" side="right">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'w-[48px] h-[48px] flex items-center justify-center transition-all duration-200 relative group text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                isActive
                  ? 'bg-[var(--color-bg-active)] rounded-[24px]'
                  : 'rounded-[16px] lg:hover:rounded-[12px] hover:bg-[var(--color-bg-hover)]'
              )
            }
          >
            <Settings size={24} />
          </NavLink>
        </Tooltip>
      </div>

      {/* Verse Create modal */}
      <VerseCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refetch}
      />
    </div>
  )
}
