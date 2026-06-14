import { useState } from 'react'
import { cn } from '../../utils/cn'
import { ChevronRight, Plus } from 'lucide-react'
import { useNavigationStore } from '../../../store/navigationStore'

export interface SidebarSectionProps {
  label: string
  children: React.ReactNode
  defaultExpanded?: boolean
  onAdd?: () => void
  count?: number
}

export const SidebarSection = ({ label, children, defaultExpanded = true, onAdd, count }: SidebarSectionProps) => {
  const expandedSections = useNavigationStore(state => state.expandedSections)
  const toggleSection = useNavigationStore(state => state.toggleSectionExpanded)
  
  // Actually, wait, the store manages global state based on label/id. 
  // For simplicity, we just use local state paired with global if needed, 
  // but let's just use local state for now if global isn't strictly mapping by label.
  // Actually the prompt says: "toggleSectionExpanded adds to array if not present, removes if present".
  const isExpanded = expandedSections.includes(label)

  // Initialize expanded state on mount
  useState(() => {
    if (defaultExpanded && !expandedSections.includes(label)) {
      toggleSection(label)
    }
  })

  return (
    <div className="mb-2">
      <div 
        className="group h-[24px] px-4 flex items-center cursor-pointer select-none"
        onClick={() => toggleSection(label)}
      >
        <ChevronRight 
          size={12} 
          className={cn(
            "text-[var(--color-text-muted)] mr-1 transition-transform duration-150", 
            isExpanded && "rotate-90"
          )} 
        />
        <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-widest hover:text-[var(--color-text-secondary)] transition-colors">
          {label}
        </span>
        {count !== undefined && (
          <span className="ml-2 text-[10px] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] px-1.5 rounded-full">
            {count}
          </span>
        )}
        {onAdd && (
          <div 
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
          >
            <Plus size={14} />
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div className="mt-1 flex flex-col gap-[2px]">
          {children}
        </div>
      )}
    </div>
  )
}
