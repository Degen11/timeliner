import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import EventCard from './EventCard'

const GridView = memo(function GridView({
  events,
  editable = false,
  groupZoom = 'year',
  selectedEventIds,
  onToggleSelect,
}) {
  const groups = useMemo(
    () => (groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events)),
    [events, groupZoom]
  )

  return (
    <div className="space-y-10">
      {groups.map(({ year, events: groupEvents }) => (
        <div key={year}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display font-bold text-text-strong text-lg">{year}</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-secondary/20 via-gray-200 to-transparent" />
            <span className="text-xs font-medium text-text-muted tabular-nums">
              {groupEvents.length} {groupEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupEvents.map((event, i) => {
              const isSelected = selectedEventIds?.includes(event.id)
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className={`${isSelected ? 'ring-2 ring-secondary/50 rounded-xl' : ''}`}
                  onClick={
                    onToggleSelect
                      ? (e) => {
                          if (e.shiftKey || e.metaKey || e.ctrlKey) {
                            e.preventDefault()
                            onToggleSelect(event.id, e)
                          }
                        }
                      : undefined
                  }
                >
                  <EventCard event={event} editable={editable} isSelected={isSelected} />
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
})

export default GridView
