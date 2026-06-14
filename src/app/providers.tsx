import { ToastProvider } from '../shared/components/ui/ToastProvider'

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}
