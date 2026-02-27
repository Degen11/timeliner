import EventCard from './EventCard'

export default function YearGroup({ year, events }) {
  return (
    <div className="relative">
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm py-2">
        <h2 className="text-lg font-semibold text-gray-900">{year}</h2>
      </div>
      <div className="flex flex-col gap-2 pl-4 border-l-2 border-gray-200 ml-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}
