import { ChevronDown, Search, X, Users, Clock, BookOpen, Shield, Lightbulb, Library, FileText, GitBranch, Book, ScrollText, Film, Network, Map, MessageSquare, Zap, Upload, Wand2, AlertTriangle, Eye, Archive, AlignLeft, Kanban, Mic, Grid, BarChart2, History, FileStack } from 'lucide-react'
import { SidebarSection } from '../ui/SidebarSection'
import { SidebarItem } from '../ui/SidebarItem'
import { StatusBar } from './StatusBar'
import { useUIStore } from '../../../store/uiStore'

interface LeftSidebarProps {
  isMobile?: boolean
}

export const LeftSidebar = ({ isMobile }: LeftSidebarProps) => {
  const { setLeftSidebarOpen, openSearchPalette } = useUIStore()

  const verseId = 'placeholder'

  return (
    <div className="w-[var(--sidebar-width)] w-full md:w-[var(--sidebar-width)] bg-[var(--color-bg-sidebar)] h-full flex flex-col shrink-0">
      
      {/* Header */}
      <div className="h-[52px] px-4 flex items-center justify-between shrink-0 hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors">
        <div className="flex flex-col items-start min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] truncate max-w-[160px]">
            My Verse
          </h2>
        </div>
        <div className="flex gap-2">
          <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
          {isMobile && (
            <button onClick={(e) => { e.stopPropagation(); setLeftSidebarOpen(false) }}>
              <X size={16} className="text-[var(--color-text-muted)]" />
            </button>
          )}
        </div>
      </div>

      {/* Search Row */}
      <div className="h-[40px] px-2 shrink-0">
        <button 
          onClick={openSearchPalette}
          className="w-full h-[26px] bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] flex items-center px-2 hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <Search size={14} className="text-[var(--color-text-muted)] mr-2" />
          <span className="text-[12px] text-[var(--color-text-muted)]">Search...</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-custom py-2">
        <SidebarSection label="Characters" onAdd={() => {}}>
          <SidebarItem label="All Characters" icon={<Users />} to={`/verse/${verseId}/characters`} badge={0} />
        </SidebarSection>

        <SidebarSection label="Sub-Series" onAdd={() => {}}>
          {/* Dynamic items would go here */}
          <div />
        </SidebarSection>

        <SidebarSection label="Lore & Worldbuilding">
          <SidebarItem label="Timeline" icon={<Clock />} />
          <SidebarItem label="Glossary" icon={<BookOpen />} />
          <SidebarItem label="Factions & Groups" icon={<Shield />} />
          <SidebarItem label="Concepts & Rules" icon={<Lightbulb />} />
          <SidebarItem label="All Lore" icon={<Library />} to={`/verse/${verseId}/lore`} />
        </SidebarSection>

        <SidebarSection label="Writing">
          <SidebarItem label="All Writing" icon={<FileText />} to={`/verse/${verseId}/writing`} />
          <SidebarItem label="Story Arcs" icon={<GitBranch />} />
          <SidebarItem label="Novels" icon={<Book />} />
          <SidebarItem label="Short Stories" icon={<ScrollText />} />
          <SidebarItem label="Scenes" icon={<Film />} />
        </SidebarSection>

        <SidebarSection label="Relationship Web">
          <SidebarItem label="View Web" icon={<Network />} to={`/verse/${verseId}/relationships`} />
        </SidebarSection>

        <SidebarSection label="Verse Map">
          <SidebarItem label="View Map" icon={<Map />} to={`/verse/${verseId}/verse-map`} />
        </SidebarSection>

        <SidebarSection label="AI Workspace">
          <SidebarItem label="Conversations" icon={<MessageSquare />} to={`/verse/${verseId}/ai`} />
          <SidebarItem label="The Oracle" icon={<Search />} />
          <SidebarItem label="Brainstorm Room" icon={<Zap />} />
          <SidebarItem label="Import & Auto-fill" icon={<Upload />} />
        </SidebarSection>

        <SidebarSection label="Tools" defaultExpanded={false}>
          <SidebarItem label="Lore Expander" icon={<Wand2 />} />
          <SidebarItem label="Plot Hole Detector" icon={<AlertTriangle />} />
          <SidebarItem label="Foreshadowing Planner" icon={<Eye />} />
          <SidebarItem label="Headcanon Vault" icon={<Archive />} />
          <SidebarItem label="Chapter Summaries" icon={<AlignLeft />} />
          <SidebarItem label="Arc Status Board" icon={<Kanban />} />
          <SidebarItem label="Voice Trainer" icon={<Mic />} />
          <SidebarItem label="Chemistry Matrix" icon={<Grid />} />
          <SidebarItem label="Version History" icon={<History />} />
          <SidebarItem label="Verse Statistics" icon={<BarChart2 />} />
        </SidebarSection>

        <SidebarSection label="Writing Guidelines" defaultExpanded={false}>
          <SidebarItem label="Manage Guidelines" icon={<FileStack />} />
        </SidebarSection>
      </div>

      <StatusBar />
    </div>
  )
}
