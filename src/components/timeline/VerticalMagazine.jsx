import { MapPin } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import PhotoStrip from '@/components/shared/PhotoStrip'
import useEventCard from '@/hooks/useEventCard'
import renderLightbox from '@/hooks/useLightbox'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import { formatEventDate } from '@/utils/dateUtils'
import { CARD_STYLE } from '@/utils/constants'

const stickyBgStyle = { backgroundColor: 'var(--color-canvas)' }
// Featured card — large, photo-dominant, spans wider
function FeaturedCard({ event, editable, onEdit, index }) {
  const {
    photos, heroPhoto, accentColor,
    lightboxIndex, setLightboxIndex, handleClick,
  } = useEventCard(event, { editable, onEdit })

  return (
    <div
      className="col-span-2 group timeline-card-enter"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={`relative overflow-hidden ${CARD_STYLE.base} ${CARD_STYLE.transition} hover:shadow-2xl hover:-translate-y-1 cursor-pointer dark:text-white`}
        onClick={handleClick}
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
      >
        {heroPhoto ? (
          <div className="flex flex-col sm:flex-row">
            {/* Large photo */}
            <div className="relative sm:w-1/2 shrink-0">
              <img
                src={heroPhoto.url}
                alt={heroPhoto.name}
                loading="lazy"
                decoding="async"
                className="w-full h-56 sm:h-72 object-cover cursor-pointer"
                data-photo-click
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex(0)
                }}
              />
              {/* Photo strip at bottom of the image */}
              <PhotoStrip
                photos={photos}
                onPhotoClick={setLightboxIndex}
                maxVisible={4}
                size="lg"
                className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8 bg-gradient-to-t from-black/50 to-transparent items-end"
              />
            </div>
            {/* Content */}
            <div className="flex-1 p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: accentColor }}
                >
                  {formatEventDate(event)}
                </span>
                {event.location && (
                  <>
                    <span className="text-gray-300 dark:text-gray-500">|</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-400">
                      <MapPin size={10} />
                      {event.location}
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 line-clamp-4">
                  {event.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-auto">
                {event.people?.map((person) => (
                  <Badge key={person} variant="accent">
                    {person}
                  </Badge>
                ))}
                {event.tags?.map((tag) => (
                  <Badge key={tag} variant={tag}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-1.5 h-8 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                {formatEventDate(event)}
              </span>
            </div>
            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 line-clamp-3">
                {event.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {event.people?.map((person) => (
                <Badge key={person} variant="accent">
                  {person}
                </Badge>
              ))}
              {event.tags?.map((tag) => (
                <Badge key={tag} variant={tag}>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {renderLightbox({ photos, lightboxIndex, setLightboxIndex })}
    </div>
  )
}

// Standard card — single column, more compact
function StandardCard({ event, editable, onEdit, index }) {
  const {
    photos, heroPhoto, accentColor,
    lightboxIndex, setLightboxIndex, handleClick,
  } = useEventCard(event, { editable, onEdit })

  return (
    <div
      className="group timeline-card-enter"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={`relative overflow-hidden ${CARD_STYLE.base} ${CARD_STYLE.transition} hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full dark:text-white`}
        onClick={handleClick}
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
      >
        {heroPhoto && (
          <div className="relative">
            <img
              src={heroPhoto.url}
              alt={heroPhoto.name}
              loading="lazy"
              decoding="async"
              className="w-full h-36 object-cover cursor-pointer"
              data-photo-click
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex(0)
              }}
            />
            <PhotoStrip
              photos={photos}
              onPhotoClick={setLightboxIndex}
              maxVisible={3}
              size="sm"
              className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-6 bg-gradient-to-t from-black/40 to-transparent items-end"
            />
          </div>
        )}
        <div className="p-4">
          <span
            className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
            style={{ color: accentColor }}
          >
            {formatEventDate(event)}
          </span>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 leading-snug">{event.title}</h3>
          {event.description && (
            <p className="text-xs text-gray-500 dark:text-gray-300 leading-relaxed mb-2 line-clamp-2">
              {event.description}
            </p>
          )}
          {event.location && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-400 mb-2">
              <MapPin size={9} className="shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1">
            {event.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant={tag} small>
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        {/* Accent top bar */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: accentColor, opacity: 0.6 }}
        />
      </div>

      {renderLightbox({ photos, lightboxIndex, setLightboxIndex })}
    </div>
  )
}

function VerticalMagazine({
  events,
  editable = false,
  groupZoom = 'year',
  onEditEvent,
}) {
  const groups = groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-0">
        {groups.map(({ year, events: yearEvents }) => {
          // First event with a photo gets featured treatment
          const featuredIdx = yearEvents.findIndex((e) => e.photos?.length > 0)
          const featured = featuredIdx !== -1 ? yearEvents[featuredIdx] : null
          const rest = yearEvents.filter((_, i) => i !== featuredIdx)

          return (
            <div key={year} className="relative pb-6">
              {/* Year header — editorial style, sticky */}
              <div className="sticky top-14 z-10 -mx-4 px-4 py-1 mb-4 pointer-events-none" style={stickyBgStyle}>
                <div className="pointer-events-auto inline-flex items-end gap-4">
                  <h2 className="font-display text-4xl sm:text-5xl font-black text-text-strong leading-none tracking-tight select-none">
                    {year}
                  </h2>
                  <div className="flex items-center gap-2 pb-1.5">
                    <div className="w-8 h-0.5 bg-text-muted/40 rounded-full" />
                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                      {yearEvents.length} event{yearEvents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Masonry-like grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                {featured && (
                  <FeaturedCard
                    event={featured}
                    editable={editable}
                    onEdit={onEditEvent}
                    index={0}
                  />
                )}
                {rest.map((event, i) => (
                  <StandardCard
                    key={event.id}
                    event={event}
                    editable={editable}
                    onEdit={onEditEvent}
                    index={i + 1}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VerticalMagazine
