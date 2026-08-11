import { useState } from 'react'
import { ChevronLeft, Share2, Upload, Star, Plus, Smartphone, Database, Calendar, Send, AlertTriangle, Moon, Sun, Settings } from 'lucide-react'
import { Tooltip } from '../ui/Tooltip'
import { NavLink, useNavigate } from 'react-router-dom'
import { useNavigationStore } from '../../../store/navigationStore'
import { useSettingsStore } from '../../../store/settingsStore'
import { useVerses } from '../../../features/verse/hooks/useVerses'
import { VerseCreateModal } from '../../../features/verse/components/VerseCreateModal'

export const VerseIconRail = () => {
  const activeVerseId = useNavigationStore((state) => state.activeVerseId)
  const { theme, setTheme } = useSettingsStore()
  const { verses, refetch } = useVerses()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const navigate = useNavigate()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <aside className="w-[68px] bg-[var(--color-bg-rail)] border-r border-slate-200/60 dark:border-slate-800/80 h-full flex flex-col items-center py-4 justify-between shrink-0 select-none z-30">
      
      {/* Upper Squircle Action Icon Stack */}
      <div className="flex flex-col items-center gap-2.5 w-full overflow-y-auto scrollbar-none px-2">
        
        {/* Back navigation squircle */}
        <Tooltip content="Go Back" side="right">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          >
            <ChevronLeft size={18} />
          </button>
        </Tooltip>

        {/* Share Button */}
        <Tooltip content="Share Verse" side="right">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'Recoil Verse', url: window.location.href }).catch(() => {})
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('Copied URL to clipboard!')
              }
            }}
            className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          >
            <Share2 size={18} />
          </button>
        </Tooltip>

        {/* Export/Upload */}
        <Tooltip content="Export & Import Data" side="right">
          <button
            onClick={() => navigate(activeVerseId ? `/verse/${activeVerseId}/import` : '/settings')}
            className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          >
            <Upload size={18} />
          </button>
        </Tooltip>

        {/* Star Favorites */}
        <Tooltip content="Headcanon & Favorites" side="right">
          <button
            onClick={() => navigate(activeVerseId ? `/verse/${activeVerseId}/tools/headcanon-vault` : '/')}
            className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          >
            <Star size={18} />
          </button>
        </Tooltip>

        {/* Plus / Add Verse */}
        <Tooltip content="New Verse" side="right">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-10 h-10 rounded-2xl bg-blue-600 text-white shadow-sm hover:bg-blue-500 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          >
            <Plus size={20} />
          </button>
        </Tooltip>

        <div className="w-6 h-[1px] bg-slate-200 dark:bg-slate-800 my-1 shrink-0" />

        {/* Device/Mobile View */}
        <Tooltip content="Mobile / Compact Layout" side="right">
          <button
            onClick={() => {
              const main = document.getElementById('main-scroll-area')
              if (main) main.classList.toggle('max-w-md')
            }}
            className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          >
            <Smartphone size={18} />
          </button>
        </Tooltip>

        {/* Verse Database */}
        <Tooltip content="Verse Database" side="right">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `w-10 h-10 rounded-2xl border shadow-xs flex items-center justify-center transition-all hover:scale-105 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                  : 'bg-white/90 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-white'
              }`
            }
          >
            <Database size={18} />
          </NavLink>
        </Tooltip>

        {/* Calendar / Timeline Planner */}
        <Tooltip content="Arc Board & Foreshadowing" side="right">
          <button
            onClick={() => navigate(activeVerseId ? `/verse/${activeVerseId}/tools/arc-board` : '/')}
            className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          >
            <Calendar size={18} />
          </button>
        </Tooltip>

        {/* Quick AI Trigger */}
        <Tooltip content="AI Companion Workspace" side="right">
          <button
            onClick={() => navigate(activeVerseId ? `/verse/${activeVerseId}/ai` : '/')}
            className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          >
            <Send size={18} />
          </button>
        </Tooltip>

        {/* Alert / Notice */}
        <Tooltip content="Plot Hole Detector" side="right">
          <button
            onClick={() => navigate(activeVerseId ? `/verse/${activeVerseId}/tools/plot-hole-detector` : '/')}
            className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 shadow-xs hover:bg-amber-100 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          >
            <AlertTriangle size={18} />
          </button>
        </Tooltip>
      </div>

      {/* Bottom Control Section: Theme Toggle Squircle */}
      <div className="flex flex-col items-center gap-2 w-full px-2 shrink-0 pt-2">
        
        <Tooltip content="Settings" side="right">
          <NavLink
            to="/settings"
            className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 shadow-xs transition-all hover:scale-105"
          >
            <Settings size={18} />
          </NavLink>
        </Tooltip>

        {/* Ceramic Dark/Light Toggle Pill Block (matching bottom left of reference UI) */}
        <button
          onClick={toggleTheme}
          className="w-10 h-12 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex flex-col items-center justify-center gap-1 shadow-md hover:scale-105 transition-all cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

      </div>

      {/* Verse Create modal */}
      <VerseCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refetch}
      />
    </aside>
  )
}
