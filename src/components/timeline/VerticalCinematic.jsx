import { memo, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, AlertTriangle } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import { formatEventDate } from '@/utils/dateUtils'
import { getTagPalette } from '@/utils/constants'
import { useResolvedPhotos } from './PhotoPreview'
import PhotoLightbox from '@/components/shared/PhotoLightbox'

const EMPTY_PHOTOS = []

const CinematicCard = memo(function CinematicCard({ event, side, editable, onEdit, index }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const photos = useResolvedPhotos(event.photos || EMPTY_PHOTOS).filter((p) => p.url)
  const heroPhoto = photos[0]
  const palette = event.tags?.[0] ? getTagPalette(event.tags[0]) : null
  const accentColor = palette?.activeBg || '#2563EB'

  const handleClick = (e) => {
    if (window.getSelection()?.toString()) return
    if (e.target.closest('[data-photo-click]')) return
    if (editable && onEdit) onEdit(event)
  }

  return (
    <div
      className={`relative flex items-start gap-0 ${side === 'left' ? 'flex-row' : 'flex-row-reverse'} timeline-card-enter`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Card */}
      <div
        className="group w-[calc(50%-28px)] cursor-pointer"
        onClick={handleClick}
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
      >
        <div className="relative rounded-2xl overflow-hidden bg-white/70 backdrop-blur-md border border-gray-200/60 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
          {/* Hero photo */}
          {heroPhoto ? (
            <div className="relative">
              <img
                src={heroPhoto.url}
                alt={heroPhoto.name}
                loading="lazy"
                decoding="async"
                className="w-full h-48 sm:h-56 object-cover cursor-pointer"
                data-photo-click
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(0)
                }}
              />
              {/* Gradient overlay for text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
              {/* Date badge on photo */}
              <div className="absolute top-3 left-3">
                <span
                  className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold text-white/95 backdrop-blur-md uppercase tracking-wider"
                  style={{ backgroundColor: `${accentColor}cc` }}
                >
                  {formatEventDate(event)}
                </span>
              </div>
              {/* Title overlaid on photo */}
              <div className="absolute bottom-0 left-0 right-0 p-4 pb-3 pointer-events-none">
                <h3 className="text-base font-bold text-white leading-snug drop-shadow-sm">
                  {event.title}
                </h3>
              </div>
              {/* Photo strip */}
              {photos.length > 1 && (
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {photos.slice(1, 4).map((p, i) => (
                    <img
                      key={p.name}
                      src={p.url}
                      alt={p.name}
                      data-photo-click
                      className="w-8 h-8 rounded-md object-cover border-2 border-white/70 shadow-md cursor-pointer hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLightboxIndex(i + 1)
                      }}
                    />
                  ))}
                  {photos.length > 4 && (
                    <div
                      data-photo-click
                      className="w-8 h-8 rounded-md bg-black/50 backdrop-blur-sm border-2 border-white/70 flex items-center justify-center text-[9px] font-bold text-white cursor-pointer hover:bg-black/60 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLightboxIndex(4)
                      }}
                    >
                      +{photos.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 pb-3">
              <span
                className="inline-flex text-[11px] font-bold uppercase tracking-wider mb-2"
                style={{ color: accentColor }}
              >
                {formatEventDate(event)}
              </span>
              <h3 className="text-base font-bold text-gray-900 leading-snug">{event.title}</h3>
            </div>
          )}

          {/* Body content */}
          <div className={`px-5 ${heroPhoto ? 'pt-3' : 'pt-1'} pb-4`}>
            {event.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">
                {event.description}
              </p>
            )}
            {event.location && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2.5">
                <MapPin size={11} className="text-gray-400 shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
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

          {/* Accent stripe */}
          <div
            className="absolute top-0 h-full w-1 rounded-full"
            style={{
              backgroundColor: accentColor,
              [side === 'left' ? 'right' : 'left']: 0,
              opacity: 0.7,
            }}
          />
        </div>
      </div>

      {/* Center connector area */}
      <div className="relative flex flex-col items-center w-14 shrink-0 pt-5">
        {/* Dot */}
        <div
          className="w-4 h-4 rounded-full ring-[3px] ring-canvas z-10 shadow-md timeline-dot-enter"
          style={{
            backgroundColor: accentColor,
            animationDelay: `${index * 60 + 80}ms`,
          }}
        />
        {/* Connector line to card */}
        <div
          className={`absolute top-[28px] h-px w-[calc(50%-8px)] ${side === 'left' ? 'right-0' : 'left-0'}`}
          style={{ backgroundColor: `${accentColor}40` }}
        />
      </div>

      {/* Spacer for the other side */}
      <div className="w-[calc(50%-28px)]" />

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

const VerticalCinematic = memo(function VerticalCinematic({
  events,
  editable = false,
  groupZoom = 'year',
  onEditEvent,
}) {
  const groups = useMemo(
    () => (groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events)),
    [events, groupZoom]
  )

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Center spine */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent -translate-x-1/2" />

      <div className="flex flex-col gap-0">
        {groups.map(({ year, events: yearEvents }) => (
          <div key={year} className="relative pb-2">
            {/* Year marker on spine — sticky */}
            <div className="sticky top-14 z-10 flex justify-center -mx-4 px-4 mb-4 py-1 pointer-events-none backdrop-blur-md" style={{ backgroundColor: 'color-mix(in srgb, var(--color-canvas) 85%, transparent)' }}>
              <div className="pointer-events-auto">
                <h2 className="font-display text-base font-bold text-text-strong tracking-wide py-1.5">
                  {year}
                </h2>
              </div>
            </div>

            {/* Events alternating sides */}
            <div className="flex flex-col gap-8">
              {yearEvents.map((event, i) => (
                <CinematicCard
                  key={event.id}
                  event={event}
                  side={i % 2 === 0 ? 'left' : 'right'}
                  editable={editable}
                  onEdit={onEditEvent}
                  index={i}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

export default VerticalCinematic
