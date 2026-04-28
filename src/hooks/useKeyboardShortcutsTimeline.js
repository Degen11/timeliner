import { useHotkeys } from 'react-hotkeys-hook'
import useTimelineStore from '@/store/useTimelineStore'
import { VIEWS } from '@/utils/constants'

export default function useKeyboardShortcutsTimeline({ onAddEvent, onTogglePrint, onShowShortcuts, onOpenInsights }) {
  const setActiveView = useTimelineStore((s) => s.setActiveView)
  const requestSearchFocus = useTimelineStore((s) => s.requestSearchFocus)
  const toggleSidebar = useTimelineStore((s) => s.toggleSidebar)

  useHotkeys('1', () => setActiveView(VIEWS.VERTICAL), { enableOnFormTags: false })
  useHotkeys('2', () => setActiveView(VIEWS.HORIZONTAL), { enableOnFormTags: false })
  useHotkeys('3', () => setActiveView(VIEWS.GRID), { enableOnFormTags: false })
  useHotkeys('4', () => setActiveView(VIEWS.MAP), { enableOnFormTags: false })
  useHotkeys('5', () => setActiveView(VIEWS.GRAPH), { enableOnFormTags: false })

  useHotkeys('n', () => onAddEvent?.(), { enableOnFormTags: false })

  useHotkeys('mod+p', (e) => {
    e.preventDefault()
    onTogglePrint?.()
  }, { enableOnFormTags: false })

  useHotkeys('shift+/', () => onShowShortcuts?.(), { enableOnFormTags: false })

  useHotkeys('i', () => onOpenInsights?.(), { enableOnFormTags: false })

  useHotkeys('/', (e) => {
    e.preventDefault()
    const { sidebarCollapsed } = useTimelineStore.getState()
    if (sidebarCollapsed) toggleSidebar()
    // If sidebar was collapsed, SearchInput mounts after animation and sees
    // the incremented counter on mount — so no delay is needed.
    requestSearchFocus()
  }, { enableOnFormTags: false })
}
