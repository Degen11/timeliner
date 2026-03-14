import { memo, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import useCardClick from '@/hooks/useCardClick'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import { formatEventDate } from '@/utils/dateUtils'
import { getTagPalette } from '@/utils/constants'
import { useResolvedPhotos } from './PhotoPreview'
import PhotoLightbox from '@/components/shared/PhotoLightbox'
import useTimelineStore from '@/store/useTimelineStore'

const EMPTY_PHOTOS = []

const NarrativeCard = memo(function NarrativeCard({ event, side, editable, onEdit, index, isLast }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const photos = useResolvedPhotos(event.photos || EMPTY_PHOTOS).filter((p) => p.url)
  const heroPhoto = photos[0]
  const darkMode = useTimelineStore((s) => s.darkMode)
  const palette = event.tags?.[0] ? getTagPalette(event.tags[0]) : null
  const accentColor = palette?.activeBg || '#2563EB'
  const lightColor = darkMode
    ? (palette?.darkBg || 'rgba(59,130,246,0.20)')
    : (palette?.bg || '#EFF6FF')
  const cardTextColor = darkMode ? (palette?.darkText || '#93C5FD') : undefined
  const cardBorderColor = darkMode ? (palette?.darkBorder || 'rgba(96,165,250,0.45)') : `${accentColor}25`

  const { handleClick } = useCardClick(event, { editable, onEdit })

  // Offset creates visual rhythm — cards are slightly offset from center
  const offsetClass = side === 'left' ? 'mr-auto pr-8 sm:pr-16' : 'ml-auto pl-8 sm:pl-16'

  return (
    <div
      className="relative timeline-card-enter"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {/* Vertical progress line segment */}
      <div className="absolute left-6 top-0 bottom-0 flex flex-col items-center">
        {/* Top line */}
        <div
          className="w-px flex-1"
          style={{ background: `linear-gradient(to bottom, ${index === 0 ? 'transparent' : 'var(--color-gray-200)'}, ${accentColor}40)` }}
        />
        {/* Dot */}
        <div className="relative shrink-0 my-1">
          <div
            className="w-3.5 h-3.5 rounded-full ring-[3px] ring-canvas z-10 timeline-dot-enter"
            style={{
              backgroundColor: accentColor,
              animationDelay: `${index * 70 + 100}ms`,
            }}
          />
        </div>
        {/* Bottom line */}
        <div
          className="w-px flex-1"
          style={{ background: `linear-gradient(to bottom, ${accentColor}40, ${isLast ? 'transparent' : 'var(--color-gray-200)'})` }}
        />
      </div>

      {/* Card with offset */}
      <div className={`pl-16 ${offsetClass} max-w-2xl`}>
        <div
          className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-0.5 cursor-pointer"
          onClick={handleClick}
          role={editable ? 'button' : undefined}
          tabIndex={editable ? 0 : undefined}
        >
          {/* Photo + content layout */}
          {heroPhoto ? (
            <div className="relative">
              {/* Photo with rounded corners and shadow */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg shadow-black/8">
                <img
                  src={heroPhoto.url}
                  alt={heroPhoto.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-44 sm:h-52 object-cover cursor-pointer"
                  data-photo-click
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightboxIndex(0)
                  }}
                />
                {/* Subtle vignette */}
                <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.08)] pointer-events-none" />
                {/* Additional photos strip */}
                {photos.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-6 bg-gradient-to-t from-black/40 to-transparent flex gap-1.5 items-end">
                    {photos.slice(1, 5).map((p, i) => (
                      <img
                        key={p.name}
                        src={p.url}
                        alt={p.name}
                        data-photo-click
                        className="w-9 h-9 rounded-md object-cover border-2 border-white/90 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation()
                          setLightboxIndex(i + 1)
                        }}
                      />
                    ))}
                    {photos.length > 5 && (
                      <div
                        data-photo-click
                        className="w-9 h-9 rounded-md bg-black/50 backdrop-blur-sm border-2 border-white/90 flex items-center justify-center text-[9px] font-bold text-white cursor-pointer hover:bg-black/60 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setLightboxIndex(5)
                        }}
                      >
                        +{photos.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content card slightly overlapping the photo */}
              <div
                className="relative -mt-6 mx-3 rounded-xl p-4 border backdrop-blur-md shadow-sm"
                style={{
                  backgroundColor: darkMode ? lightColor : `${lightColor}ee`,
                  borderColor: cardBorderColor,
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: darkMode ? cardTextColor : accentColor }}
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
                <h3 className="text-sm font-bold text-text-strong leading-snug mb-1">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-2">
                    {event.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-1">
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
          ) : (
            /* No-photo card */
            <div
              className="rounded-xl p-5 border backdrop-blur-md shadow-sm"
              style={{
                backgroundColor: darkMode ? lightColor : `${lightColor}cc`,
                borderColor: darkMode ? cardBorderColor : `${accentColor}20`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: darkMode ? cardTextColor : accentColor }}
                />
                <span
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: darkMode ? cardTextColor : accentColor }}
                >
                  {formatEventDate(event)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-text-strong mb-1">{event.title}</h3>
              {event.description && (
                <p className="text-xs text-text-muted leading-relaxed line-clamp-3 mb-2">
                  {event.description}
                </p>
              )}
              {event.location && (
                <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2">
                  <MapPin size={9} className="shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1">
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
          )}
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
    </div>
  )
})

const VerticalNarrative = memo(function VerticalNarrative({
  events,
  editable = false,
  groupZoom = 'year',
  onEditEvent,
}) {
  const groups = useMemo(
    () => (groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events)),
    [events, groupZoom]
  )

  // Pattern for side alternation: left, right, left-wide, right, left, right-wide...
  let globalIdx = 0

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="flex flex-col gap-0">
        {groups.map(({ year, events: yearEvents }) => (
          <div key={year} className="relative pb-2">
            {/* Year marker — sticky */}
            <div className="sticky top-14 z-10 -mx-4 px-4 py-1 mb-4 pointer-events-none" style={{ backgroundColor: 'var(--color-canvas)' }}>
              <div className="pointer-events-auto relative inline-flex items-center gap-3 pl-16 py-1.5">
                <div className="absolute left-[18px] w-6 h-6 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-sm bg-secondary" />
                </div>
                <h2 className="font-display text-2xl font-black text-text-strong/80 tracking-tight">
                  {year}
                </h2>
                <span className="text-[11px] font-medium text-text-muted">
                  {yearEvents.length} event{yearEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Events */}
            <div className="flex flex-col gap-6">
              {yearEvents.map((event, i) => {
                const side = globalIdx % 2 === 0 ? 'left' : 'right'
                globalIdx++
                return (
                  <NarrativeCard
                    key={event.id}
                    event={event}
                    side={side}
                    editable={editable}
                    onEdit={onEditEvent}
                    index={i}
                    isLast={i === yearEvents.length - 1}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

export default VerticalNarrative
