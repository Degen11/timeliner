import { useMemo, useRef, useState, useCallback } from 'react'
import { parseISO, getYear } from 'date-fns'
import EventCard from './EventCard'

const YEAR_WIDTH = 200
const EVENT_HEIGHT = 80
const PADDING = 40

export default function HorizontalView({ events }) {
  const containerRef = useRef(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, scrollLeft: 0 })

  const { sorted, minYear, maxYear, totalWidth } = useMemo(() => {
    if (events.length === 0) return { sorted: [], minYear: 2000, maxYear: 2000, totalWidth: 400 }

    const sorted = [...events].sort(
      (a, b) => new Date(a.dateStart) - new Date(b.dateStart)
    )
    const years = sorted.map((e) =>
      e.dateStart ? getYear(parseISO(e.dateStart)) : 2000
    )
    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)
    const totalWidth = (maxYear - minYear + 2) * YEAR_WIDTH + PADDING * 2

    return { sorted, minYear, maxYear, totalWidth }
  }, [events])

  const getX = useCallback(
    (event) => {
      if (!event.dateStart) return PADDING
      const date = parseISO(event.dateStart)
      const year = getYear(date)
      const month = date.getMonth()
      return PADDING + (year - minYear) * YEAR_WIDTH + (month / 12) * YEAR_WIDTH
    },
    [minYear]
  )

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true)
    dragRef.current.startX = e.pageX - containerRef.current.offsetLeft
    dragRef.current.scrollLeft = containerRef.current.scrollLeft
  }, [])

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return
      e.preventDefault()
      const x = e.pageX - containerRef.current.offsetLeft
      const walk = x - dragRef.current.startX
      containerRef.current.scrollLeft = dragRef.current.scrollLeft - walk
    },
    [isDragging]
  )

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  const yearMarkers = []
  for (let y = minYear; y <= maxYear + 1; y++) {
    yearMarkers.push(y)
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={containerRef}
        className="overflow-x-auto cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width={totalWidth}
          height={events.length * EVENT_HEIGHT + 120}
          className="select-none"
        >
          {/* Year markers */}
          {yearMarkers.map((year) => {
            const x = PADDING + (year - minYear) * YEAR_WIDTH
            return (
              <g key={year}>
                <line
                  x1={x}
                  y1={40}
                  x2={x}
                  y2={events.length * EVENT_HEIGHT + 80}
                  stroke="#E4E4E7"
                  strokeDasharray="4 4"
                />
                <text
                  x={x}
                  y={28}
                  className="fill-gray-500 text-xs"
                  textAnchor="middle"
                >
                  {year}
                </text>
              </g>
            )
          })}

          {/* Timeline axis */}
          <line
            x1={PADDING}
            y1={60}
            x2={totalWidth - PADDING}
            y2={60}
            stroke="#D4D4D8"
            strokeWidth={2}
          />

          {/* Events */}
          {sorted.map((event, i) => {
            const x = getX(event)
            const y = 80 + i * EVENT_HEIGHT
            const isSelected = selectedEvent?.id === event.id

            return (
              <g
                key={event.id}
                onClick={() => setSelectedEvent(isSelected ? null : event)}
                className="cursor-pointer"
              >
                {/* Connector line */}
                <line x1={x} y1={60} x2={x} y2={y} stroke="#D4D4D8" />

                {/* Dot on axis */}
                <circle
                  cx={x}
                  cy={60}
                  r={4}
                  className={isSelected ? 'fill-accent' : 'fill-gray-400'}
                />

                {/* Event label */}
                <rect
                  x={x - 4}
                  y={y - 10}
                  width={160}
                  height={28}
                  rx={4}
                  className={
                    isSelected
                      ? 'fill-accent-light stroke-accent'
                      : 'fill-white stroke-gray-200'
                  }
                  strokeWidth={1}
                />
                <text
                  x={x + 4}
                  y={y + 6}
                  className="fill-gray-900 text-xs font-medium"
                >
                  {event.title.length > 22
                    ? event.title.slice(0, 22) + '…'
                    : event.title}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {selectedEvent && (
        <div className="max-w-md">
          <EventCard event={selectedEvent} />
        </div>
      )}
    </div>
  )
}
