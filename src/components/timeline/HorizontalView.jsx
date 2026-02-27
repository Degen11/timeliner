import { useMemo, useRef, useState, useCallback } from 'react'
import { parseISO, getYear } from 'date-fns'
import { X } from 'lucide-react'
import EventCard from './EventCard'

const YEAR_WIDTH = 200
const AXIS_Y = 60
const DOT_RADIUS = 5
const LABEL_HEIGHT = 28
const PADDING = 40

export default function HorizontalView({ events, editable = false }) {
  const containerRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, scrollLeft: 0, moved: false })

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

  // Drag-to-scroll (distinguish drag from click)
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true)
    dragRef.current.startX = e.pageX - containerRef.current.offsetLeft
    dragRef.current.scrollLeft = containerRef.current.scrollLeft
    dragRef.current.moved = false
  }, [])

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return
      e.preventDefault()
      const x = e.pageX - containerRef.current.offsetLeft
      const walk = x - dragRef.current.startX
      if (Math.abs(walk) > 4) dragRef.current.moved = true
      containerRef.current.scrollLeft = dragRef.current.scrollLeft - walk
    },
    [isDragging]
  )

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  const handleEventClick = useCallback((eventId) => {
    if (dragRef.current.moved) return
    setSelectedId((prev) => (prev === eventId ? null : eventId))
  }, [])

  const yearMarkers = []
  for (let y = minYear; y <= maxYear + 1; y++) {
    yearMarkers.push(y)
  }

  // Compute positions for each event
  const eventPositions = useMemo(() => {
    return sorted.map((event, i) => ({
      event,
      x: getX(event),
      row: i,
    }))
  }, [sorted, getX])

  const selectedEvent = sorted.find((e) => e.id === selectedId)
  const selectedX = selectedEvent ? getX(selectedEvent) : 0

  const svgHeight = events.length * 80 + 120

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto cursor-grab active:cursor-grabbing relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="relative" style={{ width: totalWidth, minHeight: svgHeight }}>
        <svg
          width={totalWidth}
          height={svgHeight}
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
                  y2={svgHeight - 40}
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
            y1={AXIS_Y}
            x2={totalWidth - PADDING}
            y2={AXIS_Y}
            stroke="#D4D4D8"
            strokeWidth={2}
          />

          {/* Events */}
          {eventPositions.map(({ event, x, row }) => {
            const y = 80 + row * 80
            const isSelected = selectedId === event.id

            return (
              <g
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="cursor-pointer"
              >
                {/* Connector line */}
                <line x1={x} y1={AXIS_Y} x2={x} y2={y} stroke={isSelected ? '#1E3A5F' : '#D4D4D8'} />

                {/* Dot on axis */}
                <circle
                  cx={x}
                  cy={AXIS_Y}
                  r={isSelected ? DOT_RADIUS + 2 : DOT_RADIUS}
                  className={isSelected ? 'fill-accent' : 'fill-gray-400 hover:fill-accent/60'}
                  style={{ transition: 'r 0.15s, fill 0.15s' }}
                />

                {/* Event label */}
                <rect
                  x={x - 4}
                  y={y - 10}
                  width={160}
                  height={LABEL_HEIGHT}
                  rx={4}
                  className={
                    isSelected
                      ? 'fill-accent-light stroke-accent'
                      : 'fill-white stroke-gray-200 hover:stroke-gray-300'
                  }
                  strokeWidth={1}
                />
                <text
                  x={x + 4}
                  y={y + 6}
                  className="fill-gray-900 text-xs font-medium pointer-events-none"
                >
                  {event.title.length > 22
                    ? event.title.slice(0, 22) + '…'
                    : event.title}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Inline detail card — positioned on the timeline */}
        {selectedEvent && (
          <div
            className="absolute z-20 w-80 animate-fade-in"
            style={{
              left: Math.max(8, Math.min(selectedX - 140, totalWidth - 330)),
              top: AXIS_Y + 16,
            }}
          >
            <div className="relative">
              {/* Arrow pointing up */}
              <div
                className="absolute -top-2 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45"
                style={{ left: Math.min(Math.max(selectedX - Math.max(8, Math.min(selectedX - 140, totalWidth - 330)) + -2, 16), 296) }}
              />
              <div className="relative">
                <EventCard event={selectedEvent} editable={editable} />
                <button
                  onClick={() => setSelectedId(null)}
                  className="absolute top-2 right-2 rounded-full bg-gray-100 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer z-10"
                  aria-label="Close"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
