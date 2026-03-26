import { useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import useTimelineStore from '@/store/useTimelineStore'

/**
 * Manages event selection state including multi-select (Shift/Ctrl+click),
 * Ctrl+A to select all, Escape to deselect, and mobile selection mode.
 *
 * @param {Array} sorted - Sorted/filtered events for range selection
 * @returns {{ selectionMode, setSelectionMode, handleToggleSelect }}
 */
export default function useTimelineSelection(sorted) {
  const [selectionMode, setSelectionMode] = useState(false)
  const selectedEventIds = useTimelineStore((s) => s.selectedEventIds)
  const toggleSelectEvent = useTimelineStore((s) => s.toggleSelectEvent)
  const selectEvents = useTimelineStore((s) => s.selectEvents)
  const clearSelection = useTimelineStore((s) => s.clearSelection)
  const events = useTimelineStore((s) => s.events)

  // Handle Shift/Ctrl+click for multi-select
  const handleToggleSelect = (eventId, e) => {
    // In selection mode (mobile), always toggle without modifier keys
    if (selectionMode) {
      toggleSelectEvent(eventId)
      return
    }
    if (e?.shiftKey && selectedEventIds.length > 0) {
      const lastId = selectedEventIds[selectedEventIds.length - 1]
      const sortedIds = sorted.map((ev) => ev.id)
      const lastIdx = sortedIds.indexOf(lastId)
      const currentIdx = sortedIds.indexOf(eventId)
      if (lastIdx !== -1 && currentIdx !== -1) {
        const start = Math.min(lastIdx, currentIdx)
        const end = Math.max(lastIdx, currentIdx)
        const rangeIds = sortedIds.slice(start, end + 1)
        const merged = [...new Set([...selectedEventIds, ...rangeIds])]
        selectEvents(merged)
        return
      }
    }
    toggleSelectEvent(eventId)
  }

  // Ctrl/Cmd+A to select all visible events
  useHotkeys('mod+a', (e) => {
    if (events.length === 0) return
    const target = e.target
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      return
    e.preventDefault()
    selectEvents(sorted.map((ev) => ev.id))
  }, { enableOnFormTags: false }, [sorted, events.length, selectEvents])

  // Escape to deselect all
  useHotkeys('escape', () => {
    if (selectedEventIds.length > 0) {
      clearSelection()
    }
  }, [selectedEventIds.length, clearSelection])

  return { selectionMode, setSelectionMode, handleToggleSelect }
}
