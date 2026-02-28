import { memo } from 'react'
import EventCard from './EventCard'

const stickyHeaderStyle = { backgroundColor: 'rgba(248, 250, 252, 0.8)' }

const YearGroup = memo(function YearGroup({
  year,
  events,
  editable = false,
  compact = false,
}) {
  return (
    <div className="relative">
      {/* top-14 = header height (3.5rem) */}
      <div className="sticky top-14 z-10 backdrop-blur-md py-2" style={stickyHeaderStyle}>
        <h2 className="font-display text-lg font-bold text-gray-900">{year}</h2>
      </div>
      <div className="flex flex-col gap-2.5 pl-5 border-l-2 border-primary/20 ml-3">
        {events.map((event) => (
          <div key={event.id}>
            <EventCard event={event} editable={editable} compact={compact} />
          </div>
        ))}
      </div>
    </div>
  )
})

export default YearGroup
