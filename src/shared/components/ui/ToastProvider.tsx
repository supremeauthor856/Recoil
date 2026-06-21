import React, { useEffect } from 'react'
import { useUIStore } from '../../../store/uiStore'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { toasts, removeToast } = useUIStore()

  return (
    <>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          // Auto dismiss
          return (
            <ToastItem
              key={toast.id}
              id={toast.id}
              title={toast.title}
              type={toast.type}
              duration={toast.duration || 4000}
              onClose={removeToast}
            />
          )
        })}
      </div>
    </>
  )
}

interface ToastItemProps {
  id: string
  title: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration: number
  onClose: (id: string) => void
}

const ToastItem = ({ id, title, type, duration, onClose }: ToastItemProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)
    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const iconMap = {
    success: <CheckCircle className="text-[var(--color-success)] shrink-0" size={16} />,
    error: <AlertCircle className="text-[var(--color-error)] shrink-0" size={16} />,
    warning: <AlertTriangle className="text-[var(--color-warning)] shrink-0" size={16} />,
    info: <Info className="text-[var(--color-info)] shrink-0" size={16} />,
  }

  const borderThemes = {
    success: 'border-[var(--color-success)]/20 bg-[var(--color-success-dim)] text-[var(--color-text-primary)]',
    error: 'border-[var(--color-error)]/20 bg-[var(--color-error-dim)] text-[var(--color-text-primary)]',
    warning: 'border-[var(--color-warning)]/20 bg-[var(--color-warning-dim)] text-[var(--color-text-primary)]',
    info: 'border-[var(--color-info)]/20 bg-[var(--color-info-dim)] text-[var(--color-text-primary)]',
  }

  return (
    <div
      onClick={() => onClose(id)}
      className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-[var(--radius-xl)] border shadow-xl animate-fade-in transition-all duration-300 hover:scale-[1.01] cursor-pointer ${borderThemes[type]}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {iconMap[type]}
        <p className="text-[12px] font-medium leading-relaxed truncate select-none">
          {title}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose(id)
        }}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] p-0.5 rounded transition-colors focus:outline-none"
      >
        <X size={14} />
      </button>
    </div>
  )
}
