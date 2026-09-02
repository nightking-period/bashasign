import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary:   'bg-primary text-white hover:bg-primary-700',
  secondary: 'bg-secondary text-white hover:bg-secondary-600',
  outline:   'border border-border bg-white text-primary hover:bg-primary-50 hover:border-primary',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-primary',
  danger:    'bg-error text-white hover:bg-error-dark',
}

const sizeClasses: Record<Size, string> = {
  sm: 'w-8 h-8 rounded',
  md: 'w-11 h-11 rounded-md',
  lg: 'w-13 h-13 rounded-lg',
}

const iconSizes: Record<Size, number> = { sm: 14, md: 18, lg: 22 }

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  variant?: Variant
  size?: Size
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled,
  className,
  ...props
}: IconButtonProps) {
  return (
    <div className="relative group inline-block">
      <button
        {...props}
        aria-label={label}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
      >
        <span style={{ width: iconSizes[size], height: iconSizes[size] }} className="flex items-center justify-center">
          {icon}
        </span>
      </button>
      {/* Tooltip */}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5',
          'whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white',
          'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          'transition-opacity duration-150 z-50',
        )}
      >
        {label}
      </span>
    </div>
  )
}
