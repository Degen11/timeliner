import { useRef, useState, useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import EventCard from './EventCard'
import useDragScroll from '@/hooks/useDragScroll'
import useTimelineStore from '@/store/useTimelineStore'
import {
  safeDateCompare,
  safeGetUTCYear,
  safeGetUTCMonth,
  formatEventDate,
  getDateRangeDuration,
} from '@/utils/dateUtils'
import { getEventColor, HORIZONTAL_RENDER_CAP } from '@/utils/constants'

const YEAR_WIDTH = 200
const MIN_YEAR_WIDTH = 44
const AXIS_Y = 260
const DOT_RADIUS = 5
const PHOTO_DOT_R = 14
const LABEL_HEIGHT = 28
const LABEL_WIDTH = 160
const PADDING = 60
const ROW_SPACING = 36
const RANGE_BAR_HEIGHT = 8
const RANGE_BAR_GAP = 3

function HorizontalView({ events, editable = false, onEditEvent }) {
  const { containerRef, scrollProps, wasDragged, isDragging } = useDragScroll()
  const cardRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [hoveredRangeId, setHoveredRangeId] = useState(null)
  const [rangeTooltip, setRangeTooltip] = useState(null)
  const photoMap = useTimelineStore((s) => s.photoMap)
  const darkMode = useTimelineStore((s) => s.darkMode)

  // No virtualization in this view — cap rendered events to keep the SVG manageable
  const isCapped = events.length > HORIZONTAL_RENDER_CAP
  const visibleEvents = isCapped ? events.slice(0, HORIZONTAL_RENDER_CAP) : events

  // Resolve first photo URL for each event
  const eventPhotoUrls = (() => {
    const map = new Map()
    for (const event of visibleEvents) {
      if (event.photos?.length > 0) {
        const url = photoMap[event.photos[0]]
        if (url) map.set(event.id, url)
      }
    }
    return map
  })()

  // Track viewport width so the whole date range can fit on entry
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => setContainerWidth(el.clientWidth)
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [containerRef])

  const { sorted, minYear, maxYear } = (() => {
    if (visibleEvents.length === 0) return { sorted: [], minYear: 2000, maxYear: 2000 }

    const sorted = [...visibleEvents].sort((a, b) => safeDateCompare(a.dateStart, b.dateStart))
    const years = sorted.flatMap((e) => {
      const sy = safeGetUTCYear(e.dateStart, 2000)
      const ey = e.dateEnd ? safeGetUTCYear(e.dateEnd, sy) : sy
      return [sy, ey]
    })
    return { sorted, minYear: Math.min(...years), maxYear: Math.max(...years) }
  })()

  // Fit the full range to the viewport on entry. The floor scales with event
  // density: sparse timelines compress until everything fits, dense ones keep
  // enough room per event and stay scrollable.
  const yearSpan = maxYear - minYear + 2
  const fitWidth = containerWidth > 0 ? (containerWidth - PADDING * 2) / yearSpan : YEAR_WIDTH
  const densityFloor = Math.min(
    MIN_YEAR_WIDTH,
    Math.max(12, (visibleEvents.length / yearSpan) * 60)
  )
  const yearWidth = Math.max(densityFloor, Math.min(YEAR_WIDTH, fitWidth))
  const totalWidth = Math.max(yearSpan * yearWidth + PADDING * 2, 600)

  const getX = (event) => {
    if (!event.dateStart) return PADDING
    const year = safeGetUTCYear(event.dateStart, minYear)
    const month = safeGetUTCMonth(event.dateStart)
    return PADDING + (year - minYear) * yearWidth + (month / 12) * yearWidth
  }

  const getEndX = (event) => {
    if (!event.dateEnd) return null
    const year = safeGetUTCYear(event.dateEnd, minYear)
    const month = safeGetUTCMonth(event.dateEnd)
    return PADDING + (year - minYear) * yearWidth + (month / 12) * yearWidth
  }

  // Always show the inline preview card — reading comes first; the card's own
  // click/pencil route to the detail view or edit modal from there.
  const handleEventClick = (eventId) => {
    if (wasDragged()) return
    setSelectedId((prev) => (prev === eventId ? null : eventId))
  }

  // Range bar hover tooltip
  const handleRangeHover = (e, event) => {
    if (wasDragged()) return
    setHoveredRangeId(event.id)
    const rect = containerRef.current.getBoundingClientRect()
    const duration = getDateRangeDuration(event.dateStart, event.dateEnd)
    setRangeTooltip({
      x: e.clientX - rect.left + containerRef.current.scrollLeft,
      y: e.clientY - rect.top,
      title: event.title,
      date: formatEventDate(event),
      duration,
    })
  }

  const handleRangeLeave = () => {
    setHoveredRangeId(null)
    setRangeTooltip(null)
  }

  // Close on Escape
  useHotkeys('escape', () => setSelectedId(null), { enabled: !!selectedId })

  // Close on outside click
  useEffect(() => {
    if (!selectedId) return

    const handleClickOutside = (e) => {
      if (e.target.closest('[data-datepicker-popover]')) return
      if (e.target.closest('[data-photo-uploader]')) return
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setSelectedId(null)
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedId])

  const yearMarkers = []
  for (let y = minYear; y <= maxYear + 1; y++) {
    yearMarkers.push(y)
  }

  // At tight zoom levels, label only every Nth year so the labels don't collide
  const yearLabelStep = Math.max(1, Math.ceil(56 / yearWidth))

  // Assign overlapping range bars to separate vertical lanes
  const rangeLanes = (() => {
    const ranges = sorted
      .map((event) => ({ id: event.id, x: getX(event), endX: getEndX(event) }))
      .filter(({ x, endX }) => endX != null && endX > x)
      .sort((a, b) => a.x - b.x)

    const lanes = []
    const laneMap = new Map()

    for (const r of ranges) {
      let lane = 0
      for (lane = 0; lane < lanes.length; lane++) {
        if (r.x >= lanes[lane]) break
      }
      if (lane === lanes.length) lanes.push(0)
      lanes[lane] = r.endX
      laneMap.set(r.id, lane)
    }

    return { laneMap, count: lanes.length }
  })()

  // Vertical zone sizes derived from range lane count
  const rangeZoneHeight = rangeLanes.count * (RANGE_BAR_HEIGHT + RANGE_BAR_GAP)
  const belowAxisExtra = rangeZoneHeight > 0 ? rangeZoneHeight + 24 : 0
  const yearLabelY = AXIS_Y + DOT_RADIUS + 8 + rangeZoneHeight + 14
  const tickBottom = AXIS_Y + DOT_RADIUS + 4 + rangeZoneHeight + 4

  // Assign events to lanes alternating above/below the axis
  const eventPositions = (() => {
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
      const labelY = isAbove ? AXIS_Y - distance : AXIS_Y + belowAxisExtra + distance - LABEL_HEIGHT

      return { event, x, endX: getEndX(event), labelY, isAbove, color: getEventColor(event) }
    })
  })()

  // Compute SVG height
  const svgHeight = (() => {
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
  })()

  const { selectedEvent, selectedX, selectedPos } = (() => {
    if (!selectedId) return { selectedEvent: null, selectedX: 0, selectedPos: null }
    const selectedEvent = sorted.find((e) => e.id === selectedId)
    const selectedX = selectedEvent ? getX(selectedEvent) : 0
    const selectedPos = eventPositions.find((p) => p.event.id === selectedId)
    return { selectedEvent, selectedX, selectedPos }
  })()

  return (
    <div className="space-y-2">
      {isCapped && (
        <p className="text-xs text-text-muted">
          Showing first {HORIZONTAL_RENDER_CAP} of {events.length} events — switch to Vertical or Grid view for the full list
        </p>
      )}
    <div
      ref={containerRef}
      className={`overflow-x-auto relative rounded-xl border border-gray-200 bg-surface touch-pan-y scroll-momentum mobile-hide-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      {...scrollProps}
    >
      <div className="relative" style={{ width: totalWidth, minHeight: svgHeight }}>
        <svg width={totalWidth} height={svgHeight} className="select-none">
          {/* Alternating year bands */}
          {yearMarkers.map((year) => {
            if ((year - minYear) % (yearLabelStep * 2) !== 0) return null
            const x = PADDING + (year - minYear) * yearWidth
            return (
              <rect
                key={`band-${year}`}
                x={x}
                y={0}
                width={yearWidth * yearLabelStep}
                height={svgHeight}
                fill={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)'}
              />
            )
          })}

          {/* Year markers */}
          {yearMarkers.map((year) => {
            const x = PADDING + (year - minYear) * yearWidth
            const showLabel = (year - minYear) % yearLabelStep === 0
            return (
              <g key={year}>
                {(showLabel || yearWidth >= 28) && (
                  <line
                    x1={x}
                    y1={AXIS_Y - 10}
                    x2={x}
                    y2={tickBottom}
                    stroke="var(--color-gray-300)"
                    strokeWidth={1}
                  />
                )}
                {showLabel && (
                  <text
                    x={x}
                    y={yearLabelY}
                    className="font-serif text-[13px] font-semibold"
                    fill="var(--color-gray-500)"
                    textAnchor="middle"
                  >
                    {year}
                  </text>
                )}
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

          {/* Date range bars — stacked into lanes below the axis */}
          {eventPositions.map(({ event, x, endX, color }) => {
            if (endX == null || endX <= x) return null
            const lane = rangeLanes.laneMap.get(event.id) ?? 0
            const barY = AXIS_Y + DOT_RADIUS + 6 + lane * (RANGE_BAR_HEIGHT + RANGE_BAR_GAP)
            const isSelected = selectedId === event.id
            const isHovered = hoveredRangeId === event.id
            const barWidth = endX - x

            return (
              <g key={`range-${event.id}`}>
                <rect
                  x={x}
                  y={barY}
                  width={barWidth}
                  height={RANGE_BAR_HEIGHT}
                  rx={RANGE_BAR_HEIGHT / 2}
                  fill={color.dot}
                  opacity={isSelected || isHovered ? 0.65 : 0.35}
                  style={{ transition: 'opacity 0.15s' }}
                  onClick={() => handleEventClick(event.id)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseMove={(e) => handleRangeHover(e, event)}
                  onMouseLeave={handleRangeLeave}
                  className="cursor-pointer"
                />
                {/* Duration label on wider bars */}
                {barWidth > 80 && (
                  <text
                    x={x + barWidth / 2}
                    y={barY + RANGE_BAR_HEIGHT / 2 + 3.5}
                    textAnchor="middle"
                    fill={color.dot}
                    opacity={isSelected || isHovered ? 0.9 : 0.6}
                    className="text-[9px] font-medium pointer-events-none"
                    style={{ transition: 'opacity 0.15s' }}
                  >
                    {getDateRangeDuration(event.dateStart, event.dateEnd) || ''}
                  </text>
                )}
              </g>
            )
          })}

          {/* Clip paths for photo dot thumbnails */}
          <defs>
            {eventPositions.map(({ event, x }) => {
              if (!eventPhotoUrls.has(event.id)) return null
              return (
                <clipPath key={`clip-${event.id}`} id={`pclip-${event.id}`}>
                  <circle cx={x} cy={AXIS_Y} r={PHOTO_DOT_R} />
                </clipPath>
              )
            })}
          </defs>

          {/* Events */}
          {eventPositions.map(({ event, x, labelY, isAbove, color }, i) => {
            const isSelected = selectedId === event.id
            const connectorEndY = isAbove ? labelY + LABEL_HEIGHT : labelY
            const dotColor = color.dot
            const dotRadius = isSelected ? DOT_RADIUS + 3 : DOT_RADIUS
            const photoUrl = eventPhotoUrls.get(event.id)

            return (
              <g
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                onPointerDown={(e) => e.stopPropagation()}
                className="cursor-pointer"
              >
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

                {photoUrl ? (
                  <>
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={AXIS_Y}
                        r={PHOTO_DOT_R + 5}
                        fill={dotColor}
                        opacity={0.15}
                      />
                    )}
                    <circle cx={x} cy={AXIS_Y} r={PHOTO_DOT_R + 1.5} fill="var(--color-surface)" />
                    <image
                      href={photoUrl}
                      x={x - PHOTO_DOT_R}
                      y={AXIS_Y - PHOTO_DOT_R}
                      width={PHOTO_DOT_R * 2}
                      height={PHOTO_DOT_R * 2}
                      clipPath={`url(#pclip-${event.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                    <circle
                      cx={x}
                      cy={AXIS_Y}
                      r={PHOTO_DOT_R + 0.5}
                      fill="none"
                      stroke={isSelected ? dotColor : color.stroke}
                      strokeWidth={isSelected ? 2 : 1.5}
                    />
                  </>
                ) : (
                  <>
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={AXIS_Y}
                        r={DOT_RADIUS + 8}
                        fill={dotColor}
                        opacity={0.15}
                      />
                    )}
                    <circle
                      cx={x}
                      cy={AXIS_Y}
                      r={dotRadius}
                      fill={dotColor}
                      className="timeline-dot-enter"
                      style={{ transition: 'r 0.15s, fill 0.15s', animationDelay: `${Math.min(i, 8) * 60}ms` }}
                    />
                  </>
                )}

                {/* Label card */}
                <rect
                  x={x - 4}
                  y={labelY}
                  width={LABEL_WIDTH}
                  height={LABEL_HEIGHT}
                  rx={6}
                  fill={isSelected ? color.light : 'var(--color-surface)'}
                  stroke={isSelected ? dotColor : color.stroke}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                  opacity={isSelected ? 1 : 0.9}
                />

                {/* Color accent bar */}
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
                  fill={isSelected ? dotColor : 'var(--color-gray-700)'}
                >
                  {event.title.length > 20 && <title>{event.title}</title>}
                  {event.title.length > 20 ? event.title.slice(0, 20) + '\u2026' : event.title}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Range bar hover tooltip */}
        {rangeTooltip && (
          <div
            className="absolute z-30 pointer-events-none rounded-lg px-3 py-2 shadow-lg text-xs"
            style={{
              left: rangeTooltip.x,
              top: rangeTooltip.y - 60,
              transform: 'translateX(-50%)',
              maxWidth: 220,
              backgroundColor: 'var(--color-tooltip-bg)',
              color: 'var(--color-tooltip-text)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <p className="font-medium truncate">{rangeTooltip.title}</p>
            <p className="text-[10px]" style={{ color: 'var(--color-tooltip-muted)' }}>{rangeTooltip.date}</p>
            {rangeTooltip.duration && (
              <p className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                {rangeTooltip.duration}
              </p>
            )}
          </div>
        )}

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
            <EventCard event={selectedEvent} editable={editable} onEdit={onEditEvent} />
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

export default HorizontalView
