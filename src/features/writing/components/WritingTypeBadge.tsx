import React from 'react'
import { WritingType, WRITING_TYPE_COLORS, WRITING_TYPE_LABELS } from '../types'

interface WritingTypeBadgeProps {
  type: WritingType
  size?: 'sm' | 'md'
}

export const WritingTypeBadge: React.FC<WritingTypeBadgeProps> = ({ type, size = 'md' }) => {
  const color = WRITING_TYPE_COLORS[type] || 'var(--color-text-muted)'
  const label = WRITING_TYPE_LABELS[type] || type

  const style: React.CSSProperties = {
    color: color,
    backgroundColor: `${color}1F`, // ~12% opacity (1F of 255 is ~12%)
    borderColor: `${color}4D`, // ~30% opacity (4D of 255 is ~30%)
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: size === 'sm' ? '10px' : '11px',
    fontWeight: 500,
  }

  const paddingClass = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-0.5'

  return (
    <span
      id={`type-badge-${type}-${size}`}
      className={`inline-flex items-center rounded-full font-medium ${paddingClass} whitespace-nowrap`}
      style={style}
    >
      {label}
    </span>
  )
}
