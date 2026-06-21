import React from 'react'
import { WritingStatus, WRITING_STATUS_COLORS, WRITING_STATUS_LABELS } from '../types'

interface WritingStatusBadgeProps {
  status: WritingStatus
  size?: 'sm' | 'md'
}

export const WritingStatusBadge: React.FC<WritingStatusBadgeProps> = ({ status, size = 'md' }) => {
  const color = WRITING_STATUS_COLORS[status] || 'var(--color-text-muted)'
  const label = WRITING_STATUS_LABELS[status] || status

  const style: React.CSSProperties = {
    color: color,
    backgroundColor: `${color}1F`, // 12% opacity
    borderColor: `${color}4D`, // 30% opacity
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: size === 'sm' ? '10px' : '11px',
    fontWeight: 500,
  }

  const paddingClass = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-0.5'

  return (
    <span
      id={`status-badge-${status}-${size}`}
      className={`inline-flex items-center rounded-full font-medium ${paddingClass} whitespace-nowrap`}
      style={style}
    >
      {label}
    </span>
  )
}
