import { useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import useTimelineStore from '@/store/useTimelineStore'
import { shiftISODate, snapRedateMonths, formatEventDate } from '@/utils/dateUtils'
import { REDATE_DRAG_THRESHOLD_PX } from '@/utils/constants'
import { haptic } from '@/utils/haptics'

/**
 * Drag an event sideways along a horizontal timeline to change its date.
 * The move snaps to the event's precision (months, years or decades), shows
 * where it will land while dragging, and commits through moveEventDate (one
 * undo step, with an Undo toast). Esc cancels a drag in progress.
 *
 * Mouse and pen only: on touch, a sideways swipe over a card should keep
 * scrolling the timeline rather than quietly move the event.
 *
 * Spread getDragProps(event) on the element that starts the drag, and call
 * consumeClick() in its onClickCapture so the click that ends a drag doesn't
 * also open the card.
 */
export default function useRedateDrag({ editable, pxPerYear }) {
  const [drag, setDrag] = useState(null) // { id, months } once past the threshold
  const startRef = useRef(null) // { id } while a press is held
  const liveRef = useRef(null) // mirrors `drag` for handlers between renders
  const suppressClickRef = useRef(false)

  const update = (next) => {
    liveRef.current = next
    setDrag(next)
  }

  const reset = () => {
    startRef.current = null
    update(null)
  }

  useHotkeys('escape', () => {
    suppressClickRef.current = true
    reset()
  }, { enabled: !!drag })

  // Follow the press on window, not the element: the pointer leaves a small
  // dot or card long before the drag ends. No pointer capture, so a plain
  // click on a photo or button inside the card still lands where it should.
  const startPress = (event, e) => {
    const startX = e.clientX
    startRef.current = { id: event.id }

    const onMove = (ev) => {
      if (startRef.current?.id !== event.id) return stop()
      const dx = ev.clientX - startX
      const live = liveRef.current
      if (!live && Math.abs(dx) < REDATE_DRAG_THRESHOLD_PX) return
      ev.preventDefault() // no text selection while dragging
      const months = snapRedateMonths((dx / pxPerYear) * 12, event)
      if (live && live.months === months) return
      if (live) haptic('light')
      update({ id: event.id, months })
    }
    const onUp = () => {
      const live = startRef.current?.id === event.id ? liveRef.current : null
      stop()
      if (!live) return
      suppressClickRef.current = true
      if (live.months !== 0) {
        haptic('medium')
        useTimelineStore.getState().moveEventDate(event.id, live.months)
      }
    }
    const stop = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', stop)
      if (startRef.current?.id === event.id) reset()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', stop)
  }

  const getDragProps = (event) => {
    if (!editable || !event.dateStart) return {}
    return {
      onPointerDown: (e) => {
        // Keep the container's drag-to-scroll from starting under a card
        e.stopPropagation()
        suppressClickRef.current = false
        if (e.button !== 0 || e.pointerType === 'touch') return
        startPress(event, e)
      },
    }
  }

  // True once after a drag ends: the click that follows belongs to the drag
  const consumeClick = () => {
    if (!suppressClickRef.current) return false
    suppressClickRef.current = false
    return true
  }

  const offsetFor = (id) => (drag?.id === id ? (drag.months / 12) * pxPerYear : 0)

  // Where the dragged event would land, for the floating label
  const preview = (event) => {
    if (drag?.id !== event.id) return null
    const moved = {
      ...event,
      dateStart: shiftISODate(event.dateStart, drag.months, 'month'),
      dateEnd: event.dateEnd ? shiftISODate(event.dateEnd, drag.months, 'month') : event.dateEnd,
    }
    return { label: formatEventDate(moved), months: drag.months }
  }

  return { draggingId: drag?.id ?? null, getDragProps, consumeClick, offsetFor, preview }
}
