import { cn } from '@/utils/cn'

interface ConfidenceBarProps {
  value: number      // 0 to 1
  label?: string
  showPercent?: boolean
  size?: 'sm' | 'md'
}

function getColorClass(value: number): string {
  if (value >= 0.8) return 'bg-success'
  if (value >= 0.6) return 'bg-warning'
  return 'bg-error'
}

function getTextClass(value: number): string {
  if (value >= 0.8) return 'text-success-dark'
  if (value >= 0.6) return 'text-warning-dark'
  return 'text-error-dark'
}

export function ConfidenceBar({ value, label, showPercent = true, size = 'md' }: ConfidenceBarProps) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100)

  return (
    <div className="flex flex-col gap-1.5">
      {(label || showPercent) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm text-muted">{label}</span>}
          {showPercent && (
            <span className={cn('text-sm font-semibold', getTextClass(value))}>
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Confidence'}
        className={cn(
          'w-full rounded-full bg-gray-100 overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            getColorClass(value),
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
