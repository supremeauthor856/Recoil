import { createPortal } from 'react-dom'
import { useUIStore } from '../../../store/uiStore'
import { Toast } from './Toast'

export const ToastProvider = ({ children }: { children?: React.ReactNode }) => {
  const toasts = useUIStore(state => state.toasts)

  return (
    <>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} />
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
