import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars -- motion is used as JSX motion.div

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
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-30 bg-black"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed inset-y-0 right-0 z-40 w-full bg-gray-50 border-l border-gray-200 shadow-lg flex flex-col ${
              wide ? 'max-w-lg' : 'max-w-sm'
            }`}
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
