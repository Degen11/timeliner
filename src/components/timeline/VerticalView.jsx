import { useState, memo, useMemo } from 'react'
import { AlignJustify, AlignLeft } from 'lucide-react'
import { getEventsByYear } from '@/store/selectors'
import YearGroup from './YearGroup'

const VerticalView = memo(function VerticalView({ events, editable = false, dragMode = false, onDragStart, onDrop }) {
  const [compact, setCompact] = useState(false)
  const groups = useMemo(() => getEventsByYear(events), [events])

  // Build a flat index map for drag-to-reorder across year groups
  const groupsWithIndex = useMemo(() => {
    let flatIndex = 0
    return groups.map(({ year, events: yearEvents }) => {
      const withIdx = yearEvents.map((e) => ({ event: e, globalIndex: flatIndex++ }))
      return { year, events: yearEvents, withIdx }
    })
  }, [groups])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          onClick={() => setCompact(!compact)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer border ${
            compact
              ? 'bg-accent-light text-accent border-accent/20'
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-700'
          }`}
          title={compact ? 'Switch to expanded view' : 'Switch to compact view'}
        >
          {compact ? <AlignLeft size={13} /> : <AlignJustify size={13} />}
          {compact ? 'Compact' : 'Expanded'}
        </button>
      </div>

      <div className="flex flex-col gap-8">
        {groupsWithIndex.map(({ year, events: yearEvents, withIdx }) => (
          <YearGroup
            key={year}
            year={year}
            events={yearEvents}
            editable={editable}
            compact={compact}
            dragMode={dragMode}
            eventIndices={withIdx}
            onDragStart={onDragStart}
            onDrop={onDrop}
          />
        ))}
      </div>
    </div>
  )
})

export default VerticalView
