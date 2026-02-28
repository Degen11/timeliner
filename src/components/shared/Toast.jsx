import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars -- motion is used as JSX motion.div
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'

const VARIANT_CONFIG = {
  success: { icon: CheckCircle, iconClass: 'text-green-400' },
  error: { icon: AlertCircle, iconClass: 'text-red-400' },
  info: { icon: Info, iconClass: 'text-blue-400' },
}

export default function Toast() {
  const toast = useTimelineStore((s) => s.toast)
  const clearToast = useTimelineStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return
    const handleKey = (e) => {
      if (e.key === 'Escape') clearToast()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [toast, clearToast])

  // Support both string and { message, variant } toast shapes
  const message = typeof toast === 'string' ? toast : toast?.message
  const variant = (typeof toast === 'string' ? 'success' : toast?.variant) || 'success'
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.success
  const Icon = config.icon

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            className="pointer-events-auto flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg max-w-sm"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
          >
            <Icon size={16} className={`${config.iconClass} flex-shrink-0`} />
            <span>{message}</span>
            <button
              onClick={clearToast}
              className="ml-1 rounded-lg p-0.5 hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
