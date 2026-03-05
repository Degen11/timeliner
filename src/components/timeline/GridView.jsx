import { memo, useMemo } from 'react'
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
                <div
                  key={event.id}
                  className={`timeline-card-enter ${isSelected ? 'ring-2 ring-secondary/50 rounded-xl' : ''}`}
                  style={{ animationDelay: `${i * 40}ms` }}
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
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
})

export default GridView
