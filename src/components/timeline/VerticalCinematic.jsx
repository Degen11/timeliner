import { MapPin } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import PhotoStrip from '@/components/shared/PhotoStrip'
import useEventCard from '@/hooks/useEventCard'
import renderLightbox from '@/hooks/useLightbox'
import useScrollReveal from '@/hooks/useScrollReveal'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import { formatEventDate } from '@/utils/dateUtils'
import { CARD_STYLE } from '@/utils/constants'

function CinematicCard({ event, side, editable, onEdit, index }) {
  const {
    photos, heroPhoto, accentColor,
    lightboxIndex, setLightboxIndex, handleClick,
  } = useEventCard(event, { editable, onEdit })
  const { ref, revealed } = useScrollReveal()

  return (
    <div
      ref={ref}
      className={`relative flex items-start gap-0 ${side === 'left' ? 'flex-row' : 'flex-row-reverse'} scroll-reveal-card ${revealed ? 'revealed' : ''}`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      {/* Card */}
      <div
        className="group w-[calc(50%-28px)] cursor-pointer"
        onClick={handleClick}
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
      >
        <div className={`relative overflow-hidden ${CARD_STYLE.base} ${CARD_STYLE.transition} hover:shadow-xl hover:-translate-y-1`}>
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
              <PhotoStrip
                photos={photos}
                onPhotoClick={setLightboxIndex}
                maxVisible={3}
                size="sm"
                className="absolute top-3 right-3"
              />
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
          className={`w-4 h-4 rounded-full ring-[3px] ring-canvas z-10 shadow-md scroll-reveal-dot ${revealed ? 'revealed' : ''}`}
          style={{
            backgroundColor: accentColor,
            transitionDelay: `${index * 60 + 80}ms`,
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

      {renderLightbox({ photos, lightboxIndex, setLightboxIndex })}
    </div>
  )
}

function CinematicSpine() {
  const { ref, revealed } = useScrollReveal({ threshold: 0.02 })
  return (
    <div
      ref={ref}
      className={`absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent -translate-x-1/2 ${revealed ? 'cinematic-spine-revealed' : ''}`}
      style={{ opacity: revealed ? 1 : 0, transition: 'opacity 0.3s ease' }}
    />
  )
}

function VerticalCinematic({
  events,
  editable = false,
  groupZoom = 'year',
  onEditEvent,
}) {
  const groups = groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events)

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Center spine — animated draw */}
      <CinematicSpine />

      <div className="flex flex-col gap-0">
        {groups.map(({ year, events: yearEvents }) => (
          <div key={year} className="relative pb-2">
            {/* Year marker on spine — sticky */}
            <div className="sticky top-14 z-10 flex justify-center -mx-4 px-4 mb-4 py-1 pointer-events-none" style={{ backgroundColor: 'var(--color-canvas)' }}>
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
}

export default VerticalCinematic
