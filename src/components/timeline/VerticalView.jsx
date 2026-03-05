import { memo, useMemo } from 'react'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import YearGroup from './YearGroup'

const VerticalView = memo(function VerticalView({
  events,
  editable = false,
  compact = false,
  groupZoom = 'year',
  selectedEventIds,
  onToggleSelect,
}) {
  const groups = useMemo(
    () => (groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events)),
    [events, groupZoom]
  )

  return (
    <div className={`flex flex-col ${compact ? 'gap-4' : 'gap-10'}`}>
      {groups.map(({ year, events: yearEvents }) => (
        <YearGroup
          key={year}
          year={year}
          events={yearEvents}
          editable={editable}
          compact={compact}
          selectedEventIds={selectedEventIds}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  )
})

export default VerticalView
