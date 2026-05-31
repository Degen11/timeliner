import { useHotkeys } from 'react-hotkeys-hook'
import useTimelineStore from '@/store/useTimelineStore'
import { VIEWS } from '@/utils/constants'
import { isModalOpen } from '@/utils/modalStack'

export default function useKeyboardShortcutsTimeline({ onAddEvent, onTogglePrint, onShowShortcuts, onOpenInsights }) {
  const setActiveView = useTimelineStore((s) => s.setActiveView)
  const requestSearchFocus = useTimelineStore((s) => s.requestSearchFocus)
  const toggleSidebar = useTimelineStore((s) => s.toggleSidebar)

  // Don't fire background shortcuts while a modal/lightbox is open. enableOnFormTags
  // only suppresses these when focus is in an input — with a modal open but focus on
  // a button or the dialog itself, view-switch / new-event would still leak through.
  const guard = (fn) => (e) => {
    if (isModalOpen()) return
    fn(e)
  }

  useHotkeys('1', guard(() => setActiveView(VIEWS.VERTICAL)), { enableOnFormTags: false })
  useHotkeys('2', guard(() => setActiveView(VIEWS.HORIZONTAL)), { enableOnFormTags: false })
  useHotkeys('3', guard(() => setActiveView(VIEWS.GRID)), { enableOnFormTags: false })
  useHotkeys('4', guard(() => setActiveView(VIEWS.MAP)), { enableOnFormTags: false })
  useHotkeys('5', guard(() => setActiveView(VIEWS.GRAPH)), { enableOnFormTags: false })

  useHotkeys('n', guard(() => onAddEvent?.()), { enableOnFormTags: false })

  useHotkeys('mod+p', (e) => {
    e.preventDefault()
    onTogglePrint?.()
  }, { enableOnFormTags: false })

  useHotkeys('shift+/', () => onShowShortcuts?.(), { enableOnFormTags: false })

  useHotkeys('i', guard(() => onOpenInsights?.()), { enableOnFormTags: false })

  useHotkeys('/', guard((e) => {
    e.preventDefault()
    const { sidebarCollapsed } = useTimelineStore.getState()
    if (sidebarCollapsed) toggleSidebar()
    // If sidebar was collapsed, SearchInput mounts after animation and sees
    // the incremented counter on mount — so no delay is needed.
    requestSearchFocus()
  }), { enableOnFormTags: false })
}
