import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, MapPin, Pencil } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import { formatEventDate, formatEventDateShort } from '@/utils/dateUtils'
import { CARD_STYLE } from '@/utils/constants'
import PhotoLightbox from '@/components/shared/PhotoLightbox'
import { useResolvedPhotos } from '@/hooks/useResolvedPhotos'
import { PhotoPreview, CompactPhotoPreview } from './PhotoPreview'

const EMPTY_PHOTOS = []

function EventCard({ event, compact = false, editable = false, isSelected = false, onEdit }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const resolvedPhotos = useResolvedPhotos(event.photos || EMPTY_PHOTOS)
  const lightboxPhotos = resolvedPhotos.filter((p) => p.url)

  const selectedCls = isSelected ? ' border-secondary/40 bg-secondary/[0.03] selection-glow' : ''
  const cardCls = `group ${CARD_STYLE.base} ${CARD_STYLE.hover} ${CARD_STYLE.transition} ${compact ? 'px-3 py-2.5 sm:px-4' : 'px-4 py-4 sm:px-6 sm:py-5'} active:scale-[0.995] sm:active:scale-100${selectedCls}`

  const handleCardClick = (e) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) return
    if (window.getSelection()?.toString()) return
    if (e.target.closest('[data-no-edit]')) return
    if (editable && onEdit) onEdit(event)
  }

  return (
    <div className={cardCls} onClick={handleCardClick} role={editable ? 'button' : undefined} tabIndex={editable ? 0 : undefined} style={editable ? { cursor: 'pointer' } : undefined} data-event-card>
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
                  <span className="text-sm font-semibold text-secondary uppercase whitespace-nowrap shrink-0">
                    {shortDate}
                  </span>
                )
              })()}
              <h3 className="text-sm font-semibold text-text-strong truncate" title={event.title}>
                {event.title}
              </h3>
              {event.flagged && <AlertTriangle size={12} className="text-flag flex-shrink-0" />}
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
                <span className="flex items-center gap-0.5 text-xs text-text-muted truncate max-w-[120px]" title={event.location}>
                  <MapPin size={12} className="shrink-0" />
                  {event.location}
                </span>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-semibold text-secondary uppercase">
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

              <h3 className="text-sm font-semibold text-text-strong mb-1">{event.title}</h3>
              {event.description && (
                <p className="text-sm text-text-default leading-relaxed mb-2.5">
                  {event.description}
                </p>
              )}

              {event.location && (
                <div className="flex items-center gap-1 text-xs text-text-muted mb-2">
                  <MapPin size={12} className="text-text-muted shrink-0" />
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
                        <Badge variant="default">
                          +{overflow}
                        </Badge>
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
            <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(event)
                }}
                className="rounded-lg p-2.5 sm:p-1.5 text-text-muted hover:text-secondary hover:bg-soft-accent active:bg-soft-accent active:text-secondary sm:hover:scale-110 transition-all duration-150 cursor-pointer touch-target"
                title="Edit event"
              >
                <Pencil size={14} />
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
            editable={editable}
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
}

export default EventCard
