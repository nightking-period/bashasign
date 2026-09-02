import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
  characterCount?: boolean
}

export function Textarea({
  label, error, hint, fullWidth = false,
  characterCount = false, maxLength,
  id, className, value, ...props
}: TextareaProps) {
  const inputId = id ?? `textarea-${Math.random().toString(36).slice(2)}`
  const currentLength = typeof value === 'string' ? value.length : 0

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        {...props}
        id={inputId}
        value={value}
        maxLength={maxLength}
        aria-invalid={!!error}
        className={cn(
          'w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 resize-y min-h-[100px]',
          'placeholder:text-muted transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
          error ? 'border-error' : 'border-border hover:border-gray-400',
          className,
        )}
      />
      <div className="flex items-center justify-between">
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        {!error && hint && <p className="text-sm text-muted">{hint}</p>}
        {characterCount && maxLength && (
          <p className={cn('text-xs ml-auto', currentLength >= maxLength ? 'text-error' : 'text-muted')}>
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}
