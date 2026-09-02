import { cn } from '@/utils/cn'
import {
  CheckCircle2, AlertCircle, Clock, Wifi, AlertTriangle, Loader2,
} from 'lucide-react'

export type StatusType = 'ready' | 'processing' | 'error' | 'idle' | 'warning' | 'success'

const STATUS_CONFIG: Record<StatusType, {
  dotClass: string
  textClass: string
  Icon: typeof CheckCircle2
  label: string
}> = {
  ready:      { dotClass: 'bg-secondary',       textClass: 'text-secondary-600', Icon: Wifi,         label: 'Ready' },
  processing: { dotClass: 'bg-accent animate-pulse', textClass: 'text-accent-600', Icon: Loader2, label: 'Processing' },
  error:      { dotClass: 'bg-error',           textClass: 'text-error',         Icon: AlertCircle,  label: 'Error' },
  idle:       { dotClass: 'bg-muted',           textClass: 'text-muted',         Icon: Clock,        label: 'Idle' },
  warning:    { dotClass: 'bg-warning',         textClass: 'text-warning-dark',  Icon: AlertTriangle,label: 'Warning' },
  success:    { dotClass: 'bg-success',         textClass: 'text-success-dark',  Icon: CheckCircle2, label: 'Success' },
}

interface StatusIndicatorProps {
  status: StatusType
  label: string
  size?: 'sm' | 'md'
  showIcon?: boolean
}

export function StatusIndicator({ status, label, size = 'md', showIcon = false }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status]
  const { Icon } = config

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={cn('inline-flex items-center gap-2', size === 'sm' ? 'text-xs' : 'text-sm')}
    >
      {showIcon ? (
        <Icon
          size={size === 'sm' ? 12 : 14}
          className={cn(config.textClass, status === 'processing' && 'animate-spin')}
          aria-hidden="true"
        />
      ) : (
        <span className={cn('rounded-full shrink-0', size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5', config.dotClass)} aria-hidden="true" />
      )}
      <span className={cn('font-medium', config.textClass)}>{label}</span>
      {/* Screen reader text describing status type */}
      <span className="sr-only">Status: {config.label}</span>
    </div>
  )
}
