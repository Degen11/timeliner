import { useState, memo } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, MapPin, Pencil } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import { formatEventDate, formatEventDateShort } from '@/utils/dateUtils'
import PhotoLightbox from '@/components/shared/PhotoLightbox'
import { useResolvedPhotos, PhotoPreview, CompactPhotoPreview } from './PhotoPreview'

const EMPTY_PHOTOS = []

const EventCard = memo(function EventCard({ event, compact = false, editable = false, isSelected = false, isDragOver = false, onEdit }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const lightboxPhotos = useResolvedPhotos(event.photos || EMPTY_PHOTOS).filter((p) => p.url)

  const selectedCls = isSelected ? ' border-secondary/40 bg-secondary/[0.03]' : ''
  const dragOverCls = isDragOver ? ' ring-[3px] ring-secondary shadow-lg shadow-secondary/15 scale-[1.02] border-secondary/40 bg-secondary/[0.02]' : ''
  const cardCls = compact
    ? `group rounded-xl bg-white/70 backdrop-blur-md border border-gray-200/60 px-4 py-2.5 shadow-sm transition-all duration-300 hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5${selectedCls}${dragOverCls}`
    : `group rounded-xl bg-white/70 backdrop-blur-md border border-gray-200/60 px-6 py-5 shadow-sm transition-all duration-300 hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5${selectedCls}${dragOverCls}`

  const handleCardClick = (e) => {
    if (window.getSelection()?.toString()) return
    if (e.target.closest('[data-no-edit]')) return
    if (editable && onEdit) onEdit(event)
  }

  return (
    <div className={cardCls} onClick={handleCardClick} role={editable ? 'button' : undefined} tabIndex={editable ? 0 : undefined} style={editable ? { cursor: 'pointer' } : undefined}>
      <div
        className={`flex justify-between ${compact ? 'items-center gap-2' : 'items-start gap-3'}`}
      >
        <div className="flex-1 min-w-0">
          {compact ? (
            <div className="flex items-center gap-2">
              {(() => {
                const shortDate = formatEventDateShort(event)
                if (!shortDate) return null
                return (
                  <span className="text-sm font-semibold text-secondary tracking-wide uppercase whitespace-nowrap shrink-0">
                    {shortDate}
                  </span>
                )
              })()}
              <h3 className="text-sm font-semibold text-gray-900 truncate" title={event.title}>
                {event.title}
              </h3>
              {event.flagged && <AlertTriangle size={11} className="text-flag flex-shrink-0" />}
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
              {event.location && (
                <span className="flex items-center gap-0.5 text-[11px] text-gray-400 truncate max-w-[120px]" title={event.location}>
                  <MapPin size={10} className="shrink-0" />
                  {event.location}
                </span>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-semibold text-secondary tracking-wide uppercase">
                  {formatEventDate(event)}
                </span>
                {event.flagged && (
                  <span
                    className="flex items-center gap-1 text-xs text-flag"
                    title={event.flagReason}
                  >
                    <AlertTriangle size={12} />
                    <span className="hidden sm:inline">Flagged</span>
                  </span>
                )}
              </div>

              <h3 className="text-sm font-semibold text-gray-900 mb-1">{event.title}</h3>
              {event.description && (
                <p className="text-sm text-gray-600 leading-relaxed mb-2.5">
                  {event.description}
                </p>
              )}

              {event.location && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <MapPin size={11} className="text-gray-400 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                {event.people?.map((person) => (
                  <Badge key={person} variant="accent">
                    {person}
                  </Badge>
                ))}
                {(() => {
                  const tags = event.tags || []
                  const MAX_VISIBLE = 6
                  const visible = tags.length > MAX_VISIBLE ? tags.slice(0, MAX_VISIBLE - 1) : tags
                  const overflow = tags.length > MAX_VISIBLE ? tags.length - (MAX_VISIBLE - 1) : 0
                  return (
                    <>
                      {visible.map((tag) => (
                        <Badge key={tag} variant={tag}>
                          {tag}
                        </Badge>
                      ))}
                      {overflow > 0 && (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border tracking-wide leading-none"
                          style={{
                            backgroundColor: '#F5F5F4',
                            color: '#292524',
                            borderColor: '#D6D3D1',
                          }}
                          title={tags.slice(MAX_VISIBLE - 1).join(', ')}
                        >
                          +{overflow}
                        </span>
                      )}
                    </>
                  )
                })()}
              </div>
            </>
          )}
        </div>

        <div className={`flex ${compact ? 'items-center' : 'flex-col items-end'} gap-2`}>
          {compact && event.photos?.length > 0 && (
            <div data-no-edit>
              <CompactPhotoPreview
                filenames={event.photos}
                onOpenLightbox={(i) => setLightboxIndex(i)}
              />
            </div>
          )}

          {editable && !compact && (
            <div className="opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(event)
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:text-secondary hover:bg-soft-accent transition-colors cursor-pointer"
                title="Edit event"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {!compact && event.photos?.length > 0 && (
        <div data-no-edit>
          <PhotoPreview
            filenames={event.photos}
            onOpenLightbox={(i) => setLightboxIndex(i)}
            editable={false}
            eventId={event.id}
          />
        </div>
      )}

      {lightboxIndex !== null &&
        lightboxPhotos.length > 0 &&
        createPortal(
          <PhotoLightbox
            photos={lightboxPhotos}
            currentIndex={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />,
          document.body
        )}
    </div>
  )
})

export default EventCard
