import { useEffect } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { Toast as ToastType } from '../../types/common'
import { useUIStore } from '../../../store/uiStore'

export const Toast = ({ id, type, title, description, duration = 4000 }: ToastType) => {
  const removeToast = useUIStore(state => state.removeToast)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, removeToast])

  const icons = {
    success: <CheckCircle className="text-[var(--color-success)]" size={20} />,
    warning: <AlertTriangle className="text-[var(--color-warning)]" size={20} />,
    error: <XCircle className="text-[var(--color-error)]" size={20} />,
    info: <Info className="text-[var(--color-info)]" size={20} />
  }

  const borderColors = {
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    error: 'bg-[var(--color-error)]',
    info: 'bg-[var(--color-info)]'
  }

  return (
    <div className="pointer-events-auto w-[320px] bg-[var(--color-bg-floating)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden flex relative animate-in slide-in-from-right duration-200 fade-in">
      <div className={cn("w-1 flex-shrink-0 relative", borderColors[type])} />
      <div className="p-3 flex items-start gap-3 flex-1">
        <div className="flex-shrink-0 mt-0.5">
          {icons[type]}
        </div>
        <div className="flex-1">
          <h4 className="text-[14px] font-semibold text-[var(--color-text-primary)] leading-tight">{title}</h4>
          {description && (
            <p className="text-[12px] text-[var(--color-text-secondary)] mt-1 leading-snug">{description}</p>
          )}
        </div>
        <button
          onClick={() => removeToast(id)}
          className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-0.5 mt-0.5"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
