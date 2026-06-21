import React from 'react'
import { Cloud, Wifi, Cpu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../../../store/settingsStore'
import { BUILT_IN_PROVIDERS } from '../../../services/aiService'

export function StatusBar() {
  const navigate = useNavigate()
  const { providers } = useSettingsStore()

  const activeBuiltIns = BUILT_IN_PROVIDERS.filter((p) => {
    const config = (providers as any)[p.id]
    return config?.enabled && config?.apiKey
  })
  const activeCustoms = (providers.custom || []).filter((c: any) => c.enabled && c.apiKey)
  const totalActive = activeBuiltIns.length + activeCustoms.length

  return (
    <div className="h-[32px] px-3.5 bg-[var(--color-bg-base)] border-t border-[var(--color-border-subtle)]/30 flex items-center justify-between text-[10px] font-mono select-none shrink-0 text-[var(--color-text-muted)]">
      {/* Connection Indicator */}
      <div className="flex items-center gap-1.5 min-w-0" title="All changes saved to container storage">
        <Wifi size={10} className="text-[var(--color-success)] animate-pulse shrink-0" />
        <span className="truncate">DEV CONTAINER LOCAL</span>
      </div>

      {/* AI STATUS PILL - Clickable link to /settings */}
      <button
        onClick={() => navigate('/settings')}
        className="flex items-center gap-1.5 shrink-0 focus:outline-none hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer group"
        title="Click to configure AI models"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${totalActive > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        <Cpu size={10} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-highlight)] transition-colors" />
        <span className="font-semibold">
          {totalActive > 0 ? `${totalActive} ACTIVE AI` : 'AI OFFLINE (SETUP REQUIRED)'}
        </span>
      </button>

      {/* Sync Status */}
      <div className="flex items-center gap-1 shrink-0" title="Database Synced">
        <Cloud size={10} className="shrink-0" />
        <span>SYNCED</span>
      </div>
    </div>
  )
}
