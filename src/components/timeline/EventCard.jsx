import { useState, useMemo, memo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Trash2, Check, X, Image } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import { formatEventDate, formatEventDateShort, formatSingleDate } from '@/utils/dateUtils'
import DatePicker from '@/components/shared/DatePicker'
import PhotoLightbox from '@/components/shared/PhotoLightbox'
import useTimelineStore from '@/store/useTimelineStore'

function InlineEditField({ value, onSave, multiline = false, placeholder, className: displayCls }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => { setDraft(value) }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current.select) inputRef.current.select()
      // Auto-resize textarea on open
      if (multiline && inputRef.current.tagName === 'TEXTAREA') {
        inputRef.current.style.height = 'auto'
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
      }
    }
  }, [editing, multiline])

  const handleSave = () => {
    onSave(draft)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') handleCancel()
  }

  const handleTextareaChange = (e) => {
    setDraft(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  if (!editing) {
    return (
      <span
        onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
        className={`${displayCls} cursor-text hover:bg-secondary/5 hover:rounded-md transition-colors block`}
        title="Double-click to edit"
      >
        {value || <span className="text-gray-300 italic">{placeholder || 'Empty'}</span>}
      </span>
    )
  }

  const cls = 'w-full min-w-0 rounded-lg border border-secondary bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20'

  return (
    <div className="w-full min-w-0" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start gap-1">
        {multiline ? (
          <textarea
            ref={inputRef}
            value={draft}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className={`${cls} resize-none overflow-hidden`}
            rows={1}
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cls}
            placeholder={placeholder}
          />
        )}
        <button
          onClick={handleSave}
          className="rounded-lg p-1 text-success hover:text-green-800 hover:bg-green-50 transition-colors cursor-pointer shrink-0"
          aria-label="Save"
        >
          <Check size={14} />
        </button>
        <button
          onClick={handleCancel}
          className="rounded-lg p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          aria-label="Cancel"
        >
          <X size={14} />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5 ml-0.5">Press Enter to save, Esc to cancel</p>
    </div>
  )
}

// Resolve photo URLs from photoMap (data URLs) or store.photos (blob URLs)
function useResolvedPhotos(filenames) {
  const photoMap = useTimelineStore((s) => s.photoMap)
  const storePhotos = useTimelineStore((s) => s.photos)

  return useMemo(
    () =>
      filenames.map((name) => {
        const dataUrl = photoMap[name]
        if (dataUrl) return { name, url: dataUrl }
        const match = storePhotos.find((p) => p.name === name)
        if (match?.objectUrl) return { name, url: match.objectUrl }
        return { name, url: null }
      }),
    [filenames, photoMap, storePhotos]
  )
}

const EMPTY_PHOTOS = []

function PhotoStack({ filenames, onOpen, small = false }) {
  const all = useResolvedPhotos(filenames)
  const resolved = all.filter((p) => p.url)

  const size = small ? 'h-10 w-10' : 'h-14 w-14'

  if (resolved.length === 0) {
    return (
      <div
        className={`${size} rounded-lg bg-gray-100 flex flex-col items-center justify-center text-xs text-gray-400`}
        title={`${filenames.length} photo${filenames.length !== 1 ? 's' : ''} (not loaded)`}
      >
        <Image size={small ? 12 : 16} />
        <span className="mt-0.5">{filenames.length}</span>
      </div>
    )
  }

  const first = resolved[0]
  const stacked = resolved.length > 1

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onOpen(0)
      }}
      className="relative flex-shrink-0 cursor-pointer group/photo"
      title={`${resolved.length} photo${resolved.length !== 1 ? 's' : ''} — click to view`}
    >
      {stacked && (
        <>
          <div className={`absolute top-1 left-1 ${size} rounded-lg bg-gray-200 border border-gray-300`} />
          {resolved.length > 2 && (
            <div className={`absolute top-0.5 left-0.5 ${size} rounded-lg bg-gray-300 border border-gray-400`} />
          )}
        </>
      )}

      <div className="relative rounded-lg overflow-hidden border border-gray-200 group-hover/photo:border-secondary transition-colors">
        <img
          src={first.url}
          alt={first.name}
          className={`${size} object-cover`}
        />
        {stacked && (
          <div className="absolute bottom-0 right-0 rounded-tl-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
            +{resolved.length - 1}
          </div>
        )}
      </div>
    </button>
  )
}

const EventCard = memo(function EventCard({ event, compact = false, editable = false }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
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

  const cardCls = compact
    ? 'group rounded-lg bg-white border border-gray-200 px-3 py-1.5 shadow-sm transition-all hover:shadow-md hover:border-gray-300'
    : 'group rounded-xl bg-white border border-gray-200 px-5 py-4 shadow-sm transition-all hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5'

  return (
    <div className={cardCls}>
      <div className={`flex justify-between ${compact ? 'items-center gap-2' : 'items-start gap-3'}`}>
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
                      <span className="text-[11px] font-medium text-secondary tracking-wide uppercase whitespace-nowrap hover:text-secondary-hover transition-colors">
                        {shortDate}
                      </span>
                    )}
                  />
                ) : (
                  <span className="text-[11px] font-medium text-secondary tracking-wide uppercase whitespace-nowrap shrink-0">
                    {shortDate}
                  </span>
                )
              })()}
              {editable ? (
                <InlineEditField
                  value={event.title}
                  onSave={(v) => updateEvent(event.id, { title: v })}
                  className="text-xs font-semibold text-gray-900 truncate"
                  placeholder="Untitled"
                />
              ) : (
                <h3 className="text-xs font-semibold text-gray-900 truncate" title={event.title}>
                  {event.title}
                </h3>
              )}
              {event.flagged && (
                <AlertTriangle size={11} className="text-secondary flex-shrink-0" />
              )}
              {event.people?.map((person) => (
                <Badge key={person} variant="accent" small>
                  {person}
                </Badge>
              ))}
              {event.tags?.map((tag) => (
                <Badge key={tag} variant={tag} small>{tag}</Badge>
              ))}
            </div>
          ) : (
            /* ---- Expanded layout ---- */
            <>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {editable ? (
                  <>
                    {/* Start date picker */}
                    <DatePicker
                      value={event.dateStart || ''}
                      precision={event.datePrecision || 'day'}
                      onChange={(v, p) => updateEvent(event.id, { dateStart: v, datePrecision: p })}
                      renderTrigger={() => (
                        <span className="text-xs font-medium text-secondary tracking-wide uppercase hover:text-secondary-hover transition-colors">
                          {formatSingleDate(event.dateStart, event.datePrecision)}
                        </span>
                      )}
                    />

                    {/* End date: show picker if exists, or "+ end date" button */}
                    {event.dateEnd ? (
                      <>
                        <span className="text-xs text-gray-400">&ndash;</span>
                        <DatePicker
                          value={event.dateEnd}
                          precision={event.datePrecision || 'day'}
                          onChange={(v) => updateEvent(event.id, { dateEnd: v })}
                          renderTrigger={() => (
                            <span className="text-xs font-medium text-secondary tracking-wide uppercase hover:text-secondary-hover transition-colors">
                              {formatSingleDate(event.dateEnd, event.datePrecision)}
                            </span>
                          )}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); updateEvent(event.id, { dateEnd: null }) }}
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
                          <span className="text-[10px] text-gray-400 hover:text-secondary transition-colors">
                            + end date
                          </span>
                        )}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-xs font-medium text-secondary tracking-wide uppercase">
                    {formatEventDate(event)}
                  </span>
                )}
                {event.flagged && (
                  <span className="flex items-center gap-1 text-xs text-flag" title={event.flagReason}>
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
                    className="text-sm font-semibold text-gray-900 mb-1"
                    placeholder="Untitled"
                  />
                  <InlineEditField
                    value={event.description || ''}
                    onSave={(v) => updateEvent(event.id, { description: v })}
                    multiline
                    className="text-sm text-gray-500 leading-relaxed mb-2.5"
                    placeholder="Add a description..."
                  />
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-gray-500 leading-relaxed mb-2.5">{event.description}</p>
                  )}
                </>
              )}

              <div className="flex flex-wrap gap-1.5">
                {event.people?.map((person) => (
                  <Badge key={person} variant="accent">
                    {person}
                  </Badge>
                ))}
                {event.tags?.map((tag) => (
                  <Badge key={tag} variant={tag}>{tag}</Badge>
                ))}
              </div>
            </>
          )}
        </div>

        <div className={`flex ${compact ? 'items-center' : 'flex-col items-end'} gap-2`}>
          {event.photos?.length > 0 && (
            <PhotoStack
              filenames={event.photos}
              onOpen={(i) => setLightboxIndex(i)}
              small={compact}
            />
          )}

          {editable && !compact && (
            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
        </div>
      </div>

      {lightboxIndex !== null && lightboxPhotos.length > 0 &&
        createPortal(
          <PhotoLightbox
            photos={lightboxPhotos}
            currentIndex={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />,
          document.body
        )
      }
    </div>
  )
})

export default EventCard
