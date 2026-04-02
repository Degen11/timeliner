import { useEffect, useRef, useState } from 'react'

/**
 * Returns a ref and a boolean `revealed` that turns true once the element
 * enters the viewport. Triggers only once (not reversible).
 *
 * @param {{ threshold?: number, rootMargin?: string }} options
 */
export default function useScrollReveal({ threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = {}) {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.unobserve(el)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return { ref, revealed }
}
