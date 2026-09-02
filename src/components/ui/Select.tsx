import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  group?: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  fullWidth?: boolean
  placeholder?: string
}

export function Select({
  label, error, hint, options, fullWidth = false,
  placeholder, id, className, ...props
}: SelectProps) {
  const selectId = id ?? `select-${Math.random().toString(36).slice(2)}`

  // Group options
  const groups = options.reduce<Record<string, SelectOption[]>>((acc, opt) => {
    const g = opt.group ?? '__default__'
    if (!acc[g]) acc[g] = []
    acc[g].push(opt)
    return acc
  }, {})

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          {...props}
          id={selectId}
          aria-invalid={!!error}
          className={cn(
            'min-h-[44px] w-full appearance-none rounded-md border bg-white pl-3 pr-10 py-2',
            'text-base text-gray-900 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
            error ? 'border-error' : 'border-border hover:border-gray-400',
            className,
          )}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {groups['__default__']
            ? options.map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : Object.entries(groups).map(([groupName, opts]) => (
                <optgroup key={groupName} label={groupName}>
                  {opts.map(opt => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))
          }
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      {!error && hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  )
}
