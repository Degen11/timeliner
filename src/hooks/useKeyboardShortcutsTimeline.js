import { useEffect } from 'react'
import useTimelineStore from '@/store/useTimelineStore'
import { VIEWS } from '@/utils/constants'

export default function useKeyboardShortcutsTimeline({ onAddEvent, onTogglePrint }) {
  const setActiveView = useTimelineStore((s) => s.setActiveView)

  useEffect(() => {
    function handleKeyDown(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.target.isContentEditable) return

      const mod = e.metaKey || e.ctrlKey

      // 1/2/3 = Switch views
      if (e.key === '1' && !mod) {
        e.preventDefault()
        setActiveView(VIEWS.VERTICAL)
        return
      }
      if (e.key === '2' && !mod) {
        e.preventDefault()
        setActiveView(VIEWS.HORIZONTAL)
        return
      }
      if (e.key === '3' && !mod) {
        e.preventDefault()
        setActiveView(VIEWS.GRID)
        return
      }

      // N = New event
      if (e.key === 'n' && !mod) {
        e.preventDefault()
        onAddEvent?.()
        return
      }

      // Cmd/Ctrl+P = Print
      if (mod && e.key === 'p') {
        e.preventDefault()
        onTogglePrint?.()
        return
      }

      // ? = Show shortcuts help
      if (e.key === '?' && !mod) {
        e.preventDefault()
        // Could dispatch an event or call a callback
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setActiveView, onAddEvent, onTogglePrint])
}
