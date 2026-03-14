import { useRef, useCallback } from 'react'

/**
 * Hook that provides drag-to-scroll behavior for a scrollable container.
 * Supports both mouse and touch (via pointer events). Returns props to
 * spread on the scroll container and a `wasDragged()` check to distinguish
 * clicks from drags.
 *
 * @param {Object} [options]
 * @param {(e: PointerEvent) => boolean} [options.shouldIgnore] — return true to skip drag (e.g. when clicking a card)
 * @returns {{ containerRef, scrollProps, wasDragged }}
 */
export default function useDragScroll({ shouldIgnore } = {}) {
  const containerRef = useRef(null)
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false })

  const onPointerDown = useCallback(
    (e) => {
      if (shouldIgnore?.(e)) return
      const el = containerRef.current
      if (!el) return
      dragState.current = {
        active: true,
        startX: e.clientX,
        scrollLeft: el.scrollLeft,
        moved: false,
      }
      el.setPointerCapture(e.pointerId)
    },
    [shouldIgnore]
  )

  const onPointerMove = useCallback((e) => {
    const state = dragState.current
    if (!state.active) return
    e.preventDefault()
    const walk = e.clientX - state.startX
    if (Math.abs(walk) > 4) state.moved = true
    containerRef.current.scrollLeft = state.scrollLeft - walk
  }, [])

  const onPointerUp = useCallback((e) => {
    if (!dragState.current.active) return
    dragState.current.active = false
    containerRef.current?.releasePointerCapture(e.pointerId)
  }, [])

  const wasDragged = useCallback(() => dragState.current.moved, [])

  const scrollProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  }

  return { containerRef, scrollProps, wasDragged }
}
