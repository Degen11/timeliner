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
      <div className={`sticky top-14 z-10 backdrop-blur-md ${compact ? 'py-1' : 'py-2'}`} style={stickyHeaderStyle}>
        <h2 className={`font-display font-bold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>{year}</h2>
      </div>
      <div className={`flex flex-col pl-5 border-l-2 border-primary/20 ml-3 ${compact ? 'gap-1' : 'gap-2.5'}`}>
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
