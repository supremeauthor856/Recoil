import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { VerseIconRail } from './VerseIconRail'
import { LeftSidebar } from './LeftSidebar'
import { GlobalCommandPalette } from './GlobalCommandPalette'
import { useUIStore } from '../../../store/uiStore'

export function AppShell() {
  const { leftSidebarOpen, setLeftSidebarOpen } = useUIStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setLeftSidebarOpen(true)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setLeftSidebarOpen])

  return (
    <div className="w-screen h-screen flex flex-row overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      {/* 1. Far Left Rail - Icon Navigation */}
      <VerseIconRail />

      {/* Mobile Sidebar Overlay */}
      {isMobile && leftSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setLeftSidebarOpen(false)}
        />
      )}

      {/* 2. Left Sidebar - Verse-Specific Sub Navigation */}
      <div 
        className={`
          flex-shrink-0 transition-transform duration-300 ease-in-out h-full
          ${isMobile ? 'fixed top-0 left-[var(--rail-width)] z-50 shadow-2xl h-screen' : 'relative'}
          ${isMobile && !leftSidebarOpen ? '-translate-x-full absolute invisible' : 'translate-x-0 visible'}
        `}
      >
        <LeftSidebar isMobile={isMobile} />
      </div>

      {/* 3. Main Content Panel */}
      <main className="flex-1 overflow-y-auto bg-[var(--color-bg-base)] relative scrollbar-custom min-w-0">
        <Outlet />
      </main>

      {/* Global Command Search Palette */}
      <GlobalCommandPalette />
    </div>
  )
}
