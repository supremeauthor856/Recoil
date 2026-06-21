import React, { useState } from 'react'
import { Download } from 'lucide-react'
import { ExportPanel } from './ExportPanel'
import type { ExportFormat, ExportScope } from '../types'
import { Tooltip } from '../../../shared/components/ui/Tooltip'
import { cn } from '../../../shared/utils/cn'

interface ExportButtonProps {
  scope: ExportScope
  title: string
  subtitle?: string
  allowedFormats?: ExportFormat[]
  className?: string
  iconOnly?: boolean
}

export function ExportButton({ scope, title, subtitle, allowedFormats, className, iconOnly }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const btnContent = (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className={cn(
        "flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-base)]",
        iconOnly
          ? "w-9 h-9 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
          : "px-4 h-9 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]/50 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)]/50 text-[13px]",
        className
      )}
    >
      <Download size={16} />
      {!iconOnly && <span>Export</span>}
    </button>
  )

  return (
    <>
      {iconOnly ? (
        <Tooltip content="Export">{btnContent}</Tooltip>
      ) : (
        btnContent
      )}
      
      <ExportPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        scope={scope}
        title={title}
        subtitle={subtitle}
        allowedFormats={allowedFormats}
      />
    </>
  )
}
