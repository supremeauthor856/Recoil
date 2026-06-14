import { useEffect } from 'react'
import { Providers } from './providers'
import { AppRouter } from './Router'
import { useUIStore } from '../store/uiStore'
import '../styles/globals.css' // Import styles explicitly

export default function App() {
  const setIsOnline = useUIStore(state => state.setIsOnline)

  useEffect(() => {
    // Add dark mode by default
    document.documentElement.classList.add('dark')
    document.body.style.backgroundColor = 'var(--color-bg-base)'
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setIsOnline])

  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}
