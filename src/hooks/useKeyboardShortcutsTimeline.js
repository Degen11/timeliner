import { useHotkeys } from 'react-hotkeys-hook'
import useTimelineStore from '@/store/useTimelineStore'
import { VIEWS } from '@/utils/constants'

export default function useKeyboardShortcutsTimeline({ onAddEvent, onTogglePrint, onShowShortcuts }) {
  const setActiveView = useTimelineStore((s) => s.setActiveView)

  useHotkeys('1', () => setActiveView(VIEWS.VERTICAL), { enableOnFormTags: false })
  useHotkeys('2', () => setActiveView(VIEWS.HORIZONTAL), { enableOnFormTags: false })
  useHotkeys('3', () => setActiveView(VIEWS.GRID), { enableOnFormTags: false })

  useHotkeys('n', () => onAddEvent?.(), { enableOnFormTags: false })

  useHotkeys('mod+p', (e) => {
    e.preventDefault()
    onTogglePrint?.()
  }, { enableOnFormTags: false })

  useHotkeys('shift+/', () => onShowShortcuts?.(), { enableOnFormTags: false })
}
