import { useState, useEffect } from 'react'
import { useSpring, useMotionValueEvent } from 'framer-motion'

export default function AnimatedCount({ value, className = '' }) {
  const [display, setDisplay] = useState(value)
  const spring = useSpring(value, { stiffness: 120, damping: 20 })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useMotionValueEvent(spring, 'change', (v) => {
    setDisplay(Math.round(v))
  })

  return <span className={className}>{display}</span>
}
