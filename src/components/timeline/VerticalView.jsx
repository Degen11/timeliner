import { getEventsByYear } from '@/store/selectors'
import YearGroup from './YearGroup'

export default function VerticalView({ events, editable = false }) {
  const groups = getEventsByYear(events)

  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ year, events }) => (
        <YearGroup key={year} year={year} events={events} editable={editable} />
      ))}
    </div>
  )
}
