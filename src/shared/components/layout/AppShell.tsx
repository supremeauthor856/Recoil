import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useUIStore } from '../../../store/uiStore'
import { VerseIconRail } from './VerseIconRail'
import { LeftSidebar } from './LeftSidebar'
import { MainContent } from './MainContent'
import { RightSidebar } from './RightSidebar'
import { MobileNav } from './MobileNav'
import { Sheet } from '../ui/Sheet'
import { SearchPalette } from '../ui/SearchPalette'
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut'

export const AppShell = () => {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { 
    leftSidebarOpen, 
    setLeftSidebarOpen, 
    rightSidebarOpen, 
    toggleRightSidebar,
    openSearchPalette
  } = useUIStore()

  // Cmd+K / Ctrl+K mapping globally
  useKeyboardShortcut({ key: 'k', metaKey: true }, (e) => {
    e.preventDefault()
    openSearchPalette()
  })
  useKeyboardShortcut({ key: 'k', ctrlKey: true }, (e) => {
    e.preventDefault()
    openSearchPalette()
  })

  // Desktop Layout
  if (isDesktop) {
    return (
      <div className="w-[100vw] h-[100vh] flex flex-row overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
        <VerseIconRail />
        <LeftSidebar />
        <MainContent />
        {rightSidebarOpen && <RightSidebar />}
        <SearchPalette />
      </div>
    )
  }

  // Mobile Layout
  return (
    <div className="w-[100vw] h-[100vh] flex flex-col overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-primary)] pb-[var(--mobile-nav-height)] relative">
      <MainContent />
      <MobileNav />

      {/* Left Drawer */}
      <Sheet 
        isOpen={leftSidebarOpen} 
        onClose={() => setLeftSidebarOpen(false)}
        side="left"
        title="Navigation"
      >
        <div className="flex flex-col h-full -m-4">
          <LeftSidebar isMobile />
        </div>
      </Sheet>

      {/* Right Drawer */}
      <Sheet 
        isOpen={rightSidebarOpen} 
        onClose={() => toggleRightSidebar()}
        side="right"
        title="In This Verse"
      >
        <div className="flex flex-col h-full -m-4">
          <RightSidebar isMobile />
        </div>
      </Sheet>
      
      <SearchPalette />
    </div>
  )
}
