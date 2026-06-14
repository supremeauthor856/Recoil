import { LayoutDashboard, Users, FileText, MessageSquare, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'

export const MobileNav = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Home', to: '/' },
    { icon: Users, label: 'Characters', to: '/characters' }, // placeholder routes
    { icon: FileText, label: 'Writing', to: '/writing' },
    { icon: MessageSquare, label: 'AI', to: '/ai' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[var(--mobile-nav-height)] bg-[var(--color-bg-rail)] border-t border-[var(--color-border-subtle)] flex items-center justify-around px-2 z-40 pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
            isActive ? "text-[var(--color-accent-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          )}
        >
          {({ isActive }) => (
            <>
              <item.icon size={20} className={isActive ? "text-[var(--color-accent-primary)]" : "currentColor"} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}
