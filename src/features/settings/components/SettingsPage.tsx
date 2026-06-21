import React, { useState } from 'react'
import { Cpu, FileText, Palette, Database, Settings } from 'lucide-react'
import { AIConfigSection } from './AIConfigSection'
import { WritingGuidelinesSection } from './WritingGuidelinesSection'
import { AppearanceSection } from './AppearanceSection'
import { DataSection } from './DataSection'

type SettingsTab = 'ai' | 'guidelines' | 'appearance' | 'data'

interface TabDefinition {
  id: SettingsTab
  label: string
  icon: React.ComponentType<{ size: number; className?: string }>
  desc: string
}

const TABS: TabDefinition[] = [
  {
    id: 'ai',
    label: 'AI Models & Accounts',
    icon: Cpu,
    desc: 'Configure LLM provider keys, custom endpoints, and specific task overrides.',
  },
  {
    id: 'guidelines',
    label: 'Writing Guidelines',
    icon: FileText,
    desc: 'Upload structural pacing constraints, character voice keys, and design guidelines.',
  },
  {
    id: 'appearance',
    label: 'Appearance & Scale',
    icon: Palette,
    desc: 'Customize the backgrounds, font reading scale, and toggle responsive motions.',
  },
  {
    id: 'data',
    label: 'Local Database & Backup',
    icon: Database,
    desc: 'Measure IndexedDB dimensions, generate universe backups, and restore datasets.',
  },
]

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai')

  const activeTabDef = TABS.find((t) => t.id === activeTab)

  return (
    <div className="w-full flex flex-col md:flex-row min-h-[calc(100vh-var(--status-bar-height)-var(--header-height))] bg-[var(--color-bg-base)]">
      {/* LEFT SIDEBAR NAVIGATION / TOP BAR ON MOBILE */}
      <div className="w-full md:w-[240px] md:border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] shrink-0 flex flex-col p-4 gap-2 border-b md:border-b-0 h-fit md:h-auto overflow-x-auto scrollbar-none">
        <div className="hidden md:flex items-center gap-2 px-3 py-2 mb-4 border-b border-[var(--color-border-subtle)]/60 pb-4">
          <Settings size={18} className="text-[var(--color-accent-primary)] animate-[spin_10s_linear_infinite]" />
          <span className="text-[14px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
            Workspace Settings
          </span>
        </div>

        {/* Tab Buttons Navigation */}
        <div className="flex md:flex-col gap-1 w-full shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-[12px] font-semibold transition-all select-none cursor-pointer focus:outline-none shrink-0 md:w-full ${
                  isSelected
                    ? 'bg-[var(--color-accent-primary-dim)] text-[var(--color-text-primary)] border border-[var(--color-accent-primary)]/30 md:border-l-4 md:border-l-[var(--color-accent-primary)] md:rounded-l-none'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-[var(--color-accent-highlight)]' : ''} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* RIGHT CONTENT WORKSPACE AREA */}
      <div className="flex-1 p-5 md:p-8 overflow-y-auto scrollbar-custom select-none">
        {/* Active Header summary to maintain context and rythmic variation */}
        {activeTabDef && (
          <div className="mb-6 pb-6 border-b border-[var(--color-border-subtle)]/70 flex flex-col gap-1">
            <h2 className="text-[20px] font-bold text-[var(--color-text-primary)] tracking-tight">
              {activeTabDef.label}
            </h2>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              {activeTabDef.desc}
            </p>
          </div>
        )}

        {/* Tab Components Router */}
        <div className="max-w-4xl animate-fade-in">
          {activeTab === 'ai' && <AIConfigSection />}
          {activeTab === 'guidelines' && <WritingGuidelinesSection />}
          {activeTab === 'appearance' && <AppearanceSection />}
          {activeTab === 'data' && <DataSection />}
        </div>
      </div>
    </div>
  )
}
export default SettingsPage
