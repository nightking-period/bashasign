import React from 'react'
import { HandMetal, Menu, X, Accessibility } from 'lucide-react'
import { cn } from '@/utils/cn'
import { LanguageSelector } from './LanguageSelector'

interface NavbarProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

export function Navbar({ onToggleSidebar, isSidebarOpen }: NavbarProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-[60px] bg-white border-b border-border
                 flex items-center justify-between px-4 gap-4"
      role="banner"
    >
      {/* ── Left: hamburger + logo ────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — always visible; toggles sidebar on all sizes */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
          aria-expanded={isSidebarOpen}
          aria-controls="main-sidebar"
          className={cn(
            'flex-shrink-0 rounded-lg p-2 text-gray-600',
            'hover:bg-primary-50 hover:text-primary',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none',
            'transition-colors duration-150',
          )}
        >
          {isSidebarOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>

        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 min-w-0 focus-visible:ring-2 focus-visible:ring-accent
                     focus-visible:ring-offset-2 outline-none rounded"
          aria-label="BhashaSign — Government Communication — go to home"
        >
          <span
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg
                       bg-primary text-white"
            aria-hidden="true"
          >
            <HandMetal size={20} />
          </span>
          <span className="hidden xs:flex flex-col leading-tight min-w-0">
            <span className="font-bold text-primary text-base leading-tight truncate">
              BhashaSign
            </span>
            <span className="text-muted text-xs leading-tight truncate">
              Government Communication
            </span>
          </span>
        </a>
      </div>

      {/* ── Right: language selector + accessibility toggle ───── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <LanguageSelector />

        <button
          type="button"
          aria-label="Accessibility options"
          className={cn(
            'hidden sm:flex items-center justify-center w-9 h-9 rounded-lg',
            'text-gray-600 hover:bg-primary-50 hover:text-primary',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none',
            'transition-colors duration-150',
          )}
        >
          <Accessibility size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
