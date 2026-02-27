import { useEffect } from 'react'
import useTimelineStore from '@/store/useTimelineStore'

export default function useKeyboardShortcuts() {
  const undo = useTimelineStore((s) => s.undo)
  const redo = useTimelineStore((s) => s.redo)

  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger when typing in inputs
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.target.isContentEditable) return

      const mod = e.metaKey || e.ctrlKey

      // Cmd/Ctrl+Z = Undo
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }

      // Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y = Redo
      if ((mod && e.shiftKey && e.key === 'z') || (mod && e.key === 'y')) {
        e.preventDefault()
        redo()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])
}
