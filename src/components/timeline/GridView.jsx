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
    <div className="space-y-6">
      {groups.map(({ year, events: groupEvents }) => (
        <div key={year}>
          <h2 className="font-display font-bold text-gray-900 text-base mb-4">{year}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupEvents.map((event) => {
              const isSelected = selectedEventIds?.includes(event.id)
              return (
                <div
                  key={event.id}
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
