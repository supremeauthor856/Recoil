import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Scroll the MainContent area to top on every route change
    // The main scrollable area is the element with overflow-y auto below ContentHeader
    const scrollArea = document.getElementById('main-scroll-area')
    if (scrollArea) {
      scrollArea.scrollTo({ top: 0, behavior: 'instant' })
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [pathname])

  return null
}
