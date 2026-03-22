import { useState, useRef, useEffect } from 'react'

const DEFAULT_TIMEOUT = 3000

/**
 * Two-step confirmation pattern: first call arms, second call fires.
 * Automatically disarms after `timeout` ms.
 *
 * Returns { isArmed, arm, confirm, reset }
 * - Typical usage: onClick={() => isArmed ? confirm() : arm()}
 */
export default function useConfirmAction(onConfirm, timeout = DEFAULT_TIMEOUT) {
  const [isArmed, setIsArmed] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const arm = () => {
    setIsArmed(true)
    timerRef.current = setTimeout(() => setIsArmed(false), timeout)
  }

  const confirm = () => {
    clearTimeout(timerRef.current)
    setIsArmed(false)
    onConfirm()
  }

  const reset = () => {
    clearTimeout(timerRef.current)
    setIsArmed(false)
  }

  return { isArmed, arm, confirm, reset }
}
