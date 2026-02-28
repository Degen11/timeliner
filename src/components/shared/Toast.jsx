import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars -- motion is used as JSX motion.div
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'

const VARIANT_CONFIG = {
  success: { icon: CheckCircle, iconClass: 'text-green-400', barClass: 'bg-secondary' },
  error: { icon: AlertCircle, iconClass: 'text-red-400', barClass: 'bg-red-400' },
  info: { icon: Info, iconClass: 'text-blue-400', barClass: 'bg-secondary' },
}

export default function Toast() {
  const toast = useTimelineStore((s) => s.toast)
  const clearToast = useTimelineStore((s) => s.clearToast)
  const [key, setKey] = useState(0)

  // Increment key when toast changes to restart the bar animation
  useEffect(() => {
    if (toast) setKey((k) => k + 1)
  }, [toast])

  useEffect(() => {
    if (!toast) return
    const handleKey = (e) => {
      if (e.key === 'Escape') clearToast()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [toast, clearToast])

  const message = typeof toast === 'string' ? toast : toast?.message
  const variant = (typeof toast === 'string' ? 'success' : toast?.variant) || 'success'
  const duration = (typeof toast === 'object' ? toast?.duration : null) || 3000
  const actionLabel = typeof toast === 'object' ? toast?.actionLabel : null
  const onAction = typeof toast === 'object' ? toast?.onAction : null
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.success
  const Icon = config.icon

  const handleAction = () => {
    if (onAction) onAction()
    clearToast()
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            className="pointer-events-auto rounded-xl bg-gray-900 shadow-lg max-w-sm overflow-hidden"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-white">
              <Icon size={16} className={`${config.iconClass} flex-shrink-0`} />
              <span className="flex-1">{message}</span>
              {actionLabel && onAction && (
                <button
                  onClick={handleAction}
                  className="ml-1 rounded-md px-2 py-0.5 text-xs font-semibold text-secondary bg-white/10 hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {actionLabel}
                </button>
              )}
              <button
                onClick={clearToast}
                className="ml-1 rounded-lg p-0.5 hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
            {/* Countdown timer bar */}
            <div className="h-[3px] w-full bg-white/10">
              <motion.div
                key={key}
                className={`h-full ${config.barClass} origin-left`}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
