import { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { MapPin, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { getTagPalette } from '@/utils/constants'

/**
 * MapView — A spatial/chronological map of events.
 * Plots events on a 2D canvas where X = time, Y = category/person lanes.
 * Pure SVG, no external mapping dependency.
 */
const MapView = memo(function MapView({ events }) {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const [hoveredId, setHoveredId] = useState(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setDimensions({ width: Math.max(width, 400), height: Math.max(height, 300) })
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Parse events into plottable data
  const { lanes, timeRange, plotEvents } = useMemo(() => {
    if (events.length === 0) return { lanes: [], timeRange: [0, 1], plotEvents: [] }

    // Build lanes from tags (primary tag) or 'General'
    const laneMap = new Map()
    const parsed = []

    for (const evt of events) {
      const d = evt.dateStart
      if (!d) continue
      const ts = new Date(d).getTime()
      if (isNaN(ts)) continue
      const lane = evt.location || evt.tags?.[0] || 'general'
      if (!laneMap.has(lane)) laneMap.set(lane, laneMap.size)
      parsed.push({ ...evt, ts, lane, laneIdx: laneMap.get(lane) })
    }

    // Update lane indices after building map
    for (const p of parsed) {
      p.laneIdx = laneMap.get(p.lane)
    }

    const times = parsed.map((p) => p.ts)
    const minT = Math.min(...times)
    const maxT = Math.max(...times)
    const range = maxT - minT || 1

    return {
      lanes: [...laneMap.keys()],
      timeRange: [minT, maxT, range],
      plotEvents: parsed,
    }
  }, [events])

  const PADDING = { top: 50, right: 40, bottom: 40, left: 40 }
  const plotW = dimensions.width - PADDING.left - PADDING.right
  const plotH = dimensions.height - PADDING.top - PADDING.bottom
  const laneHeight = lanes.length > 0 ? plotH / lanes.length : plotH

  const getX = useCallback(
    (ts) => {
      const [minT, , range] = timeRange
      return PADDING.left + ((ts - minT) / range) * plotW
    },
    [timeRange, plotW]
  )

  const getY = useCallback(
    (laneIdx) => PADDING.top + laneIdx * laneHeight + laneHeight / 2,
    [laneHeight]
  )

  const handleZoom = useCallback((delta) => {
    setTransform((t) => {
      const newScale = Math.max(0.5, Math.min(3, t.scale + delta))
      return { ...t, scale: newScale }
    })
  }, [])

  const handleReset = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 })
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.map-event-node')) return
    isPanning.current = true
    panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y }
  }, [transform])

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return
    setTransform((t) => ({
      ...t,
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    }))
  }, [])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    handleZoom(delta)
  }, [handleZoom])

  // Year markers along X axis
  const yearMarkers = useMemo(() => {
    if (plotEvents.length === 0) return []
    const [minT, maxT] = timeRange
    const minYear = new Date(minT).getUTCFullYear()
    const maxYear = new Date(maxT).getUTCFullYear()
    const markers = []
    for (let y = minYear; y <= maxYear; y++) {
      const ts = new Date(Date.UTC(y, 0, 1)).getTime()
      if (ts >= minT && ts <= maxT) {
        markers.push({ year: y, x: getX(ts) })
      }
    }
    // If only one year or same year, show just that
    if (markers.length === 0) {
      markers.push({ year: minYear, x: PADDING.left + plotW / 2 })
    }
    return markers
  }, [plotEvents, timeRange, getX, plotW])

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <MapPin size={32} className="mb-3 text-gray-300" />
        <p className="text-sm">No events to map</p>
      </div>
    )
  }

  if (plotEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <MapPin size={32} className="mb-3 text-gray-300" />
        <p className="text-sm">No dated events to visualize</p>
      </div>
    )
  }

  const hovered = hoveredId ? plotEvents.find((e) => e.id === hoveredId) : null

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleZoom(0.2)}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => handleZoom(-0.2)}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Maximize2 size={16} />
        </button>
        <span className="ml-2 text-[11px] text-gray-400">
          {plotEvents.length} event{plotEvents.length !== 1 ? 's' : ''} across {lanes.length} categor{lanes.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* SVG Map */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-gray-200/60 bg-white overflow-hidden select-none"
        style={{ height: Math.max(300, lanes.length * 80 + 100) }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          width={dimensions.width}
          height={Math.max(300, lanes.length * 80 + 100)}
          className="w-full h-full"
        >
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Lane backgrounds */}
            {lanes.map((lane, i) => {
              const y = PADDING.top + i * laneHeight
              return (
                <g key={lane}>
                  <rect
                    x={PADDING.left}
                    y={y}
                    width={plotW}
                    height={laneHeight}
                    fill={i % 2 === 0 ? 'rgba(248,250,252,0.5)' : 'transparent'}
                    rx={4}
                  />
                  <text
                    x={PADDING.left + 6}
                    y={y + 14}
                    fontSize={10}
                    fontWeight={600}
                    fill="#94a3b8"
                    textTransform="uppercase"
                    className="uppercase"
                  >
                    {lane}
                  </text>
                </g>
              )
            })}

            {/* Year grid lines */}
            {yearMarkers.map(({ year, x }) => (
              <g key={year}>
                <line
                  x1={x}
                  y1={PADDING.top - 5}
                  x2={x}
                  y2={PADDING.top + plotH}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={x}
                  y={PADDING.top - 12}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#94a3b8"
                >
                  {year}
                </text>
              </g>
            ))}

            {/* Connection lines between events in same lane */}
            {lanes.map((lane, laneIdx) => {
              const laneEvents = plotEvents
                .filter((e) => e.laneIdx === laneIdx)
                .sort((a, b) => a.ts - b.ts)
              if (laneEvents.length < 2) return null
              const points = laneEvents.map((e) => `${getX(e.ts)},${getY(laneIdx)}`).join(' ')
              return (
                <polyline
                  key={lane}
                  points={points}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              )
            })}

            {/* Event dots */}
            {plotEvents.map((evt) => {
              const cx = getX(evt.ts)
              const cy = getY(evt.laneIdx)
              const palette = getTagPalette(evt.lane)
              const isHovered = hoveredId === evt.id

              return (
                <g
                  key={evt.id}
                  className="map-event-node cursor-pointer"
                  onMouseEnter={() => setHoveredId(evt.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {isHovered && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={14}
                      fill={palette.bg}
                      opacity={0.5}
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 7 : 5}
                    fill={palette.activeBg}
                    stroke="white"
                    strokeWidth={2}
                    style={{ transition: 'r 0.15s ease' }}
                  />
                  {isHovered && (
                    <text
                      x={cx}
                      y={cy - 14}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={600}
                      fill="#334155"
                    >
                      {evt.title?.length > 30 ? evt.title.slice(0, 30) + '…' : evt.title}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div
            className="absolute z-20 pointer-events-none px-3 py-2 rounded-lg bg-gray-900/90 text-white text-xs shadow-lg max-w-[240px]"
            style={{
              left: Math.min(getX(hovered.ts) * transform.scale + transform.x + 16, dimensions.width - 260),
              top: getY(hovered.laneIdx) * transform.scale + transform.y - 8,
            }}
          >
            <p className="font-semibold truncate">{hovered.title}</p>
            <p className="text-gray-300 text-[10px] mt-0.5">
              {new Date(hovered.dateStart).toLocaleDateString()}
              {hovered.location && ` · ${hovered.location}`}
              {hovered.people?.length > 0 && ` · ${hovered.people.join(', ')}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

export default MapView
