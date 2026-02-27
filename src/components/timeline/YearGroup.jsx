import EventCard from './EventCard'

export default function YearGroup({ year, events }) {
  return (
    <div className="relative">
      <div className="sticky top-14 z-10 bg-white/90 backdrop-blur-sm py-3">
        <h2 className="font-display text-xl font-bold text-gray-900">{year}</h2>
      </div>
      <div className="flex flex-col gap-3 pl-5 border-l-2 border-accent/15 ml-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
