import { useMemo, useState, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { MapPin } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import Badge from '@/components/shared/Badge'
import useCardClick from '@/hooks/useCardClick'
import useDragScroll from '@/hooks/useDragScroll'
import useTimelineStore from '@/store/useTimelineStore'
import { useResolvedPhotos } from './PhotoPreview'
import PhotoLightbox from '@/components/shared/PhotoLightbox'
import {
  safeDateCompare,
  safeGetUTCYear,
  safeGetUTCMonth,
  formatEventDate,
} from '@/utils/dateUtils'
import { getEventColor } from '@/utils/constants'

const EMPTY_PHOTOS = []
const YEAR_WIDTH = 240
const AXIS_Y = 320
const PADDING = 80
const CARD_WIDTH = 200
const CARD_GAP = 24

// Individual event card rendered in HTML (positioned over SVG)
const PanoramicCard = memo(function PanoramicCard({
  event,
  x,
  isAbove,
  color,
  editable,
  onEdit,
  onSelect,
  isSelected,
  index,
  depth,
}) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const photos = useResolvedPhotos(event.photos || EMPTY_PHOTOS).filter((p) => p.url)
  const heroPhoto = photos[0]

  // Staggered heights based on content and depth
  const hasPhoto = !!heroPhoto
  const cardHeight = hasPhoto ? (depth === 0 ? 260 : 200) : 120
  const scale = depth === 0 ? 1 : depth === 1 ? 0.92 : 0.85
  const opacity = depth === 0 ? 1 : depth === 1 ? 0.9 : 0.8

  const topPos = isAbove ? AXIS_Y - cardHeight - 40 - depth * 20 : AXIS_Y + 40 + depth * 20

  const { handleClick } = useCardClick(event, { editable, onEdit, onSelect })

  return (
    <>
      <div
        className={`absolute transition-all duration-500 timeline-card-enter ${isSelected ? 'z-20' : 'z-10'}`}
        style={{
          left: x - CARD_WIDTH / 2,
          top: topPos,
          width: CARD_WIDTH,
          transform: `scale(${isSelected ? 1.05 : scale})`,
          opacity: isSelected ? 1 : opacity,
          animationDelay: `${index * 80}ms`,
        }}
        onClick={handleClick}
      >
        <div
          className={`group rounded-2xl overflow-hidden bg-white/80 backdrop-blur-md border shadow-md cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
            isSelected ? 'border-2 shadow-lg' : 'border-gray-200/60'
          }`}
          style={isSelected ? { borderColor: color.dot } : undefined}
        >
          {heroPhoto && (
            <div className="relative" data-photo-click>
              <img
                src={heroPhoto.url}
                alt={heroPhoto.name}
                loading="lazy"
                decoding="async"
                className={`w-full object-cover ${depth === 0 ? 'h-36' : 'h-24'}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(0)
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              {photos.length > 1 && (
                <div className="absolute top-2 right-2 rounded-full bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-medium text-white">
                  +{photos.length - 1}
                </div>
              )}
            </div>
          )}

          {/* Accent bar for no-photo cards */}
          {!heroPhoto && (
            <div
              className="h-1 w-full rounded-t-2xl"
              style={{ backgroundColor: color.dot, opacity: 0.5 }}
            />
          )}
          <div className="p-3">
            <span
              className="text-[9px] font-bold uppercase tracking-widest block mb-1"
              style={{ color: color.dot }}
            >
              {formatEventDate(event)}
            </span>
            <h3 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 mb-1">
              {event.title}
            </h3>
            {event.description && (depth === 0 || isSelected) && (
              <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2 mb-1">
                {event.description}
              </p>
            )}
            {event.location && (
              <div className="flex items-center gap-0.5 text-[9px] text-gray-400 mb-1">
                <MapPin size={8} className="shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-0.5 mt-1">
                {event.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant={tag} small>
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {lightboxIndex !== null &&
        photos.length > 0 &&
        createPortal(
          <PhotoLightbox
            photos={photos}
            currentIndex={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />,
          document.body
        )}
    </>
  )
})

const HorizontalPanoramic = memo(function HorizontalPanoramic({ events, editable = false, onEditEvent }) {
  const { containerRef, scrollProps, wasDragged } = useDragScroll()
  const [selectedId, setSelectedId] = useState(null)
  const darkMode = useTimelineStore((s) => s.darkMode)
  const photoMap = useTimelineStore((s) => s.photoMap)

  const { sorted, minYear, maxYear, totalWidth } = useMemo(() => {
    if (events.length === 0) return { sorted: [], minYear: 2000, maxYear: 2000, totalWidth: 600 }
    const sorted = [...events].sort((a, b) => safeDateCompare(a.dateStart, b.dateStart))
    const years = sorted.flatMap((e) => {
      const sy = safeGetUTCYear(e.dateStart, 2000)
      const ey = e.dateEnd ? safeGetUTCYear(e.dateEnd, sy) : sy
      return [sy, ey]
    })
    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)
    const totalWidth = Math.max((maxYear - minYear + 2) * YEAR_WIDTH + PADDING * 2, 800)
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

  // Position events with depth layering to prevent overlap
  const eventPositions = useMemo(() => {
    const aboveLanes = []
    const belowLanes = []

    return sorted.map((event, i) => {
      const x = getX(event)
      const isAbove = i % 2 === 0
      const lanes = isAbove ? aboveLanes : belowLanes
      const hasPhoto = event.photos?.some((p) => photoMap[p])

      let depth = 0
      for (depth = 0; depth < lanes.length; depth++) {
        if (x - CARD_GAP > lanes[depth]) break
      }
      if (depth === lanes.length) lanes.push(0)
      lanes[depth] = x + CARD_WIDTH + CARD_GAP

      return { event, x, isAbove, color: getEventColor(event), depth, hasPhoto }
    })
  }, [sorted, getX, photoMap])

  const svgHeight = 700

  const handleSelect = useCallback((id) => {
    if (wasDragged()) return
    setSelectedId((prev) => (prev === id ? null : id))
  }, [wasDragged])

  useHotkeys('escape', () => setSelectedId(null), { enabled: !!selectedId })

  const yearMarkers = []
  for (let y = minYear; y <= maxYear + 1; y++) yearMarkers.push(y)

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto cursor-grab active:cursor-grabbing relative rounded-xl border border-gray-200 bg-surface touch-pan-y"
      {...scrollProps}
    >
      <div className="relative" style={{ width: totalWidth, minHeight: svgHeight }}>
        <svg width={totalWidth} height={svgHeight} className="select-none">
          {/* Background gradient bands */}
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
                fill={darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'}
              />
            )
          })}

          {/* Axis line with gradient */}
          <defs>
            <linearGradient id="axis-gradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--color-gray-200)" stopOpacity="0" />
              <stop offset="10%" stopColor="var(--color-gray-200)" stopOpacity="1" />
              <stop offset="90%" stopColor="var(--color-gray-200)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--color-gray-200)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line
            x1={0}
            y1={AXIS_Y}
            x2={totalWidth}
            y2={AXIS_Y}
            stroke="url(#axis-gradient)"
            strokeWidth={2}
          />

          {/* Year markers */}
          {yearMarkers.map((year) => {
            const x = PADDING + (year - minYear) * YEAR_WIDTH
            return (
              <g key={year}>
                <line
                  x1={x}
                  y1={AXIS_Y - 16}
                  x2={x}
                  y2={AXIS_Y + 16}
                  stroke="var(--color-gray-300)"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={AXIS_Y + 32}
                  className="text-[12px] font-bold"
                  fill="var(--color-gray-400)"
                  textAnchor="middle"
                >
                  {year}
                </text>
              </g>
            )
          })}

          {/* Event dots and connectors */}
          {eventPositions.map(({ event, x, isAbove, color, depth }) => {
            const isSelected = selectedId === event.id
            const dotR = isSelected ? 7 : depth === 0 ? 5 : 4
            const connectorEnd = isAbove ? AXIS_Y - 38 - depth * 20 : AXIS_Y + 38 + depth * 20

            return (
              <g key={event.id}>
                {/* Connector */}
                <line
                  x1={x}
                  y1={AXIS_Y}
                  x2={x}
                  y2={connectorEnd}
                  stroke={color.dot}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={isSelected ? 0.7 : 0.3}
                  strokeDasharray={isSelected ? undefined : '4 4'}
                />
                {/* Glow behind dot when selected */}
                {isSelected && (
                  <circle cx={x} cy={AXIS_Y} r={14} fill={color.dot} opacity={0.12} />
                )}
                {/* Dot */}
                <circle
                  cx={x}
                  cy={AXIS_Y}
                  r={dotR}
                  fill={color.dot}
                  style={{ transition: 'r 0.2s' }}
                />
              </g>
            )
          })}
        </svg>

        {/* HTML cards rendered over the SVG */}
        {eventPositions.map(({ event, x, isAbove, color, depth }, i) => (
          <PanoramicCard
            key={event.id}
            event={event}
            x={x}
            isAbove={isAbove}
            color={color}
            editable={editable}
            onEdit={onEditEvent}
            onSelect={handleSelect}
            isSelected={selectedId === event.id}
            index={i}
            depth={depth}
          />
        ))}
      </div>
    </div>
  )
})

export default HorizontalPanoramic
