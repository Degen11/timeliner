import { motion } from 'framer-motion'
import { EASE_OUT } from '@/utils/constants'

const staggerItem = (delay) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT, delay } },
})

export default function EmptyState({ icon: Icon, title, description, children, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <motion.div
          className="mb-5 rounded-xl bg-gray-100 dark:bg-white/5 p-4"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <Icon size={32} className="text-gray-400 dark:text-gray-500" />
        </motion.div>
      )}
      <motion.h3
        className="font-display text-base font-semibold text-gray-900 dark:text-gray-100 mb-1"
        {...staggerItem(0.08)}
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p
          className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed"
          {...staggerItem(0.14)}
        >
          {description}
        </motion.p>
      )}
      {hint && (
        <motion.p
          className="text-xs text-gray-400 dark:text-gray-500 mt-2 max-w-sm"
          {...staggerItem(0.18)}
        >
          {hint}
        </motion.p>
      )}
      {children && (
        <motion.div className="mt-5" {...staggerItem(0.22)}>
          {children}
        </motion.div>
      )}
    </div>
  )
}
