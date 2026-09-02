import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'muted'

const variantClasses: Record<Variant, string> = {
  primary:   'bg-primary-50 text-primary-700 border-primary-100',
  secondary: 'bg-secondary-50 text-secondary-700 border-secondary-100',
  accent:    'bg-accent-50 text-accent-700 border-accent-100',
  success:   'bg-success-light text-success-dark border-green-100',
  warning:   'bg-warning-light text-warning-dark border-orange-100',
  error:     'bg-error-light text-error-dark border-red-100',
  muted:     'bg-gray-100 text-gray-600 border-gray-200',
}

interface BadgeProps {
  children: ReactNode
  variant?: Variant
  dot?: boolean
  onRemove?: () => void
  className?: string
}

export function Badge({ children, variant = 'muted', dot = false, onRemove, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
      variantClasses[variant],
      className,
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />}
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label="Remove"
          className="ml-0.5 rounded-full opacity-60 hover:opacity-100 transition-opacity focus-ring"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M6.414 5l2.293-2.293a1 1 0 0 0-1.414-1.414L5 3.586 2.707 1.293A1 1 0 0 0 1.293 2.707L3.586 5 1.293 7.293a1 1 0 1 0 1.414 1.414L5 6.414l2.293 2.293a1 1 0 0 0 1.414-1.414L6.414 5z" />
          </svg>
        </button>
      )}
    </span>
  )
}
