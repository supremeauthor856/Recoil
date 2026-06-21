import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Search,
  X,
  Users,
  Clock,
  BookOpen,
  Shield,
  Lightbulb,
  Library,
  FileText,
  GitBranch,
  Book,
  ScrollText,
  Film,
  Network,
  Map,
  MessageSquare,
  Zap,
  Upload,
  Wand2,
  AlertTriangle,
  Eye,
  Archive,
  AlignLeft,
  Kanban,
  Mic,
  Grid,
  BarChart2,
  History,
  FileStack,
  Layers,
  Settings,
  Plus
} from 'lucide-react'
import { SidebarSection } from '../ui/SidebarSection'
import { SidebarItem } from '../ui/SidebarItem'
import { StatusBar } from './StatusBar'
import { useUIStore } from '../../../store/uiStore'
import { useNavigationStore } from '../../../store/navigationStore'
import { useVerse } from '../../..//features/verse/hooks/useVerse'
import * as characterService from '../../../services/characterService'
import { Character } from '../../../shared/types/database'
import { SubSeriesCreateModal } from '../../../features/verse/components/SubSeriesCreateModal'
import { VerseSettingsModal } from '../../../features/verse/components/VerseSettingsModal'

interface LeftSidebarProps {
  isMobile?: boolean
}

export const LeftSidebar = ({ isMobile }: LeftSidebarProps) => {
  const navigate = useNavigate()
  const { setLeftSidebarOpen, openSearchPalette } = useUIStore()
  const { activeVerseId, activeSubSeriesId, setActiveSubSeries } = useNavigationStore()

  // Load verse details dynamically if an active verse is set
  const { verse, subSeries, stats, loading, refetch, refetchSubSeries } = useVerse(activeVerseId)

  // Dynamic lists
  const [characters, setCharacters] = useState<Character[]>([])
  const [charactersLoading, setCharactersLoading] = useState(false)

  // Modals Local Controls
  const [isSubCreateOpen, setIsSubCreateOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    if (activeVerseId) {
      setCharactersLoading(true)
      characterService
        .getCharacters({ verseId: activeVerseId })
        .then((data) => setCharacters(data || []))
        .catch((err) => console.error('Failed to load sidebar characters:', err))
        .finally(() => setCharactersLoading(false))
    } else {
      setCharacters([])
    }
  }, [activeVerseId])

  // Refresh handlers
  const handleSubCreated = () => {
    refetchSubSeries()
    refetch() // Refresh stats
  }

  return (
    <div className="w-[var(--sidebar-width)] w-full md:w-[var(--sidebar-width)] bg-[var(--color-bg-sidebar)] h-full flex flex-col shrink-0 border-r border-[var(--color-border-subtle)]/30">
      {/* Header */}
      {activeVerseId && verse ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsSettingsOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') setIsSettingsOpen(true) }}
          className="w-full text-left h-[52px] px-4 flex items-center justify-between shrink-0 hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors group border-b border-[var(--color-border-subtle)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)] focus:ring-offset-[-1px]"
          title="Verse Settings"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Color indicator */}
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-white font-bold select-none text-[10px]"
              style={{ backgroundColor: verse.icon_color }}
            >
              {verse.icon_letter || verse.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)] truncate max-w-[130px]">
                {verse.name}
              </h2>
              <span className="text-[9px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
                Active Setting
              </span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Settings
              size={13}
              className={`text-[var(--color-text-muted)] transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            />
            <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
            {isMobile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLeftSidebarOpen(false)
                }}
                className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] focus:outline-none"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Welcome / Dashboard Welcome Header */
        <div className="h-[52px] px-4 flex items-center justify-between shrink-0 border-b border-[var(--color-border-subtle)]/40 bg-[var(--color-bg-elevated)]/20">
          <div className="flex flex-col">
            <h2 className="text-[14px] font-bold tracking-wide text-[var(--color-text-primary)]">
              Recoil Builder
            </h2>
            <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">
              Workspace Overview
            </span>
          </div>
          {isMobile && (
            <button
              onClick={() => setLeftSidebarOpen(false)}
              className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* Search Row */}
      <div className="h-[40px] px-2 shrink-0 py-1.5 border-b border-[var(--color-border-subtle)]/20">
        <button
          onClick={openSearchPalette}
          className="w-full h-[26px] bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] flex items-center px-2 hover:bg-[var(--color-bg-hover)] transition-colors text-left"
        >
          <Search size={14} className="text-[var(--color-text-muted)] mr-2 flex-shrink-0" />
          <span className="text-[12px] text-[var(--color-text-muted)] flex-1">Search...</span>
          <div className="hidden md:flex items-center gap-0.5 opacity-50">
             <kbd className="text-[9px] font-sans rounded px-1 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] pb-px">⌘</kbd>
             <kbd className="text-[9px] font-sans rounded px-1 bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] pb-px">K</kbd>
          </div>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-custom py-2">
        {activeVerseId && verse ? (
          <>
            {/* Characters Section */}
            <SidebarSection label="Characters" count={characters.length}>
              <SidebarItem
                label="All Characters"
                icon={<Users size={14} />}
                to={`/verse/${activeVerseId}/characters`}
                badge={stats?.characterCount ?? characters.length}
              />
              {/* Dynamic Sub-list of characters if any */}
              {characters.slice(0, 5).map((char) => (
                <SidebarItem
                  key={char.id}
                  label={char.name}
                  to={`/verse/${activeVerseId}/characters/${char.id}`}
                  indent={1}
                  active={window.location.pathname.includes(`/characters/${char.id}`)}
                />
              ))}
            </SidebarSection>

            {/* Sub-Series Section */}
            <SidebarSection
              label="Sub-Series"
              count={subSeries.length}
              onAdd={() => setIsSubCreateOpen(true)}
            >
              {subSeries.map((sub) => {
                const isActive = activeSubSeriesId === sub.id
                return (
                  <SidebarItem
                    key={sub.id}
                    label={sub.name}
                    icon={<Layers size={14} />}
                    to={`/verse/${activeVerseId}/sub-series/${sub.id}`}
                    active={isActive}
                    onClick={() => setActiveSubSeries(sub.id)}
                  />
                )
              })}
              {subSeries.length === 0 && (
                <button
                  type="button"
                  onClick={() => setIsSubCreateOpen(true)}
                  className="mx-4 text-left text-xs py-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] font-medium inline-flex items-center gap-1 focus:outline-none"
                >
                  <Plus size={12} /> Add sub-series
                </button>
              )}
            </SidebarSection>

            {/* Lore Section */}
            <SidebarSection label="Lore & Worldbuilding">
              <SidebarItem label="Timeline" icon={<Clock size={14} />} to={`/verse/${activeVerseId}/lore?category=timeline`} />
              <SidebarItem label="Glossary" icon={<BookOpen size={14} />} to={`/verse/${activeVerseId}/lore?category=glossary`} />
              <SidebarItem label="Factions & Groups" icon={<Shield size={14} />} to={`/verse/${activeVerseId}/lore?category=factions`} />
              <SidebarItem label="Concepts & Rules" icon={<Lightbulb size={14} />} to={`/verse/${activeVerseId}/lore?category=concepts`} />
              <SidebarItem
                label="All Lore"
                icon={<Library size={14} />}
                to={`/verse/${activeVerseId}/lore`}
                badge={stats?.loreCount}
              />
            </SidebarSection>

            {/* Writing Section */}
            <SidebarSection label="Writing">
              <SidebarItem
                label="All Writing"
                icon={<FileText size={14} />}
                to={`/verse/${activeVerseId}/writing`}
                badge={stats?.writingCount}
              />
              <SidebarItem label="Story Arcs" icon={<GitBranch size={14} />} to={`/verse/${activeVerseId}/writing?type=outline`} />
              <SidebarItem label="Novels" icon={<Book size={14} />} to={`/verse/${activeVerseId}/writing?type=novel`} />
              <SidebarItem label="Short Stories" icon={<ScrollText size={14} />} to={`/verse/${activeVerseId}/writing?type=short-story`} />
              <SidebarItem label="Scenes" icon={<Film size={14} />} to={`/verse/${activeVerseId}/writing?type=scene`} />
            </SidebarSection>

            {/* Relationships Section */}
            <SidebarSection label="Relationship Web">
              <SidebarItem
                label="View Web"
                icon={<Network size={14} />}
                to={`/verse/${activeVerseId}/relationships`}
              />
            </SidebarSection>

            {/* Map Section */}
            <SidebarSection label="Verse Map">
              <SidebarItem
                label="View Map"
                icon={<Map size={14} />}
                to={`/verse/${activeVerseId}/verse-map`}
              />
            </SidebarSection>

            {/* AI Assistant Section */}
            <SidebarSection label="AI Workspace">
              <SidebarItem
                label="Conversations"
                icon={<MessageSquare size={14} />}
                to={`/verse/${activeVerseId}/ai`}
                badge={stats?.conversationCount}
              />
              <SidebarItem label="The Oracle" icon={<Search size={14} />} to={`/verse/${activeVerseId}/ai`} />
              <SidebarItem label="Brainstorm Room" icon={<Zap size={14} />} to={`/verse/${activeVerseId}/ai`} />
              <SidebarItem label="Import & Auto-fill" icon={<Upload size={14} />} to={`/verse/${activeVerseId}/import`} />
            </SidebarSection>

            {/* Tools Panel */}
            <SidebarSection label="Tools" defaultExpanded={false}>
              <SidebarItem label="Lore Expander" icon={<Wand2 size={14} />} to={`/verse/${activeVerseId}/tools/lore-expander`} />
              <SidebarItem label="Plot Hole Detector" icon={<AlertTriangle size={14} />} to={`/verse/${activeVerseId}/tools/plot-hole-detector`} />
              <SidebarItem label="Foreshadowing Planner" icon={<Eye size={14} />} to={`/verse/${activeVerseId}/tools/foreshadowing`} />
              <SidebarItem label="Headcanon Vault" icon={<Archive size={14} />} to={`/verse/${activeVerseId}/tools/headcanon-vault`} />
              <SidebarItem label="Chapter Summaries" icon={<AlignLeft size={14} />} to={`/verse/${activeVerseId}/tools/chapter-summary`} />
              <SidebarItem label="Arc Status Board" icon={<Kanban size={14} />} to={`/verse/${activeVerseId}/tools/arc-board`} />
              <SidebarItem label="Voice Trainer" icon={<Mic size={14} />} to={`/verse/${activeVerseId}/tools/voice-trainer`} />
              <SidebarItem label="Chemistry Matrix" icon={<Grid size={14} />} to={`/verse/${activeVerseId}/tools/chemistry-matrix`} />
              <SidebarItem label="Version History" icon={<History size={14} />} to={`/verse/${activeVerseId}/tools/version-history`} />
              <SidebarItem label="Verse Statistics" icon={<BarChart2 size={14} />} to={`/verse/${activeVerseId}/tools/verse-statistics`} />
            </SidebarSection>

            {/* Guidelines */}
            <SidebarSection label="Writing Guidelines" defaultExpanded={false}>
              <SidebarItem label="Manage Guidelines" icon={<FileStack size={14} />} to={`/verse/${activeVerseId}/tools/writing-guidelines`} />
            </SidebarSection>
          </>
        ) : (
          /* Central / Dashboard No Active Verse state */
          <div className="px-4 py-8 text-center flex flex-col justify-center gap-3">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] block leading-relaxed px-1">
              Select or create a verse from the side navigation rail to start building your universe.
            </span>
            <button
              onClick={() => navigate('/')}
              className="mt-3 text-xs bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary-hover)] text-white font-medium py-1.5 px-3 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-primary)] focus:ring-offset-1"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>

      <StatusBar />

      {/* Sub Series Create Modal inside Sidebar */}
      {activeVerseId && (
        <SubSeriesCreateModal
          isOpen={isSubCreateOpen}
          onClose={() => setIsSubCreateOpen(false)}
          verseId={activeVerseId}
          onSuccess={handleSubCreated}
        />
      )}

      {activeVerseId && verse && (
        <VerseSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          verse={verse}
          onSuccess={refetch}
        />
      )}
    </div>
  )
}
