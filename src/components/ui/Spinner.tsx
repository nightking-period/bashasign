import { cn } from '@/utils/cn'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type SpinnerColor = 'primary' | 'accent' | 'white' | 'muted'

const sizeMap: Record<SpinnerSize, number> = {
  xs: 12, sm: 16, md: 24, lg: 36, xl: 48,
}

const colorMap: Record<SpinnerColor, string> = {
  primary: 'text-primary',
  accent:  'text-accent',
  white:   'text-white',
  muted:   'text-muted',
}

interface SpinnerProps {
  size?: SpinnerSize
  color?: SpinnerColor
  label?: string
}

export function Spinner({ size = 'md', color = 'primary', label = 'Loading...' }: SpinnerProps) {
  const px = sizeMap[size]
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('animate-spin', colorMap[color])}
      aria-label={label}
      role="img"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray="31.4" strokeDashoffset="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
