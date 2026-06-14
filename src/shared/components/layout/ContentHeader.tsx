import { ChevronRight, Pencil, Download, Share2, PanelRightClose, PanelRightOpen, Menu } from 'lucide-react'
import { useNavigationStore } from '../../../store/navigationStore'
import { useUIStore } from '../../../store/uiStore'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export const ContentHeader = () => {
  const breadcrumb = useNavigationStore(state => state.breadcrumb)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { rightSidebarOpen, toggleRightSidebar, setLeftSidebarOpen } = useUIStore()

  return (
    <div className="h-[48px] bg-[var(--color-bg-base)] border-b border-[var(--color-border-subtle)] px-4 flex items-center shrink-0">
      {!isDesktop && (
        <button 
          onClick={() => setLeftSidebarOpen(true)}
          className="mr-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <Menu size={20} />
        </button>
      )}

      <div className="flex items-center gap-2 flex-1 overflow-hidden">
        {breadcrumb.length > 0 ? (
          breadcrumb.map((crumb, i) => (
            <div key={i} className="flex items-center">
              <span className={i === breadcrumb.length - 1 ? "text-[15px] font-semibold text-[var(--color-text-primary)]" : "text-[13px] text-[var(--color-text-secondary)]"}>
                {crumb}
              </span>
              {i < breadcrumb.length - 1 && (
                <ChevronRight size={14} className="text-[var(--color-text-muted)] mx-2 shrink-0" />
              )}
            </div>
          ))
        ) : (
          <span className="text-[15px] font-semibold text-[var(--color-text-primary)]">Dashboard</span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
          <Pencil size={18} />
        </button>
        <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
          <Download size={18} />
        </button>
        <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
          <Share2 size={18} />
        </button>
        
        {isDesktop && (
          <>
            <div className="w-[1px] h-4 bg-[var(--color-border-subtle)] mx-1" />
            <button 
              onClick={toggleRightSidebar}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {rightSidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
