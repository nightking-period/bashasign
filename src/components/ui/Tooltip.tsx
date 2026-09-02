import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

const positionClasses: Record<TooltipPosition, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
}

interface TooltipProps {
  content: string
  children: ReactNode
  position?: TooltipPosition
  disabled?: boolean
}

let _tooltipId = 0

export function Tooltip({ content, children, position = 'top', disabled = false }: TooltipProps) {
  const id = `tooltip-${++_tooltipId}`

  if (disabled) return <>{children}</>

  return (
    <div className="relative inline-flex group">
      <div aria-describedby={id}>{children}</div>
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap',
          'rounded bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white',
          'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          'transition-opacity duration-150',
          positionClasses[position],
        )}
      >
        {content}
      </span>
    </div>
  )
}
