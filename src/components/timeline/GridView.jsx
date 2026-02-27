import { useMemo } from 'react'
import EventCard from './EventCard'

export default function GridView({ events, editable = false }) {
  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.dateStart) - new Date(b.dateStart)
      ),
    [events]
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sorted.map((event) => (
        <EventCard key={event.id} event={event} editable={editable} />
      ))}
    </div>
  )
}
