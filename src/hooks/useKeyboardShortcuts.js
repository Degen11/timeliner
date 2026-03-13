import { useHotkeys } from 'react-hotkeys-hook'
import useTimelineStore from '@/store/useTimelineStore'

export default function useKeyboardShortcuts() {
  const undo = useTimelineStore((s) => s.undo)
  const redo = useTimelineStore((s) => s.redo)

  useHotkeys('mod+z', (e) => {
    e.preventDefault()
    undo()
  }, { enableOnFormTags: false })

  useHotkeys('mod+shift+z, mod+y', (e) => {
    e.preventDefault()
    redo()
  }, { enableOnFormTags: false })
}
