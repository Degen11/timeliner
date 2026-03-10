import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pushModal, popModal } from '@/utils/modalStack'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.2 },
}

const panelVariants = {
  hidden: { x: '100%' },
  visible: { x: 0 },
  exit: { x: '100%' },
}

export default function AnimatedSidePanel({ open, onClose, children, wide = false }) {
  const [layer, setLayer] = useState(null)

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

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const zIndex = layer?.zIndex ?? 30

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black"
            style={{ zIndex }}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed inset-y-0 right-0 w-full bg-gray-50 border-l border-gray-200 shadow-lg flex flex-col ${
              wide ? 'max-w-lg' : 'max-w-sm'
            }`}
            style={{ zIndex: zIndex + 1 }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
