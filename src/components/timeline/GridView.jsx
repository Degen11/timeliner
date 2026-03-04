import { memo, useMemo } from 'react'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import EventCard from './EventCard'

const GridView = memo(function GridView({ events, editable = false, groupZoom = 'year' }) {
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
            {groupEvents.map((event) => (
              <div key={event.id}>
                <EventCard event={event} editable={editable} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})

export default GridView
