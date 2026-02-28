import { useMemo, useRef, useState, useCallback, useEffect, memo } from 'react'
import EventCard from './EventCard'
import { safeDateCompare, safeGetUTCYear, safeGetUTCMonth, safeParse } from '@/utils/dateUtils'

const YEAR_WIDTH = 200
const AXIS_Y = 260
const DOT_RADIUS = 5
const LABEL_HEIGHT = 28
const LABEL_WIDTH = 160
const PADDING = 60
const ROW_SPACING = 36

const HorizontalView = memo(function HorizontalView({ events, editable = false }) {
  const containerRef = useRef(null)
  const cardRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, scrollLeft: 0, moved: false })

  const { sorted, minYear, maxYear, totalWidth } = useMemo(() => {
    if (events.length === 0) return { sorted: [], minYear: 2000, maxYear: 2000, totalWidth: 400 }

    const sorted = [...events].sort(
      (a, b) => safeDateCompare(a.dateStart, b.dateStart)
    )
    const years = sorted.map((e) =>
      safeGetUTCYear(e.dateStart, 2000)
    )
    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)
    const totalWidth = Math.max((maxYear - minYear + 2) * YEAR_WIDTH + PADDING * 2, 600)

    return { sorted, minYear, maxYear, totalWidth }
  }, [events])

  const getX = useCallback(
    (event) => {
      if (!event.dateStart) return PADDING
      const year = safeGetUTCYear(event.dateStart, minYear)
      const month = safeGetUTCMonth(event.dateStart)
      return PADDING + (year - minYear) * YEAR_WIDTH + (month / 12) * YEAR_WIDTH
    },
    [minYear]
  )

  // Drag-to-scroll
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

  // Close on outside click or Escape
  useEffect(() => {
    if (!selectedId) return

    const handleClickOutside = (e) => {
      // Ignore clicks inside portal-rendered popovers (e.g. DatePicker calendar)
      if (e.target.closest('[data-datepicker-popover]')) return
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setSelectedId(null)
      }
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSelectedId(null)
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [selectedId])

  const yearMarkers = []
  for (let y = minYear; y <= maxYear + 1; y++) {
    yearMarkers.push(y)
  }

  // Assign events to lanes alternating above/below the axis.
  // Within each side, stack further out if labels would overlap on x.
  const eventPositions = useMemo(() => {
    const aboveLanes = [] // each lane is the max-right-edge x of labels in that lane
    const belowLanes = []

    return sorted.map((event, i) => {
      const x = getX(event)
      const isAbove = i % 2 === 0
      const lanes = isAbove ? aboveLanes : belowLanes

      // Find the first lane where this label doesn't overlap
      let lane = 0
      for (lane = 0; lane < lanes.length; lane++) {
        if (x - 8 > lanes[lane]) break
      }
      if (lane === lanes.length) lanes.push(0)
      lanes[lane] = x + LABEL_WIDTH + 8

      const distance = (lane + 1) * (LABEL_HEIGHT + ROW_SPACING)
      const labelY = isAbove ? AXIS_Y - distance : AXIS_Y + distance - LABEL_HEIGHT

      return { event, x, labelY, isAbove }
    })
  }, [sorted, getX])

  // Compute SVG height based on max extent above and below
  const svgHeight = useMemo(() => {
    let maxAbove = 0
    let maxBelow = 0
    for (const { labelY, isAbove } of eventPositions) {
      if (isAbove) {
        maxAbove = Math.max(maxAbove, AXIS_Y - labelY + LABEL_HEIGHT + 20)
      } else {
        maxBelow = Math.max(maxBelow, labelY + LABEL_HEIGHT - AXIS_Y + 20)
      }
    }
    return Math.max(AXIS_Y + maxBelow + 60, maxAbove + AXIS_Y + 60, 400)
  }, [eventPositions])

  const { selectedEvent, selectedX, selectedPos } = useMemo(() => {
    if (!selectedId) return { selectedEvent: null, selectedX: 0, selectedPos: null }
    const selectedEvent = sorted.find((e) => e.id === selectedId)
    const selectedX = selectedEvent ? getX(selectedEvent) : 0
    const selectedPos = eventPositions.find((p) => p.event.id === selectedId)
    return { selectedEvent, selectedX, selectedPos }
  }, [selectedId, sorted, getX, eventPositions])

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto cursor-grab active:cursor-grabbing relative rounded-xl border border-gray-200 bg-white"
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
                  y1={AXIS_Y - 8}
                  x2={x}
                  y2={AXIS_Y + 8}
                  stroke="var(--color-gray-300)"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={AXIS_Y + 24}
                  className="fill-gray-400 text-[11px]"
                  textAnchor="middle"
                >
                  {year}
                </text>
              </g>
            )
          })}

          {/* Timeline axis */}
          <line
            x1={PADDING - 20}
            y1={AXIS_Y}
            x2={totalWidth - PADDING + 20}
            y2={AXIS_Y}
            stroke="var(--color-gray-200)"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Events */}
          {eventPositions.map(({ event, x, labelY, isAbove }) => {
            const isSelected = selectedId === event.id
            const connectorEndY = isAbove ? labelY + LABEL_HEIGHT : labelY

            return (
              <g
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="cursor-pointer"
              >
                {/* Connector line */}
                <line
                  x1={x}
                  y1={AXIS_Y}
                  x2={x}
                  y2={connectorEndY}
                  stroke={isSelected ? 'var(--color-primary)' : 'var(--color-gray-200)'}
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Dot on axis */}
                <circle
                  cx={x}
                  cy={AXIS_Y}
                  r={isSelected ? DOT_RADIUS + 2 : DOT_RADIUS}
                  className={isSelected ? 'fill-primary' : 'fill-gray-400 hover:fill-primary/60'}
                  style={{ transition: 'fill 0.15s' }}
                />

                {/* Label */}
                <rect
                  x={x - 4}
                  y={labelY}
                  width={LABEL_WIDTH}
                  height={LABEL_HEIGHT}
                  rx={6}
                  className={
                    isSelected
                      ? 'fill-soft-accent stroke-secondary'
                      : 'fill-white stroke-gray-200 hover:stroke-gray-300'
                  }
                  strokeWidth={1}
                />
                <text
                  x={x + 6}
                  y={labelY + 17}
                  className={`text-xs font-medium pointer-events-none ${
                    isSelected ? 'fill-secondary' : 'fill-gray-700'
                  }`}
                >
                  {event.title.length > 20 && <title>{event.title}</title>}
                  {event.title.length > 20
                    ? event.title.slice(0, 20) + '…'
                    : event.title}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Inline detail card */}
        {selectedEvent && selectedPos && (
          <div
            ref={cardRef}
            className="absolute z-20 w-80"
            style={{
              left: Math.max(8, Math.min(selectedX - 140, totalWidth - 330)),
              top: selectedPos.isAbove
                ? selectedPos.labelY - 8
                : selectedPos.labelY + LABEL_HEIGHT + 8,
            }}
          >
            <EventCard event={selectedEvent} editable={editable} />
          </div>
        )}
      </div>
    </div>
  )
})

export default HorizontalView
