/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastItem {
  id: number
  title: string
  description?: string
  variant?: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pushToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { ...toast, id }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 2600)
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md',
              toast.variant === 'error' ? 'border-red-500/30 bg-[var(--red-bg)]' : toast.variant === 'success' ? 'border-green-500/30 bg-[var(--green-bg)]' : 'border-border bg-bg-2/95',
            )}
          >
            <div className="flex items-start gap-3">
              {toast.variant === 'error' ? <CircleAlert size={18} className="mt-0.5 text-[var(--red)]" /> : <CheckCircle2 size={18} className="mt-0.5 text-[var(--green)]" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-xs text-text-muted">{toast.description}</p> : null}
              </div>
              <button onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="rounded-md p-1 text-text-muted hover:bg-bg-4" aria-label="Dismiss toast">
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
