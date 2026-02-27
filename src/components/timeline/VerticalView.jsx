import { getEventsByYear } from '@/store/selectors'
import YearGroup from './YearGroup'

export default function VerticalView({ events }) {
  const groups = getEventsByYear(events)

  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ year, events }) => (
        <YearGroup key={year} year={year} events={events} />
      ))}
    </div>
  )
}
