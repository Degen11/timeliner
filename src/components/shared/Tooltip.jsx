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
      let top, left, transform

      if (position === 'top') {
        top = rect.top - gap
        left = rect.left + rect.width / 2
        transform = 'translate(-50%, -100%)'
      } else if (position === 'right') {
        top = rect.top + rect.height / 2
        left = rect.right + gap
        transform = 'translate(0, -50%)'
      } else {
        top = rect.bottom + gap
        left = rect.left + rect.width / 2
        transform = 'translate(-50%, 0)'
      }

      // Clamp so tooltip doesn't overflow edges
      if (position !== 'right') {
        const clampedLeft = Math.min(left, window.innerWidth - 16)
        left = Math.max(16, clampedLeft)
      }

      setCoords({ top, left, transform })
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
      {visible &&
        coords &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[100] pointer-events-none"
            style={{
              top: coords.top,
              left: coords.left,
              transform: coords.transform,
              animation: 'tooltip-in 150ms ease-out',
            }}
          >
            <div
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--color-tooltip-bg)',
                color: 'var(--color-tooltip-text)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span>{label}</span>
              {shortcut && (
                <kbd
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono"
                  style={{ backgroundColor: 'var(--color-tooltip-kbd)' }}
                >
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
