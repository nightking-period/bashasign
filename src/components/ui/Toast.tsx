import { create } from 'zustand'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useEffect } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: ToastItem[]
  add: (t: Omit<ToastItem, 'id'>) => void
  remove: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (t) => set((state) => ({
    toasts: [...state.toasts.slice(-3), { ...t, id: Math.random().toString(36).slice(2) }],
  })),
  remove: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}))

export function useToast() {
  const { add } = useToastStore()
  return {
    success: (message: string) => add({ type: 'success', message, duration: 4000 }),
    error:   (message: string) => add({ type: 'error',   message, duration: 5000 }),
    info:    (message: string) => add({ type: 'info',    message, duration: 4000 }),
    warning: (message: string) => add({ type: 'warning', message, duration: 4500 }),
  }
}

const TOAST_STYLES: Record<ToastType, { wrapper: string; icon: typeof CheckCircle2; role: string }> = {
  success: { wrapper: 'bg-success-light border-success text-success-dark', icon: CheckCircle2, role: 'status' },
  error:   { wrapper: 'bg-error-light border-error text-error-dark',       icon: AlertCircle,  role: 'alert' },
  info:    { wrapper: 'bg-info-light border-info text-info-dark',           icon: Info,         role: 'status' },
  warning: { wrapper: 'bg-warning-light border-warning text-warning-dark', icon: AlertTriangle, role: 'status' },
}

function ToastItem({ toast }: { toast: ToastItem }) {
  const remove = useToastStore(s => s.remove)
  const config = TOAST_STYLES[toast.type]
  const Icon = config.icon

  useEffect(() => {
    const t = setTimeout(() => remove(toast.id), toast.duration ?? 4000)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, remove])

  return (
    <div
      role={config.role}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-md max-w-sm w-full',
        'animate-slide-up',
        config.wrapper,
      )}
    >
      <Icon size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => remove(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)
  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}

export { useToastStore }
