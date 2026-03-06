import { useState, memo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Trash2, X, ImagePlus } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import { formatEventDate, formatEventDateShort, formatSingleDate } from '@/utils/dateUtils'
import DatePicker from '@/components/shared/DatePicker'
import PhotoLightbox from '@/components/shared/PhotoLightbox'
import useTimelineStore from '@/store/useTimelineStore'
import EventPhotoUploader from './EventPhotoUploader'
import InlineEditField from './InlineEditField'
import InlineTagEditor from './InlineTagEditor'
import InlinePersonAdder from './InlinePersonAdder'
import { useResolvedPhotos, PhotoPreview, CompactPhotoPreview } from './PhotoPreview'

const EMPTY_PHOTOS = []

const EventCard = memo(function EventCard({ event, compact = false, editable = false, isSelected = false, isDragOver = false }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false)
  const addPhotoBtnRef = useRef(null)
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const deleteEvent = useTimelineStore((s) => s.deleteEvent)

  const handleDelete = () => {
    if (confirmDelete) {
      deleteEvent(event.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const lightboxPhotos = useResolvedPhotos(event.photos || EMPTY_PHOTOS).filter((p) => p.url)

  const selectedCls = isSelected ? ' border-secondary/40 bg-secondary/[0.03]' : ''
  const dragOverCls = isDragOver ? ' ring-2 ring-secondary scale-[1.01]' : ''
  const cardCls = compact
    ? `group rounded-xl bg-white/70 backdrop-blur-md border border-gray-200/60 px-4 py-2.5 shadow-sm transition-all duration-300 hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5${selectedCls}${dragOverCls}`
    : `group rounded-xl bg-white/70 backdrop-blur-md border border-gray-200/60 px-6 py-5 shadow-sm transition-all duration-300 hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5${selectedCls}${dragOverCls}`

  return (
    <div className={cardCls}>
      <div
        className={`flex justify-between ${compact ? 'items-center gap-2' : 'items-start gap-3'}`}
      >
        <div className="flex-1 min-w-0">
          {compact ? (
            /* ---- Compact layout: single tight row, vertically centered ---- */
            <div className="flex items-center gap-2">
              {(() => {
                const shortDate = formatEventDateShort(event)
                if (!shortDate) return null
                return editable ? (
                  <DatePicker
                    value={event.dateStart || ''}
                    precision={event.datePrecision || 'day'}
                    onChange={(v, p) => updateEvent(event.id, { dateStart: v, datePrecision: p })}
                    renderTrigger={() => (
                      <span className="text-sm font-semibold text-secondary tracking-wide uppercase whitespace-nowrap hover:text-secondary-hover transition-colors">
                        {shortDate}
                      </span>
                    )}
                  />
                ) : (
                  <span className="text-sm font-semibold text-secondary tracking-wide uppercase whitespace-nowrap shrink-0">
                    {shortDate}
                  </span>
                )
              })()}
              {editable ? (
                <InlineEditField
                  value={event.title}
                  onSave={(v) => updateEvent(event.id, { title: v })}
                  className="text-sm font-semibold text-gray-900 truncate min-w-0"
                  placeholder="Untitled"
                />
              ) : (
                <h3 className="text-sm font-semibold text-gray-900 truncate" title={event.title}>
                  {event.title}
                </h3>
              )}
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
            </div>
          ) : (
            /* ---- Expanded layout ---- */
            <>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {editable ? (
                  <>
                    <DatePicker
                      value={event.dateStart || ''}
                      precision={event.datePrecision || 'day'}
                      onChange={(v, p) => updateEvent(event.id, { dateStart: v, datePrecision: p })}
                      renderTrigger={() => (
                        <span className="text-sm font-semibold text-secondary tracking-wide uppercase hover:text-secondary-hover transition-colors">
                          {formatSingleDate(event.dateStart, event.datePrecision)}
                        </span>
                      )}
                    />

                    {event.dateEnd ? (
                      <>
                        <span className="text-xs text-gray-400">&ndash;</span>
                        <DatePicker
                          value={event.dateEnd}
                          precision={event.datePrecision || 'day'}
                          onChange={(v) => updateEvent(event.id, { dateEnd: v })}
                          renderTrigger={() => (
                            <span className="text-sm font-semibold text-secondary tracking-wide uppercase hover:text-secondary-hover transition-colors">
                              {formatSingleDate(event.dateEnd, event.datePrecision)}
                            </span>
                          )}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateEvent(event.id, { dateEnd: null })
                          }}
                          className="rounded p-0.5 text-gray-300 hover:text-error hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove end date"
                        >
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <DatePicker
                        value=""
                        precision={event.datePrecision || 'day'}
                        onChange={(v) => updateEvent(event.id, { dateEnd: v })}
                        renderTrigger={() => (
                          <span className="text-[11px] text-gray-400 hover:text-secondary transition-colors">
                            + end date
                          </span>
                        )}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-sm font-semibold text-secondary tracking-wide uppercase">
                    {formatEventDate(event)}
                  </span>
                )}
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

              {editable ? (
                <>
                  <InlineEditField
                    value={event.title}
                    onSave={(v) => updateEvent(event.id, { title: v })}
                    className="block text-sm font-semibold text-gray-900 mb-1"
                    placeholder="Untitled"
                  />
                  <InlineEditField
                    value={event.description || ''}
                    onSave={(v) => updateEvent(event.id, { description: v })}
                    multiline
                    className="block text-sm text-gray-600 leading-relaxed mb-2.5"
                    placeholder="Add a description..."
                  />
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-2.5">
                      {event.description}
                    </p>
                  )}
                </>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                {event.people?.map((person) => (
                  <Badge
                    key={person}
                    variant="accent"
                    onRemove={
                      editable
                        ? () =>
                            updateEvent(event.id, {
                              people: event.people.filter((p) => p !== person),
                            })
                        : undefined
                    }
                  >
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
                        <Badge
                          key={tag}
                          variant={tag}
                          onRemove={
                            editable
                              ? () =>
                                  updateEvent(event.id, {
                                    tags: event.tags.filter((t) => t !== tag),
                                  })
                              : undefined
                          }
                        >
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
                {editable && (
                  <>
                    <InlinePersonAdder eventId={event.id} currentPeople={event.people} />
                    <InlineTagEditor eventId={event.id} currentTags={event.tags} />
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className={`flex ${compact ? 'items-center' : 'flex-col items-end'} gap-2`}>
          {compact && event.photos?.length > 0 && (
            <CompactPhotoPreview
              filenames={event.photos}
              onOpenLightbox={(i) => setLightboxIndex(i)}
            />
          )}

          {editable && !compact && (
            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                ref={addPhotoBtnRef}
                onClick={(e) => {
                  e.stopPropagation()
                  setPhotoUploaderOpen(true)
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:text-secondary hover:bg-soft-accent transition-colors cursor-pointer"
                title="Add photo"
              >
                <ImagePlus size={13} />
              </button>
              {confirmDelete ? (
                <button
                  onClick={handleDelete}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-error bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Confirm
                </button>
              ) : (
                <button
                  onClick={handleDelete}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-error hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete event"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}

          {editable && compact && (
            <button
              ref={addPhotoBtnRef}
              onClick={(e) => {
                e.stopPropagation()
                setPhotoUploaderOpen(true)
              }}
              className="rounded-md p-1 text-gray-300 hover:text-secondary hover:bg-soft-accent transition-colors cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
              title="Add photo"
            >
              <ImagePlus size={11} />
            </button>
          )}
        </div>
      </div>

      {!compact && event.photos?.length > 0 && (
        <PhotoPreview
          filenames={event.photos}
          onOpenLightbox={(i) => setLightboxIndex(i)}
          editable={editable}
          eventId={event.id}
        />
      )}

      {editable && (
        <EventPhotoUploader
          eventId={event.id}
          open={photoUploaderOpen}
          onClose={() => setPhotoUploaderOpen(false)}
          anchorRef={addPhotoBtnRef}
        />
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
