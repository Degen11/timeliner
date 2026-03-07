import { useMemo, useRef, useState, useCallback, useEffect, memo } from 'react'
import { createPortal } from 'react-dom'
import { MapPin } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import useTimelineStore from '@/store/useTimelineStore'
import { useResolvedPhotos } from './PhotoPreview'
import PhotoLightbox from '@/components/shared/PhotoLightbox'
import {
  safeDateCompare,
  safeGetUTCYear,
  safeGetUTCMonth,
  formatEventDate,
} from '@/utils/dateUtils'
import { getTagPalette } from '@/utils/constants'

const EMPTY_PHOTOS = []
const CARD_SPACING = 220
const PADDING = 60
const STRIP_Y = 220

function getEventColor(event) {
  const tag = event.tags?.[0]
  if (!tag) return { dot: '#2563EB', light: '#EFF6FF', stroke: '#93C5FD' }
  const p = getTagPalette(tag)
  return { dot: p.activeBg, light: p.bg, stroke: p.border }
}

// Polaroid-style photo card
const FilmCard = memo(function FilmCard({ event, x, rotation, editable, onEdit, onSelect, isSelected, index }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const photos = useResolvedPhotos(event.photos || EMPTY_PHOTOS).filter((p) => p.url)
  const heroPhoto = photos[0]
  const color = getEventColor(event)

  const handleClick = (e) => {
    if (window.getSelection()?.toString()) return
    if (e.target.closest('[data-photo-click]')) return
    onSelect?.(event.id)
  }

  const handleDoubleClick = () => {
    if (editable && onEdit) onEdit(event)
  }

  return (
    <>
      <div
        className={`absolute transition-all duration-500 timeline-card-enter ${isSelected ? 'z-30' : 'z-10'}`}
        style={{
          left: x - 85,
          top: heroPhoto ? STRIP_Y - 160 : STRIP_Y - 100,
          width: 170,
          transform: `rotate(${isSelected ? 0 : rotation}deg) ${isSelected ? 'scale(1.1) translateY(-12px)' : ''}`,
          animationDelay: `${index * 60}ms`,
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Polaroid frame */}
        <div
          className={`rounded-lg overflow-hidden bg-white cursor-pointer transition-all duration-300 ${
            isSelected
              ? 'shadow-2xl ring-2'
              : 'shadow-lg hover:shadow-xl hover:-translate-y-1'
          }`}
          style={{
            padding: '6px 6px 46px 6px',
            ...(isSelected ? { ringColor: color.dot, borderColor: color.dot } : {}),
          }}
        >
          {heroPhoto ? (
            <div className="relative" data-photo-click>
              <img
                src={heroPhoto.url}
                alt={heroPhoto.name}
                loading="lazy"
                decoding="async"
                className="w-full h-[140px] object-cover rounded-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(0)
                }}
              />
              {photos.length > 1 && (
                <div className="absolute bottom-1.5 right-1.5 rounded-full bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-medium text-white">
                  +{photos.length - 1}
                </div>
              )}
            </div>
          ) : (
            <div
              className="w-full h-[140px] rounded-sm flex flex-col items-center justify-center gap-2 px-4"
              style={{ backgroundColor: `${color.light}` }}
            >
              <h3
                className="text-[11px] font-bold leading-tight text-center line-clamp-3"
                style={{ color: color.dot }}
                title={event.title}
              >
                {event.title}
              </h3>
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color.dot, opacity: 0.5 }}
              />
            </div>
          )}

          {/* Caption area (in the polaroid white space) */}
          <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5 pt-0.5" style={{ minHeight: 32 }}>
            <h3
              className="text-[10px] font-bold text-gray-900 leading-tight line-clamp-2"
              title={event.title}
            >
              {event.title}
            </h3>
            <span className="text-[8px] text-gray-400 font-medium uppercase tracking-wider block mt-0.5">
              {formatEventDate(event)}
            </span>
          </div>
        </div>

        {/* Tape effect on top */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 rounded-sm opacity-40"
          style={{
            background: 'linear-gradient(135deg, rgba(245,230,180,0.9), rgba(230,210,150,0.7))',
            transform: `translateX(-50%) rotate(${-rotation * 0.5}deg)`,
          }}
        />
      </div>

      {/* Expanded detail when selected */}
      {isSelected && (
        <div
          className="absolute z-40 transition-all duration-300"
          style={{
            left: x - 130,
            top: STRIP_Y + 40,
            width: 260,
          }}
        >
          <div className="rounded-xl bg-white/95 backdrop-blur-lg border border-gray-200/60 shadow-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: color.dot }}
              >
                {formatEventDate(event)}
              </span>
              {event.location && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                  <MapPin size={8} />
                  <span className="truncate max-w-[100px]">{event.location}</span>
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">{event.title}</h3>
            {event.description && (
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-2">
                {event.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {event.people?.map((person) => (
                <Badge key={person} variant="accent" small>
                  {person}
                </Badge>
              ))}
              {event.tags?.map((tag) => (
                <Badge key={tag} variant={tag} small>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

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

const HorizontalFilmStrip = memo(function HorizontalFilmStrip({ events, editable = false, onEditEvent }) {
  const containerRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, scrollLeft: 0, moved: false })
  const darkMode = useTimelineStore((s) => s.darkMode)

  const { sorted, minYear, maxYear, totalWidth } = useMemo(() => {
    if (events.length === 0) return { sorted: [], minYear: 2000, maxYear: 2000, totalWidth: 600 }
    const sorted = [...events].sort((a, b) => safeDateCompare(a.dateStart, b.dateStart))
    const totalWidth = Math.max(sorted.length * CARD_SPACING + PADDING * 2, 600)
    const years = sorted.map((e) => safeGetUTCYear(e.dateStart, 2000))
    return {
      sorted,
      minYear: Math.min(...years),
      maxYear: Math.max(...years),
      totalWidth,
    }
  }, [events])

  // Evenly space cards along the strip
  const cardPositions = useMemo(() => {
    const rotations = [-2.5, 1.8, -1.2, 3, -0.5, 2.2, -3, 1]
    return sorted.map((event, i) => ({
      event,
      x: PADDING + i * CARD_SPACING + CARD_SPACING / 2,
      rotation: rotations[i % rotations.length],
      color: getEventColor(event),
    }))
  }, [sorted])

  const svgHeight = 480

  // Drag-to-scroll
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.z-30') || e.target.closest('.z-20')) return
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

  const handleSelect = useCallback((id) => {
    if (dragRef.current.moved) return
    setSelectedId((prev) => (prev === id ? null : id))
  }, [])

  // Close on Escape or outside click
  useEffect(() => {
    if (!selectedId) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    const handleClick = (e) => {
      if (!e.target.closest('.z-30') && !e.target.closest('.z-20') && !e.target.closest('.z-10')) {
        setSelectedId(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [selectedId])

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto cursor-grab active:cursor-grabbing relative rounded-xl border border-gray-200 bg-surface"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="relative" style={{ width: totalWidth, minHeight: svgHeight }}>
        {/* Film strip background */}
        <svg width={totalWidth} height={svgHeight} className="select-none">
          {/* Sprocket holes — film strip effect */}
          <defs>
            <pattern id="film-holes" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
              <rect x="14" y="4" width="12" height="12" rx="2" fill={darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'} />
            </pattern>
          </defs>

          {/* Top film edge */}
          <rect x={0} y={STRIP_Y - 8} width={totalWidth} height={16} fill={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} rx={2} />
          <rect x={0} y={STRIP_Y - 6} width={totalWidth} height={12} fill="url(#film-holes)" />

          {/* Main timeline line */}
          <line
            x1={PADDING - 20}
            y1={STRIP_Y}
            x2={totalWidth - PADDING + 20}
            y2={STRIP_Y}
            stroke="var(--color-gray-300)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />

          {/* Year markers along the strip */}
          {cardPositions.map(({ event, x }) => {
            const year = safeGetUTCYear(event.dateStart, 2000)
            return (
              <g key={`marker-${event.id}`}>
                <circle
                  cx={x}
                  cy={STRIP_Y}
                  r={3}
                  fill="var(--color-gray-300)"
                />
              </g>
            )
          })}

          {/* Year labels below strip */}
          {(() => {
            const seenYears = new Set()
            return cardPositions.map(({ event, x }) => {
              const year = safeGetUTCYear(event.dateStart, 2000)
              if (seenYears.has(year)) return null
              seenYears.add(year)
              return (
                <text
                  key={`year-${year}`}
                  x={x}
                  y={STRIP_Y + 28}
                  className="text-[11px] font-bold"
                  fill="var(--color-gray-400)"
                  textAnchor="middle"
                >
                  {year}
                </text>
              )
            })
          })()}
        </svg>

        {/* Polaroid cards */}
        {cardPositions.map(({ event, x, rotation }, i) => (
          <FilmCard
            key={event.id}
            event={event}
            x={x}
            rotation={rotation}
            editable={editable}
            onEdit={onEditEvent}
            onSelect={handleSelect}
            isSelected={selectedId === event.id}
            index={i}
          />
        ))}
      </div>
    </div>
  )
})

export default HorizontalFilmStrip
