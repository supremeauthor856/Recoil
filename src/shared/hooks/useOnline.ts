import { useState, useEffect } from 'react'
import { useUIStore } from '../../store/uiStore'

export function useOnline() {
  const [isOnline, setIsOnlineLocal] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const setIsOnlineStore = useUIStore(state => state.setIsOnline)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineLocal(true)
      setIsOnlineStore(true)
    }
    const handleOffline = () => {
      setIsOnlineLocal(false)
      setIsOnlineStore(false)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [setIsOnlineStore])

  return isOnline
}
