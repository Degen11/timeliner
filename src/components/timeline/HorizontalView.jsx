import { useMemo, useRef, useState, useCallback, useEffect, memo } from 'react'
import EventCard from './EventCard'
import { safeDateCompare, safeGetUTCYear, safeGetUTCMonth } from '@/utils/dateUtils'

const YEAR_WIDTH = 200
const AXIS_Y = 260
const DOT_RADIUS = 5
const LABEL_HEIGHT = 28
const LABEL_WIDTH = 160
const PADDING = 60
const ROW_SPACING = 36
const RANGE_BAR_HEIGHT = 5
const RANGE_BAR_GAP = 2

// Tag-based color palette for dots, connectors, and label accents.
// Falls back to a default blue when no tags are present.
const TAG_DOT_COLORS = {
  career:     { dot: '#2563EB', light: '#EFF6FF', stroke: '#93C5FD' },
  education:  { dot: '#7C3AED', light: '#F5F3FF', stroke: '#C4B5FD' },
  travel:     { dot: '#059669', light: '#ECFDF5', stroke: '#6EE7B7' },
  family:     { dot: '#E11D48', light: '#FFF1F2', stroke: '#FDA4AF' },
  health:     { dot: '#DC2626', light: '#FEF2F2', stroke: '#FCA5A5' },
  military:   { dot: '#475569', light: '#F8FAFC', stroke: '#94A3B8' },
  relocation: { dot: '#D97706', light: '#FFFBEB', stroke: '#FCD34D' },
}
const DEFAULT_COLOR = { dot: '#2563EB', light: '#EFF6FF', stroke: '#93C5FD' }

function getEventColor(event) {
  const tag = event.tags?.[0]
  return (tag && TAG_DOT_COLORS[tag]) || DEFAULT_COLOR
}

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
    const years = sorted.flatMap((e) => {
      const sy = safeGetUTCYear(e.dateStart, 2000)
      const ey = e.dateEnd ? safeGetUTCYear(e.dateEnd, sy) : sy
      return [sy, ey]
    })
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

  const getEndX = useCallback(
    (event) => {
      if (!event.dateEnd) return null
      const year = safeGetUTCYear(event.dateEnd, minYear)
      const month = safeGetUTCMonth(event.dateEnd)
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

  // Assign events to lanes alternating above/below the axis
  const eventPositions = useMemo(() => {
    const aboveLanes = []
    const belowLanes = []

    return sorted.map((event, i) => {
      const x = getX(event)
      const isAbove = i % 2 === 0
      const lanes = isAbove ? aboveLanes : belowLanes

      let lane = 0
      for (lane = 0; lane < lanes.length; lane++) {
        if (x - 8 > lanes[lane]) break
      }
      if (lane === lanes.length) lanes.push(0)
      lanes[lane] = x + LABEL_WIDTH + 8

      const distance = (lane + 1) * (LABEL_HEIGHT + ROW_SPACING)
      const labelY = isAbove ? AXIS_Y - distance : AXIS_Y + distance - LABEL_HEIGHT

      return { event, x, endX: getEndX(event), labelY, isAbove, color: getEventColor(event) }
    })
  }, [sorted, getX, getEndX])

  // Assign overlapping range bars to separate vertical lanes
  const rangeLanes = useMemo(() => {
    const ranges = eventPositions
      .filter(({ x, endX }) => endX != null && endX > x)
      .sort((a, b) => a.x - b.x)

    // lanes[i] = rightmost endX occupying lane i
    const lanes = []
    const laneMap = new Map()

    for (const pos of ranges) {
      let lane = 0
      for (lane = 0; lane < lanes.length; lane++) {
        if (pos.x >= lanes[lane]) break // no overlap, reuse this lane
      }
      if (lane === lanes.length) lanes.push(0)
      lanes[lane] = pos.endX
      laneMap.set(pos.event.id, lane)
    }

    return { laneMap, count: lanes.length }
  }, [eventPositions])

  // Compute SVG height
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
    // Extra space for stacked range bars below the axis
    const rangeBarSpace = rangeLanes.count > 0
      ? rangeLanes.count * (RANGE_BAR_HEIGHT + RANGE_BAR_GAP) + 4
      : 0
    return Math.max(AXIS_Y + maxBelow + rangeBarSpace + 60, maxAbove + AXIS_Y + 60, 400)
  }, [eventPositions, rangeLanes])

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
      className="overflow-x-auto cursor-grab active:cursor-grabbing relative rounded-xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white"
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
          {/* Alternating year bands for visual rhythm */}
          {yearMarkers.map((year, i) => {
            if (i % 2 !== 0) return null
            const x = PADDING + (year - minYear) * YEAR_WIDTH
            return (
              <rect
                key={`band-${year}`}
                x={x}
                y={0}
                width={YEAR_WIDTH}
                height={svgHeight}
                fill="rgba(0,0,0,0.015)"
              />
            )
          })}

          {/* Year markers */}
          {yearMarkers.map((year) => {
            const x = PADDING + (year - minYear) * YEAR_WIDTH
            return (
              <g key={year}>
                <line
                  x1={x}
                  y1={AXIS_Y - 10}
                  x2={x}
                  y2={AXIS_Y + 10}
                  stroke="var(--color-gray-300)"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={AXIS_Y + 28}
                  className="text-[12px] font-semibold"
                  fill="var(--color-gray-500)"
                  textAnchor="middle"
                >
                  {year}
                </text>
              </g>
            )
          })}

          {/* Timeline axis — gradient line */}
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
          {eventPositions.map(({ event, x, endX, labelY, isAbove, color }) => {
            const isSelected = selectedId === event.id
            const connectorEndY = isAbove ? labelY + LABEL_HEIGHT : labelY
            const dotColor = isSelected ? color.dot : color.dot
            const dotRadius = isSelected ? DOT_RADIUS + 3 : DOT_RADIUS
            const hasRange = endX != null && endX > x

            return (
              <g
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="cursor-pointer"
              >
                {/* Date range bar — stacked into lanes to avoid overlaps */}
                {hasRange && (() => {
                  const lane = rangeLanes.laneMap.get(event.id) ?? 0
                  const barY = AXIS_Y + 4 + lane * (RANGE_BAR_HEIGHT + RANGE_BAR_GAP)
                  return (
                    <rect
                      x={x}
                      y={barY}
                      width={endX - x}
                      height={RANGE_BAR_HEIGHT}
                      rx={RANGE_BAR_HEIGHT / 2}
                      fill={dotColor}
                      opacity={isSelected ? 0.55 : 0.3}
                      style={{ transition: 'opacity 0.15s' }}
                    />
                  )
                })()}

                {/* Connector line */}
                <line
                  x1={x}
                  y1={AXIS_Y}
                  x2={x}
                  y2={connectorEndY}
                  stroke={isSelected ? dotColor : color.stroke}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray={isSelected ? undefined : '3 3'}
                />

                {/* Glow behind dot when selected */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={AXIS_Y}
                    r={DOT_RADIUS + 8}
                    fill={dotColor}
                    opacity={0.15}
                  />
                )}

                {/* Dot on axis — colored by tag */}
                <circle
                  cx={x}
                  cy={AXIS_Y}
                  r={dotRadius}
                  fill={dotColor}
                  style={{ transition: 'r 0.15s, fill 0.15s' }}
                />

                {/* Label card */}
                <rect
                  x={x - 4}
                  y={labelY}
                  width={LABEL_WIDTH}
                  height={LABEL_HEIGHT}
                  rx={6}
                  fill={isSelected ? color.light : '#FFFFFF'}
                  stroke={isSelected ? dotColor : color.stroke}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                  opacity={isSelected ? 1 : 0.9}
                />

                {/* Color accent bar on left edge of label */}
                <rect
                  x={x - 4}
                  y={labelY}
                  width={3}
                  height={LABEL_HEIGHT}
                  rx={1.5}
                  fill={dotColor}
                  opacity={isSelected ? 1 : 0.6}
                />

                <text
                  x={x + 8}
                  y={labelY + 17}
                  className="text-xs font-medium pointer-events-none"
                  fill={isSelected ? dotColor : '#374151'}
                >
                  {event.title.length > 20 && <title>{event.title}</title>}
                  {event.title.length > 20
                    ? event.title.slice(0, 20) + '\u2026'
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
