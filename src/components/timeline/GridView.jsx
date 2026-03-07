import { memo, useMemo } from 'react'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import EventCard from './EventCard'

const stickyHeaderStyle = { backgroundColor: 'var(--color-canvas)' }

const GridView = memo(function GridView({
  events,
  editable = false,
  groupZoom = 'year',
  selectedEventIds,
  onToggleSelect,
  onEditEvent,
}) {
  const groups = useMemo(
    () => (groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events)),
    [events, groupZoom]
  )

  return (
    <div className="space-y-0">
      {groups.map(({ year, events: groupEvents }) => (
        <div key={year} className="pb-2">
          <div
            className="sticky top-14 z-10 -mx-4 px-4 py-2.5 mb-4"
            style={stickyHeaderStyle}
          >
            <div className="flex items-center gap-3">
              <h2 className="font-display font-bold text-text-strong text-lg">{year}</h2>
              <span className="text-[11px] font-medium text-text-muted tabular-nums shrink-0">
                {groupEvents.length} {groupEvents.length === 1 ? 'event' : 'events'}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-200/50 to-transparent" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupEvents.map((event, i) => {
              const isSelected = selectedEventIds?.includes(event.id)
              return (
                <div
                  key={event.id}
                  className={`timeline-card-enter transition-all duration-200 ${isSelected ? 'ring-2 ring-secondary/50 rounded-xl' : ''}`}
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
                  <EventCard event={event} editable={editable} isSelected={isSelected} onEdit={onEditEvent} />
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
