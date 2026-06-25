import { useEffect } from 'react'
import { Providers } from './providers'
import { AppRouter } from './Router'
import { useUIStore } from '../store/uiStore'
import { useSettingsStore } from '../store/settingsStore'
import { ErrorBoundary } from '../shared/components/error/ErrorBoundary'
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

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      // CMD+K or Ctrl+K — open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        const activeEl = document.activeElement
        const isInput = activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          activeEl.getAttribute('contenteditable') === 'true' ||
          activeEl.closest('[contenteditable="true"]')
        )
        if (isInput) return

        e.preventDefault()
        useUIStore.getState().openSearchPalette()
      }

      // Escape — close search palette if open (modals handle their own Escape)
      if (e.key === 'Escape' && useUIStore.getState().searchPaletteOpen) {
        useUIStore.getState().closeSearchPalette()
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  return (
    <ErrorBoundary>
      <Providers>
        <AppRouter />
      </Providers>
    </ErrorBoundary>
  )
}
