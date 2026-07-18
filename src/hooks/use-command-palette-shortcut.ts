import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'

/** Global ⌘K / Ctrl+K → toggle command palette */
export function useCommandPaletteShortcut() {
  const toggle = useAppStore((s) => s.toggleCommandPalette)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])
}
