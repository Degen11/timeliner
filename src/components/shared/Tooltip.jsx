import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export default function Tooltip({ children, label, shortcut, position = 'bottom' }) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState(null)
  const triggerRef = useRef(null)
  const timeoutRef = useRef(null)

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const gap = 6
      let top, left
      if (position === 'top') {
        top = rect.top - gap
        left = rect.left + rect.width / 2
      } else {
        top = rect.bottom + gap
        left = rect.left + rect.width / 2
      }
      // Clamp so tooltip doesn't overflow right edge
      const clampedLeft = Math.min(left, window.innerWidth - 16)
      setCoords({ top, left: Math.max(16, clampedLeft) })
      setVisible(true)
    }, 400)
  }, [position])

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setVisible(false)
    setCoords(null)
  }, [])

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  if (!label) return children

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </span>
      {visible && coords && createPortal(
        <div
          role="tooltip"
          className="fixed z-[100] pointer-events-none"
          style={{
            top: coords.top,
            left: coords.left,
            transform: position === 'top'
              ? 'translate(-50%, -100%)'
              : 'translate(-50%, 0)',
            animation: 'tooltip-in 150ms ease-out',
          }}
        >
          <div className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap">
            <span>{label}</span>
            {shortcut && (
              <kbd className="inline-flex items-center rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-mono">
                {shortcut}
              </kbd>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
