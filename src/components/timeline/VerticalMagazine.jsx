import { memo, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import { formatEventDate } from '@/utils/dateUtils'
import { getTagPalette } from '@/utils/constants'
import { useResolvedPhotos } from './PhotoPreview'
import PhotoLightbox from '@/components/shared/PhotoLightbox'

const EMPTY_PHOTOS = []
// Featured card — large, photo-dominant, spans wider
const FeaturedCard = memo(function FeaturedCard({ event, editable, onEdit, index }) {
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
      className="col-span-2 group timeline-card-enter"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className="relative rounded-2xl overflow-hidden bg-white/70 backdrop-blur-md border border-gray-200/60 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
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
              {photos.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8 bg-gradient-to-t from-black/50 to-transparent">
                  <div className="flex gap-2 items-end">
                    {photos.slice(1, 5).map((p, i) => (
                      <img
                        key={p.name}
                        src={p.url}
                        alt={p.name}
                        data-photo-click
                        className="w-12 h-12 rounded-lg object-cover border-2 border-white/80 shadow-md cursor-pointer hover:scale-110 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation()
                          setLightboxIndex(i + 1)
                        }}
                      />
                    ))}
                    {photos.length > 5 && (
                      <div
                        data-photo-click
                        className="w-12 h-12 rounded-lg bg-black/50 backdrop-blur-sm border-2 border-white/80 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:bg-black/60 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          setLightboxIndex(5)
                        }}
                      >
                        +{photos.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin size={10} />
                      {event.location}
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-xl font-display font-bold text-gray-900 mb-2 leading-tight">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-4">
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
            <h3 className="text-xl font-display font-bold text-gray-900 mb-2">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
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

// Standard card — single column, more compact
const StandardCard = memo(function StandardCard({ event, editable, onEdit, index }) {
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
      className="group timeline-card-enter"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className="relative rounded-2xl overflow-hidden bg-white/70 backdrop-blur-md border border-gray-200/60 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer h-full"
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
            {photos.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-6 bg-gradient-to-t from-black/40 to-transparent flex gap-1.5 items-end">
                {photos.slice(1, 4).map((p, i) => (
                  <img
                    key={p.name}
                    src={p.url}
                    alt={p.name}
                    data-photo-click
                    className="w-8 h-8 rounded-md object-cover border-2 border-white/80 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightboxIndex(i + 1)
                    }}
                  />
                ))}
                {photos.length > 4 && (
                  <div
                    data-photo-click
                    className="w-8 h-8 rounded-md bg-black/50 backdrop-blur-sm border-2 border-white/80 flex items-center justify-center text-[9px] font-bold text-white cursor-pointer hover:bg-black/60 transition-colors"
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
        )}
        <div className="p-4">
          <span
            className="text-[10px] font-bold uppercase tracking-widest block mb-1.5"
            style={{ color: accentColor }}
          >
            {formatEventDate(event)}
          </span>
          <h3 className="text-sm font-bold text-gray-900 mb-1 leading-snug">{event.title}</h3>
          {event.description && (
            <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">
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

const VerticalMagazine = memo(function VerticalMagazine({
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
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-14">
        {groups.map(({ year, events: yearEvents }) => {
          // First event with a photo gets featured treatment
          const featuredIdx = yearEvents.findIndex((e) => e.photos?.length > 0)
          const featured = featuredIdx !== -1 ? yearEvents[featuredIdx] : null
          const rest = yearEvents.filter((_, i) => i !== featuredIdx)

          return (
            <div key={year} className="relative pb-2">
              {/* Year header — editorial style, sticky */}
              <div className="sticky top-14 z-10 py-1 mb-6 pointer-events-none">
                <div className="pointer-events-auto inline-flex items-end gap-4 px-4 py-2 rounded-xl bg-canvas/90 backdrop-blur-md">
                  <h2 className="font-display text-4xl sm:text-5xl font-black text-primary dark:text-secondary/40 leading-none tracking-tight select-none">
                    {year}
                  </h2>
                  <div className="flex items-center gap-2 pb-1.5">
                    <div className="w-8 h-0.5 bg-secondary rounded-full" />
                    <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                      {yearEvents.length} event{yearEvents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Masonry-like grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
})

export default VerticalMagazine
