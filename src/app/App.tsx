import { useEffect } from 'react'
import { Providers } from './providers'
import { AppRouter } from './Router'
import { useUIStore } from '../store/uiStore'
import { useSettingsStore } from '../store/settingsStore'
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

  useEffect(() => {
    const applyTheme = (theme: string, fontSize: string, reducedMotion: boolean) => {
      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.setAttribute('data-font', fontSize)
      if (reducedMotion) {
        document.documentElement.classList.add('reduce-motion')
      } else {
        document.documentElement.classList.remove('reduce-motion')
      }
    }
    const settings = useSettingsStore.getState()
    applyTheme(settings.theme, settings.fontSize, settings.reducedMotion)
    return useSettingsStore.subscribe(
      state => applyTheme(state.theme, state.fontSize, state.reducedMotion)
    )
  }, [])

  return (
    <Providers>
      <AppRouter />
    </Providers>
  )
}
