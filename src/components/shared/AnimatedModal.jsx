import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { pushModal, popModal } from '@/utils/modalStack'
import { SPRING } from '@/utils/constants'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 12 },
}

// Bottom sheet variant for mobile
const sheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0 },
  exit: { y: '100%' },
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export default function AnimatedModal({ open, onClose, children, className = '' }) {
  const contentRef = useRef(null)
  const [layer, setLayer] = useState(null)
  const isMobile = useIsMobile()

  // Register/unregister with modal stack for z-index coordination
  useEffect(() => {
    if (!open) {
      if (layer) {
        popModal(layer.id)
        setLayer(null)
      }
      return
    }
    const entry = pushModal()
    setLayer(entry)
    return () => popModal(entry.id)
  }, [open])

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Move focus into modal on open
  useEffect(() => {
    if (!open || !contentRef.current) return
    const firstFocusable = contentRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()
  }, [open])

  const zIndex = layer?.zIndex ?? 50

  // Portal to document.body so the modal escapes any parent stacking
  // contexts (sidebar sticky, horizontal view overflow, etc.)
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 ${isMobile ? 'flex items-end' : 'flex items-center justify-center'}`}
          style={{ zIndex }}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="absolute inset-0 bg-black/40"
            variants={backdropVariants}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={contentRef}
            className={`relative ${isMobile ? `w-full bottom-sheet safe-area-bottom ${className}` : className}`}
            variants={isMobile ? sheetVariants : modalVariants}
            transition={isMobile ? { type: 'spring', duration: 0.4, bounce: 0.08 } : SPRING.GENTLE}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle for mobile bottom sheet */}
            {isMobile && (
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
