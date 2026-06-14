import { cn } from '../../utils/cn'
import { User } from 'lucide-react'

export interface AvatarProps {
  imageUrl?: string | null
  initials?: string | null
  color?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const Avatar = ({ imageUrl, initials, color = 'var(--color-accent-primary)', size = 'md', className }: AvatarProps) => {
  const sizes = {
    sm: 'w-[24px] h-[24px] text-xs',
    md: 'w-[32px] h-[32px] text-sm',
    lg: 'w-[40px] h-[40px] text-base',
    xl: 'w-[48px] h-[48px] text-lg',
  }

  return (
    <div 
      className={cn(
        "relative rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-[var(--color-bg-elevated)]",
        sizes[size],
        className
      )}
      style={!imageUrl && initials ? { backgroundColor: color, color: '#fff' } : {}}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : initials ? (
        <span className="font-semibold">{initials.substring(0, 2).toUpperCase()}</span>
      ) : (
        <User size={size === 'sm' ? 14 : size === 'md' ? 18 : size === 'lg' ? 24 : 28} className="text-[var(--color-text-muted)]" />
      )}
    </div>
  )
}
