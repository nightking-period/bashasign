import type { ReactNode } from 'react'
import { Button } from './Button'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: { wrapper: 'py-8 gap-3', icon: 'w-10 h-10', title: 'text-base', desc: 'text-sm' },
  md: { wrapper: 'py-12 gap-4', icon: 'w-14 h-14', title: 'text-lg', desc: 'text-base' },
  lg: { wrapper: 'py-16 gap-5', icon: 'w-20 h-20', title: 'text-xl', desc: 'text-base' },
}

export function EmptyState({ icon, title, description, action, size = 'md' }: EmptyStateProps) {
  const cls = sizeClasses[size]
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', cls.wrapper)}>
      {icon && (
        <div className={cn('flex items-center justify-center rounded-full bg-gray-100 text-muted shrink-0', cls.icon)}>
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className={cn('font-semibold text-gray-700', cls.title)}>{title}</h3>
        {description && <p className={cn('text-muted', cls.desc)}>{description}</p>}
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
