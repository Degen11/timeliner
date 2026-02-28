import { memo, useMemo } from 'react'
import { getEventsByYear } from '@/store/selectors'
import YearGroup from './YearGroup'

const VerticalView = memo(function VerticalView({ events, editable = false, compact = false }) {
  const groups = useMemo(() => getEventsByYear(events), [events])

  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ year, events: yearEvents }) => (
        <YearGroup
          key={year}
          year={year}
          events={yearEvents}
          editable={editable}
          compact={compact}
        />
      ))}
    </div>
  )
})

export default VerticalView
