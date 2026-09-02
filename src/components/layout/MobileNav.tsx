import { NavLink } from 'react-router-dom'
import { Home, MessageSquare, BookOpen, Camera, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { to: '/',                  label: 'Home',        Icon: Home },
  { to: '/communicate',       label: 'Communicate', Icon: MessageSquare },
  { to: '/phrasebook',        label: 'Phrases',     Icon: BookOpen },
  { to: '/sign-recognition',  label: 'Recognition', Icon: Camera },
  { to: '/settings',          label: 'Settings',    Icon: Settings },
]

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border h-16 flex md:hidden"
    >
      {NAV_ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium',
            'transition-colors duration-150 min-h-[44px]',
            isActive ? 'text-primary' : 'text-muted hover:text-primary',
          )}
          aria-label={label}
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
