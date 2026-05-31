import { motion } from 'framer-motion'
import { Sparkles, Calendar, Users } from 'lucide-react'
import { safeGetUTCYear } from '@/utils/dateUtils'

/**
 * Animated banner shown when a timeline first receives events.
 */
export default function WelcomeBanner({ events }) {
  const allPeople = [...new Set(events.flatMap((e) => e.people || []))]
  const years = events
    .map((e) => {
      if (!e.dateStart) return null
      // Use the timezone-safe parser; raw new Date() can yield NaN/off-by-one
      // years for partial (YYYY / YYYY-MM) strings.
      const y = safeGetUTCYear(e.dateStart, null)
      return typeof y === 'number' ? y : null
    })
    .filter((y) => y != null)
  const yearSpan = years.length >= 2 ? Math.max(...years) - Math.min(...years) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-secondary/5 via-blue-50/50 to-sky-50/30 border border-secondary/15 px-4 py-4 sm:px-6 sm:py-5 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
          <Sparkles size={18} className="text-secondary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-text-strong text-base">Timeline created</h3>
          <p className="text-sm text-text-muted">Your story is ready to explore</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 sm:gap-6 text-sm">
        <span className="flex items-center gap-1.5 text-text-default">
          <Calendar size={14} className="text-secondary/70" />
          <span className="font-semibold">{events.length}</span> events
        </span>
        {allPeople.length > 0 && (
          <span className="flex items-center gap-1.5 text-text-default">
            <Users size={14} className="text-secondary/70" />
            <span className="font-semibold">{allPeople.length}</span> {allPeople.length === 1 ? 'person' : 'people'}
          </span>
        )}
        {yearSpan > 0 && (
          <span className="flex items-center gap-1.5 text-text-default">
            <Calendar size={14} className="text-secondary/70" />
            spanning <span className="font-semibold">{yearSpan}</span> years
          </span>
        )}
      </div>
    </motion.div>
  )
}
