import React, { useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  MessageSquare,
  BookOpen,
  Camera,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FlaskConical,
  MessagesSquare,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store/useAppStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',              to: '/',                icon: Home          },
  { label: 'Live Session',      to: '/session',         icon: MessagesSquare },
  { label: 'Communicate',       to: '/communicate',     icon: MessageSquare },
  { label: 'Phrasebook',        to: '/phrasebook',      icon: BookOpen      },
  { label: 'Sign Recognition',  to: '/sign-recognition',icon: Camera        },
  { label: 'Dataset Collector', to: '/collector',       icon: FlaskConical  },
  { label: 'Learn',             to: '/learn',           icon: GraduationCap },
  { label: 'Settings',          to: '/settings',        icon: Settings      },
]



// ─── Component ───────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation()
  const { settings } = useAppStore()
  const { demoMode } = settings

  /**
   * Determine if a nav item is active.
   * Home ("/") must be an exact match; all others use prefix match.
   */
  const isActive = useCallback(
    (to: string) =>
      to === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(to),
    [location.pathname],
  )

  return (
    <aside
      id="main-sidebar"
      role="navigation"
      aria-label="Main navigation"
      style={{ width: isOpen ? 240 : 64 }}
      className={cn(
        'fixed top-[60px] left-0 bottom-0 z-30',
        'flex flex-col bg-white border-r border-border',
        'transition-[width] duration-200 ease-in-out overflow-hidden',
        // On mobile the sidebar sits above content; handled by AppShell overlay
      )}
    >
      {/* ── Navigation items ──────────────────────────────────── */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <ul role="list" className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => {
            const active = isActive(to)
            return (
              <li key={to} role="listitem">
                <NavLink
                  to={to}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  title={!isOpen ? label : undefined}   // tooltip when collapsed
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-2.5 py-2.5',
                    'text-sm font-medium transition-colors duration-150',
                    'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none',
                    active
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-primary-50 hover:text-primary',
                  )}
                >
                  {/* Icon */}
                  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5">
                    <Icon
                      size={18}
                      aria-hidden="true"
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </span>

                  {/* Label — hidden when collapsed */}
                  <span
                    className={cn(
                      'truncate transition-opacity duration-150 select-none',
                      isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden',
                    )}
                    aria-hidden={!isOpen}
                  >
                    {label}
                  </span>

                  {/* Tooltip visible when collapsed (CSS-based, accessible via title attr above) */}
                  {!isOpen && (
                    <span
                      role="tooltip"
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute left-full ml-2 z-50',
                        'whitespace-nowrap rounded-md px-2 py-1',
                        'bg-gray-900 text-white text-xs shadow-md',
                        'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
                        'transition-opacity duration-150',
                      )}
                    >
                      {label}
                    </span>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Bottom section ────────────────────────────────────── */}
      <div className="flex flex-col gap-2 px-2 pb-3">
        {/* Demo mode badge */}
        {demoMode && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg px-2.5 py-2',
              'bg-amber-50 border border-amber-200',
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
              'transition-opacity duration-150',
            )}
            aria-label="Demo mode is active"
          >
            <FlaskConical size={14} className="text-amber-600 flex-shrink-0" aria-hidden="true" />
            {isOpen && (
              <span className="text-xs font-medium text-amber-700 truncate">
                Demo Mode Active
              </span>
            )}
          </div>
        )}

        {/* Privacy note */}
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-2.5 py-2',
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
            'transition-opacity duration-150',
          )}
          aria-label="Data processed locally"
        >
          <ShieldCheck size={14} className="text-success flex-shrink-0" aria-hidden="true" />
          {isOpen && (
            <span className="text-xs text-muted truncate">
              Data stays on device
            </span>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className={cn(
            'flex items-center justify-center rounded-lg p-2.5',
            'text-gray-500 hover:bg-primary-50 hover:text-primary',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none',
            'transition-colors duration-150',
            isOpen ? 'self-end' : 'self-center',
          )}
        >
          {isOpen
            ? <ChevronLeft size={18} aria-hidden="true" />
            : <ChevronRight size={18} aria-hidden="true" />}
        </button>
      </div>
    </aside>
  )
}
