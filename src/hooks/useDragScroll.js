import { useRef, useState, useEffect } from 'react'

const MOMENTUM_FRICTION = 0.95
const MOMENTUM_MIN_VELOCITY = 0.5

/**
 * Hook that provides drag-to-scroll behavior for a scrollable container.
 * Supports both mouse and touch (via pointer events). Returns props to
 * spread on the scroll container and a `wasDragged()` check to distinguish
 * clicks from drags. Applies momentum/inertia on release for fluid feel.
 *
 * @param {Object} [options]
 * @param {(e: PointerEvent) => boolean} [options.shouldIgnore] — return true to skip drag (e.g. when clicking a card)
 * @returns {{ containerRef, scrollProps, wasDragged }}
 */
export default function useDragScroll({ shouldIgnore } = {}) {
  const containerRef = useRef(null)
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false })
  const velocityState = useRef({ lastX: 0, lastTime: 0, velocity: 0 })
  const momentumRaf = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const stopMomentum = () => {
    if (momentumRaf.current) {
      cancelAnimationFrame(momentumRaf.current)
      momentumRaf.current = null
    }
  }

  const onPointerDown = (e) => {
    if (shouldIgnore?.(e)) return
    const el = containerRef.current
    if (!el) return
    stopMomentum()
    dragState.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    }
    velocityState.current = { lastX: e.clientX, lastTime: performance.now(), velocity: 0 }
    el.setPointerCapture(e.pointerId)
    setIsDragging(true)
  }

  const onPointerMove = (e) => {
    const state = dragState.current
    if (!state.active) return
    const el = containerRef.current
    if (!el) return
    e.preventDefault()
    const walk = e.clientX - state.startX
    if (Math.abs(walk) > 4) state.moved = true
    el.scrollLeft = state.scrollLeft - walk

    // Track velocity from recent movement
    const now = performance.now()
    const dt = now - velocityState.current.lastTime
    if (dt > 0) {
      velocityState.current.velocity = (velocityState.current.lastX - e.clientX) / dt
      velocityState.current.lastX = e.clientX
      velocityState.current.lastTime = now
    }
  }

  const applyMomentum = () => {
    const el = containerRef.current
    if (!el) return
    const v = velocityState.current
    if (Math.abs(v.velocity) < MOMENTUM_MIN_VELOCITY) {
      velocityState.current.velocity = 0
      return
    }

    const tick = () => {
      v.velocity *= MOMENTUM_FRICTION
      if (Math.abs(v.velocity) < MOMENTUM_MIN_VELOCITY) {
        momentumRaf.current = null
        return
      }
      el.scrollLeft += v.velocity
      momentumRaf.current = requestAnimationFrame(tick)
    }
    // Scale velocity from px/ms to px/frame (~16ms)
    v.velocity *= 16
    momentumRaf.current = requestAnimationFrame(tick)
  }

  const onPointerUp = (e) => {
    if (!dragState.current.active) return
    dragState.current.active = false
    containerRef.current?.releasePointerCapture(e.pointerId)
    setIsDragging(false)
    applyMomentum()
  }

  // Cancel any in-flight momentum animation if the component unmounts mid-inertia.
  useEffect(() => () => {
    if (momentumRaf.current) cancelAnimationFrame(momentumRaf.current)
  }, [])

  const wasDragged = () => dragState.current.moved

  const scrollProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  }

  return { containerRef, scrollProps, wasDragged, isDragging }
}
