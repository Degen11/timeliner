import { memo } from 'react'
import EventCard from './EventCard'

const GridView = memo(function GridView({ events, editable = false }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {events.map((event) => (
        <div key={event.id}>
          <EventCard event={event} editable={editable} />
        </div>
      ))}
    </div>
  )
})

export default GridView
