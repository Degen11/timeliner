import EventCard from './EventCard'

export default function YearGroup({ year, events, editable = false, compact = false }) {
  return (
    <div className="relative">
      <div className="sticky top-14 z-10 backdrop-blur-md py-3" style={{ backgroundColor: 'rgba(248, 249, 251, 0.8)' }}>
        <h2 className="font-display text-xl font-bold text-gray-900">{year}</h2>
      </div>
      <div className="flex flex-col gap-3 pl-5 border-l-2 border-accent/15 ml-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} editable={editable} compact={compact} />
        ))}
      </div>
    </div>
  )
}
