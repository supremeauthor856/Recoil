import React from 'react'

interface ToolsLayoutProps {
  title: string
  description: string
  icon: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}

export function ToolsLayout({ title, description, icon, actions, children }: ToolsLayoutProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden text-[var(--color-text-primary)]">
      <header className="h-[56px] bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)] px-6 flex flex-row items-center gap-3 shrink-0">
        <div className="w-5 h-5 text-[var(--color-accent-primary)] flex items-center justify-center">
          {icon}
        </div>
        <h1 className="text-lg font-semibold truncate leading-none mb-0">{title}</h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] hidden md:block truncate ml-2 mb-0">
          {description}
        </p>
        <div className="flex-1" />
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </header>
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        {children}
      </div>
    </div>
  )
}
