import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

type Size = 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: Size
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  footer?: ReactNode
}

export function Modal({
  isOpen, onClose, title, children, size = 'md',
  showCloseButton = true, closeOnBackdrop = true, footer,
}: ModalProps) {
  const titleId = `modal-title-${Math.random().toString(36).slice(2)}`
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const prev = document.activeElement as HTMLElement
    firstFocusRef.current?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      prev?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-xl animate-slide-up',
          sizeClasses[size],
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">{title}</h2>
          {showCloseButton && (
            <button
              ref={firstFocusRef}
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-md p-1.5 text-muted hover:text-gray-700 hover:bg-gray-100 transition-colors focus-ring"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-gray-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
