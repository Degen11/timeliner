import { memo, useMemo } from 'react'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import YearGroup from './YearGroup'

const VerticalView = memo(function VerticalView({ events, editable = false, compact = false, groupZoom = 'year' }) {
  const groups = useMemo(
    () => groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events),
    [events, groupZoom]
  )

  return (
    <div className={`flex flex-col ${compact ? 'gap-3' : 'gap-8'}`}>
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
