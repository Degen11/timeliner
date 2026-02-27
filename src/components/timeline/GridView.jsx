import { useState, memo } from 'react'
import { GripVertical } from 'lucide-react'
import EventCard from './EventCard'

const GridView = memo(function GridView({ events, editable = false, dragMode = false, onDragStart, onDrop }) {
  const [dragOver, setDragOver] = useState(null)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {events.map((event, i) => (
        <div
          key={event.id}
          draggable={dragMode}
          onDragStart={dragMode ? (e) => onDragStart?.(e, i) : undefined}
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
                  onDrop?.(e, i)
                }
              : undefined
          }
          className={`relative ${dragMode ? 'cursor-grab active:cursor-grabbing' : ''} ${
            dragOver === i ? 'ring-2 ring-accent/30 rounded-xl' : ''
          }`}
        >
          {dragMode && (
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-gray-300 z-10">
              <GripVertical size={14} />
            </div>
          )}
          <EventCard event={event} editable={editable} />
        </div>
      ))}
    </div>
  )
})

export default GridView
