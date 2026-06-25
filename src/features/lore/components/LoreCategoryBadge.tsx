import React from 'react'
import { LoreCategory, LORE_CATEGORY_COLORS, LORE_CATEGORY_LABELS } from '../types'

interface LoreCategoryBadgeProps {
  category: LoreCategory
  size?: 'xs' | 'sm' | 'md'
}

export const LoreCategoryBadge: React.FC<LoreCategoryBadgeProps> = ({
  category,
  size = 'sm',
}) => {
  const color = LORE_CATEGORY_COLORS[category] || '#6B7280'
  const label = LORE_CATEGORY_LABELS[category] || category

  let sizeClasses = 'text-[11px] px-2 py-0.5'
  let styleHeight = {}

  if (size === 'xs') {
    sizeClasses = 'text-[10px] px-1.5 py-0'
    styleHeight = { height: '18px' }
  } else if (size === 'md') {
    sizeClasses = 'text-[12px] px-2.5 py-1'
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full select-none border whitespace-nowrap`}
      style={{
        backgroundColor: `${color}1F`, // 12% opacity (0x1F in hex)
        color: color,
        borderColor: `${color}4D`, // 30% opacity (0x4D in hex)
        ...styleHeight,
      }}
    >
      {label}
    </span>
  )
}
