import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Drawer } from 'vaul'
import { pushModal, popModal } from '@/utils/modalStack'
import { SPRING } from '@/utils/constants'
import useIsMobile from '@/hooks/useIsMobile'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 12 },
}

function DesktopModal({ open, onClose, children, className = '', label }) {
  const contentRef = useRef(null)
  const [layer, setLayer] = useState(null)

  useEffect(() => {
    if (!open) return
    const entry = pushModal()
    setLayer(entry)
    return () => {
      popModal(entry.id)
      setLayer(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open || !contentRef.current) return
    const triggerEl = document.activeElement
    const firstFocusable = contentRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()
    return () => {
      // Restore focus to the element that opened the modal for keyboard users
      if (triggerEl instanceof HTMLElement && document.contains(triggerEl)) {
        triggerEl.focus()
      }
    }
  }, [open])

  const zIndex = layer?.zIndex ?? 50

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex }}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <motion.div
            className="absolute inset-0 bg-black/40"
            variants={backdropVariants}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={contentRef}
            className={`relative ${className}`}
            variants={modalVariants}
            transition={SPRING.GENTLE}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function MobileDrawer({ open, onClose, children, className = '' }) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content
          className={`fixed inset-x-0 bottom-0 z-50 flex flex-col bottom-sheet safe-area-bottom ${className}`}
        >
          <div className="flex justify-center pt-2 pb-1">
            <Drawer.Handle className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export default function AnimatedModal({ open, onClose, children, className = '', label }) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <MobileDrawer open={open} onClose={onClose} className={className}>
        {children}
      </MobileDrawer>
    )
  }

  return (
    <DesktopModal open={open} onClose={onClose} className={className} label={label}>
      {children}
    </DesktopModal>
  )
}
