import { memo, useState } from 'react'
import { GripVertical } from 'lucide-react'
import EventCard from './EventCard'

const stickyHeaderStyle = { backgroundColor: 'rgba(240, 244, 249, 0.8)' }

const YearGroup = memo(function YearGroup({
  year,
  events,
  editable = false,
  compact = false,
  dragMode = false,
  eventIndices = [],
  onDragStart,
  onDrop,
}) {
  const [dragOver, setDragOver] = useState(null)

  return (
    <div className="relative">
      <div className="sticky top-14 z-10 backdrop-blur-md py-3" style={stickyHeaderStyle}>
        <h2 className="font-display text-xl font-bold text-gray-900">{year}</h2>
      </div>
      <div className="flex flex-col gap-3 pl-5 border-l-2 border-accent/15 ml-3">
        {events.map((event, i) => {
          const globalIdx = eventIndices[i]?.globalIndex ?? i
          return (
            <div
              key={event.id}
              draggable={dragMode}
              onDragStart={dragMode ? (e) => onDragStart?.(e, globalIdx) : undefined}
              onDragOver={
                dragMode
                  ? (e) => {
                      e.preventDefault()
                      setDragOver(i)
                    }
                  : undefined
              }
              onDragLeave={dragMode ? () => setDragOver(null) : undefined}
              onDrop={
                dragMode
                  ? (e) => {
                      setDragOver(null)
                      onDrop?.(e, globalIdx)
                    }
                  : undefined
              }
              className={`relative ${dragMode ? 'cursor-grab active:cursor-grabbing' : ''} ${
                dragOver === i ? 'ring-2 ring-accent/30 rounded-xl' : ''
              }`}
            >
              {dragMode && (
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-gray-300">
                  <GripVertical size={14} />
                </div>
              )}
              <EventCard event={event} editable={editable} compact={compact} />
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default YearGroup
