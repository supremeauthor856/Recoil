import { useOnline } from '../../hooks/useOnline'
import { Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../utils/cn'

export const StatusBar = () => {
  const isOnline = useOnline()
  const navigate = useNavigate()

  return (
    <div className="h-[48px] bg-[var(--color-bg-rail)] border-t border-[var(--color-border-subtle)] px-4 flex items-center shrink-0">
      <div className={cn(
        "w-[10px] h-[10px] rounded-full mr-2 shadow-[0_0_8px_rgba(0,0,0,0.5)]",
        isOnline ? "bg-[var(--color-success)]" : "bg-[var(--color-error)]"
      )} />
      <span className="text-[12px] text-[var(--color-text-muted)] flex-1 truncate">
        {isOnline ? "Google Gemini" : "Offline"}
      </span>
      <div className="w-[1px] h-4 bg-[var(--color-border-subtle)] mx-3" />
      <button 
        onClick={() => navigate('/settings')}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <Settings size={14} />
      </button>
    </div>
  )
}
