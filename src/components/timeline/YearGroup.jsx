import { memo } from 'react'
import EventCard from './EventCard'

const stickyHeaderStyle = { backgroundColor: 'rgba(248, 250, 252, 0.8)' }

const YearGroup = memo(function YearGroup({ year, events, editable = false, compact = false }) {
  return (
    <div className="relative">
      {/* top-14 = header height (3.5rem) */}
      <div
        className={`sticky top-14 z-10 backdrop-blur-md ${compact ? 'py-1' : 'py-2'}`}
        style={stickyHeaderStyle}
      >
        <h2 className={`font-display font-bold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
          {year}
        </h2>
      </div>
      <div
        className={`flex flex-col pl-5 border-l-2 border-gray-200 ml-3 ${compact ? 'gap-2' : 'gap-4'}`}
      >
        {events.map((event) => (
          <div key={event.id} className="relative">
            {/* Dot marker on the timeline */}
            <div
              className="absolute -left-[27px] top-4 w-2.5 h-2.5 rounded-full bg-secondary ring-2 ring-white"
              aria-hidden="true"
            />
            <EventCard event={event} editable={editable} compact={compact} />
          </div>
        ))}
      </div>
    </div>
  )
})

export default YearGroup
