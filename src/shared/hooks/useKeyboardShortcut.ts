import { useEffect } from 'react'

export interface ShortcutKey {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}

export function useKeyboardShortcut(
  shortcut: ShortcutKey,
  callback: (e: KeyboardEvent) => void
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        (shortcut.ctrlKey ? event.ctrlKey : true) &&
        (shortcut.metaKey ? event.metaKey : true) &&
        (shortcut.shiftKey ? event.shiftKey : true) &&
        (shortcut.altKey ? event.altKey : true)
      ) {
        callback(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcut, callback])
}
