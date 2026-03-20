import { useMemo, useState, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
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
const YEAR_WIDTH = 220
const CENTER_Y = 300
const WAVE_AMPLITUDE = 120
const PADDING = 80
const CARD_WIDTH = 180

const WaveCard = memo(function WaveCard({ event, x, y, editable, onEdit, onSelect, isSelected, color, index }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const photos = useResolvedPhotos(event.photos || EMPTY_PHOTOS).filter((p) => p.url)
  const heroPhoto = photos[0]
  const isAbove = y < CENTER_Y

  const { handleClick } = useCardClick(event, { editable, onEdit, onSelect })

  // Card positioned so it extends from the wave point outward
  const cardTop = isAbove ? y - (heroPhoto ? 180 : 100) : y + 16
  const distFromCenter = Math.abs(y - CENTER_Y) / WAVE_AMPLITUDE
  const scaleFactor = 0.85 + distFromCenter * 0.15 // Cards at peaks are slightly larger

  return (
    <>
      <motion.div
        className={`absolute transition-all duration-500 ${isSelected ? 'z-30' : 'z-10'}`}
        initial={{ opacity: 0, y: isAbove ? -14 : 14, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: isSelected ? 1.08 : scaleFactor }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.07 }}
        style={{
          left: x - CARD_WIDTH / 2,
          top: cardTop,
          width: CARD_WIDTH,
        }}
        onClick={handleClick}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className={`group rounded-2xl overflow-hidden bg-white/85 backdrop-blur-md border cursor-pointer transition-all duration-200 hover:shadow-xl ${
            isSelected
              ? 'shadow-2xl border-2'
              : 'shadow-md hover:-translate-y-1 border-gray-200/60'
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
                className="w-full h-28 object-cover"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(0)
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              {photos.length > 1 && (
                <div className="absolute bottom-1.5 right-1.5 rounded-full bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-medium text-white">
                  +{photos.length - 1}
                </div>
              )}
            </div>
          )}
          <div className="p-3">
            <span
              className="text-[9px] font-bold uppercase tracking-widest block mb-0.5"
              style={{ color: color.dot }}
            >
              {formatEventDate(event)}
            </span>
            <h3 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 mb-0.5">
              {event.title}
            </h3>
            {event.location && (
              <div className="flex items-center gap-0.5 text-[9px] text-gray-400 mb-1">
                <MapPin size={8} className="shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            {isSelected && event.description && (
              <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-3 mb-1.5">
                {event.description}
              </p>
            )}
            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-0.5">
                {event.tags.slice(0, isSelected ? 4 : 2).map((tag) => (
                  <Badge key={tag} variant={tag} small>
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

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

const HorizontalWave = memo(function HorizontalWave({ events, editable = false, onEditEvent }) {
  const shouldIgnore = useCallback((e) => !!e.target.closest('.z-30'), [])
  const { containerRef, scrollProps, wasDragged } = useDragScroll({ shouldIgnore })
  const [selectedId, setSelectedId] = useState(null)
  const darkMode = useTimelineStore((s) => s.darkMode)

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

  // Compute wave path and event positions on the wave
  const { wavePath, eventPositions, yearMarkers } = useMemo(() => {
    const points = []
    const eventPositions = []
    const totalSpan = totalWidth - 2 * PADDING

    // Generate smooth wave points
    for (let px = 0; px <= totalSpan; px += 4) {
      const x = PADDING + px
      const waveY = CENTER_Y + Math.sin((px / totalSpan) * Math.PI * 3) * WAVE_AMPLITUDE
      points.push({ x, y: waveY })
    }

    // Build SVG path
    let wavePath = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      wavePath += ` L ${points[i].x} ${points[i].y}`
    }

    // Position events on the wave
    for (const event of sorted) {
      const x = getX(event)
      const normalizedX = (x - PADDING) / totalSpan
      const waveY = CENTER_Y + Math.sin(normalizedX * Math.PI * 3) * WAVE_AMPLITUDE
      const color = getEventColor(event)
      eventPositions.push({ event, x, y: waveY, color })
    }

    // Year markers
    const yearMarkers = []
    for (let y = minYear; y <= maxYear + 1; y++) {
      const x = PADDING + (y - minYear) * YEAR_WIDTH
      yearMarkers.push({ year: y, x })
    }

    return { wavePath, eventPositions, yearMarkers }
  }, [sorted, getX, totalWidth, minYear, maxYear])

  const svgHeight = 640

  const handleSelect = useCallback((id) => {
    if (wasDragged()) return
    setSelectedId((prev) => (prev === id ? null : id))
  }, [wasDragged])

  useHotkeys('escape', () => setSelectedId(null), { enabled: !!selectedId })

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto cursor-grab active:cursor-grabbing relative rounded-xl border border-gray-200 bg-surface touch-pan-y"
      {...scrollProps}
    >
      <div className="relative" style={{ width: totalWidth, minHeight: svgHeight }}>
        <svg width={totalWidth} height={svgHeight} className="select-none">
          {/* Wave shadow (depth effect) */}
          <path
            d={wavePath}
            fill="none"
            stroke={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}
            strokeWidth={40}
            strokeLinecap="round"
          />

          {/* Wave path */}
          <path
            d={wavePath}
            fill="none"
            stroke="var(--color-gray-200)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Gradient overlay on wave */}
          <defs>
            <linearGradient id="wave-gradient" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.08" />
              <stop offset="25%" stopColor="#E11D48" stopOpacity="0.06" />
              <stop offset="50%" stopColor="#059669" stopOpacity="0.08" />
              <stop offset="75%" stopColor="#F97316" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path
            d={wavePath}
            fill="none"
            stroke="url(#wave-gradient)"
            strokeWidth={6}
            strokeLinecap="round"
          />

          {/* Year markers */}
          {yearMarkers.map(({ year, x }) => (
            <g key={year}>
              <line
                x1={x}
                y1={CENTER_Y - WAVE_AMPLITUDE - 30}
                x2={x}
                y2={CENTER_Y + WAVE_AMPLITUDE + 30}
                stroke="var(--color-gray-200)"
                strokeWidth={0.5}
                strokeDasharray="6 6"
                opacity={0.5}
              />
              <text
                x={x}
                y={CENTER_Y + WAVE_AMPLITUDE + 50}
                className="text-[12px] font-bold"
                fill="var(--color-gray-400)"
                textAnchor="middle"
              >
                {year}
              </text>
            </g>
          ))}

          {/* Event dots on the wave */}
          {eventPositions.map(({ event, x, y, color }, i) => {
            const isSelected = selectedId === event.id
            return (
              <g key={event.id}>
                {isSelected && (
                  <circle cx={x} cy={y} r={16} fill={color.dot} opacity={0.12} />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 7 : 5}
                  fill={color.dot}
                  stroke="var(--color-surface)"
                  strokeWidth={2.5}
                  className="timeline-dot-enter"
                  style={{ transition: 'r 0.2s', animationDelay: `${i * 60}ms` }}
                />
              </g>
            )
          })}
        </svg>

        {/* HTML cards */}
        {eventPositions.map(({ event, x, y, color }, i) => (
          <WaveCard
            key={event.id}
            event={event}
            x={x}
            y={y}
            editable={editable}
            onEdit={onEditEvent}
            onSelect={handleSelect}
            isSelected={selectedId === event.id}
            color={color}
            index={i}
          />
        ))}
      </div>
    </div>
  )
})

export default HorizontalWave
