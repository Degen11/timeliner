import { useEffect, useRef } from 'react'

/**
 * Calls `handler` when a mousedown occurs outside the element referenced by `ref`.
 * The listener is only active when `active` is true (defaults to true).
 *
 * Uses a ref for the handler to avoid re-registering the DOM listener
 * when callers pass an inline function.
 */
export default function useClickOutside(ref, handler, active = true) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!active) return
    const listener = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handlerRef.current(e)
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, active])
}
