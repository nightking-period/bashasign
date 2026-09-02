import React, { useRef, useState, useCallback, useEffect } from 'react'
import { ChevronDown, Check, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store/useAppStore'
import { LANGUAGES, getLanguage } from '@/data/languages'
import type { LanguageCode } from '@/types'

// Flag emojis keyed by language code
const LANG_FLAGS: Record<string, string> = {
  en: '🇬🇧', te: '🇮🇳', hi: '🇮🇳', ta: '🇮🇳',
  kn: '🇮🇳', ml: '🇮🇳', mr: '🇮🇳', bn: '🇮🇳',
}

export function LanguageSelector() {
  const { settings, setLanguage } = useAppStore()
  const currentLang = getLanguage(settings.language)

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setIsOpen(false); buttonRef.current?.focus() }
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  // Keyboard nav in list
  const handleListKeyDown = useCallback((e: React.KeyboardEvent<HTMLUListElement>) => {
    const items = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not([disabled])')
    if (!items || items.length === 0) return
    const focused = document.activeElement as HTMLButtonElement
    const idx = Array.from(items).indexOf(focused)
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus() }
  }, [])

  // Focus first option when opens
  useEffect(() => {
    if (isOpen) {
      const first = listRef.current?.querySelector<HTMLButtonElement>('[role="option"]:not([disabled])')
      setTimeout(() => first?.focus(), 50)
    }
  }, [isOpen])

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code)
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Language: ${currentLang?.name ?? settings.language}. Click to change.`}
        onClick={() => setIsOpen(v => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium',
          'text-gray-700 hover:bg-primary-50 hover:text-primary',
          'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none',
          'transition-colors duration-150',
        )}
      >
        <span aria-hidden="true" className="text-base leading-none">
          {LANG_FLAGS[settings.language] ?? '🌐'}
        </span>
        <span className="hidden sm:inline truncate max-w-[80px]">
          {currentLang?.nativeName ?? settings.language}
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn('text-gray-400 transition-transform duration-150', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1 z-50',
            'w-60 rounded-xl bg-white border border-border shadow-md overflow-hidden',
          )}
          role="presentation"
        >
          <div className="px-3 pt-2.5 pb-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Select Language</p>
          </div>
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Available languages"
            onKeyDown={handleListKeyDown}
            className="py-1 max-h-72 overflow-y-auto"
          >
            {LANGUAGES.map(lang => {
              const isSelected = lang.code === settings.language
              return (
                <li key={lang.code} role="option" aria-selected={isSelected} aria-disabled={!lang.enabled}>
                  <button
                    type="button"
                    disabled={!lang.enabled}
                    onClick={() => lang.enabled && handleSelect(lang.code)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100 outline-none',
                      isSelected ? 'bg-primary-50 text-primary' : 'text-gray-700',
                      lang.enabled && 'hover:bg-gray-50 focus-visible:bg-primary-50 focus-visible:text-primary',
                      !lang.enabled && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <span aria-hidden="true" className="text-lg leading-none shrink-0">
                      {LANG_FLAGS[lang.code] ?? '🌐'}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-sm truncate">{lang.nativeName}</span>
                      <span className="block text-xs text-muted truncate">{lang.name}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {!lang.enabled ? (
                        <span className="flex items-center gap-1 text-[10px] text-muted font-medium">
                          <Clock size={10} aria-hidden="true" /> Soon
                        </span>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-muted uppercase px-1.5 py-0.5 bg-gray-100 rounded">
                            {lang.code}
                          </span>
                          {isSelected && <Check size={14} className="text-primary" aria-hidden="true" />}
                        </>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
