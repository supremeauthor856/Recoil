import React from 'react'
import { RelationshipType, RELATIONSHIP_COLORS_HEX, RELATIONSHIP_TYPE_LABELS } from '../types'
import { cn } from '../../../shared/utils/cn'

interface RelationshipTypeBadgeProps {
  type: RelationshipType
  size?: 'sm' | 'md'
  className?: string
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function RelationshipTypeBadge({
  type,
  size = 'md',
  className,
}: RelationshipTypeBadgeProps) {
  const hexColor = RELATIONSHIP_COLORS_HEX[type] || '#9090A8'
  const label = RELATIONSHIP_TYPE_LABELS[type] || type

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full select-none shrink-0 border transition-all duration-150',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]',
        className
      )}
      style={{
        backgroundColor: hexToRgba(hexColor, 0.12),
        borderColor: hexToRgba(hexColor, 0.35),
        color: hexColor,
      }}
    >
      <span
        className={cn('rounded-full shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')}
        style={{ backgroundColor: hexColor }}
      />
      <span className="truncate">{label}</span>
    </span>
  )
}
