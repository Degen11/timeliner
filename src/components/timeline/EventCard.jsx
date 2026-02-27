import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, Pencil, Trash2, Check, X, Image } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import PhotoLightbox from '@/components/shared/PhotoLightbox'
import useTimelineStore from '@/store/useTimelineStore'

function formatEventDate(event) {
  if (!event.dateStart) return event.dateRaw || 'Unknown date'

  const start = parseISO(event.dateStart)
  let formatted

  switch (event.datePrecision) {
    case 'day':
      formatted = format(start, 'MMMM d, yyyy')
      break
    case 'month':
      formatted = format(start, 'MMMM yyyy')
      break
    case 'year':
      formatted = format(start, 'yyyy')
      break
    case 'decade':
      formatted = `${format(start, 'yyyy')}s`
      break
    default:
      formatted = format(start, 'MMMM d, yyyy')
  }

  if (event.dateEnd) {
    const end = parseISO(event.dateEnd)
    const endFormatted =
      event.datePrecision === 'year'
        ? format(end, 'yyyy')
        : format(end, 'MMMM d, yyyy')
    formatted = `${formatted} – ${endFormatted}`
  }

  return formatted
}

function EditableField({ value, onSave, multiline = false }) {
  const [draft, setDraft] = useState(value)

  const handleSave = () => onSave(draft)
  const handleCancel = () => onSave(value)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') handleCancel()
  }

  const cls =
    'w-full rounded border border-accent bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20'

  return (
    <div className="flex items-start gap-1">
      {multiline ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cls}
          rows={2}
          autoFocus
        />
      ) : (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cls}
          autoFocus
        />
      )}
      <button
        onClick={handleSave}
        className="rounded p-1 text-success hover:bg-green-50 cursor-pointer"
        aria-label="Save"
      >
        <Check size={14} />
      </button>
      <button
        onClick={handleCancel}
        className="rounded p-1 text-gray-400 hover:bg-gray-100 cursor-pointer"
        aria-label="Cancel"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// Resolve photo URLs from photoMap (data URLs) or store.photos (blob URLs)
function useResolvedPhotos(filenames) {
  const photoMap = useTimelineStore((s) => s.photoMap)
  const storePhotos = useTimelineStore((s) => s.photos)

  return filenames.map((name) => {
    const dataUrl = photoMap[name]
    if (dataUrl) return { name, url: dataUrl }
    const match = storePhotos.find((p) => p.name === name)
    if (match?.objectUrl) return { name, url: match.objectUrl }
    return { name, url: null }
  })
}

function PhotoStack({ filenames, onOpen }) {
  const all = useResolvedPhotos(filenames)
  const resolved = all.filter((p) => p.url)

  if (resolved.length === 0) {
    // No URLs available — show clickable filename count fallback
    return (
      <div
        className="h-14 w-14 rounded-lg bg-gray-100 flex flex-col items-center justify-center text-xs text-gray-400"
        title={`${filenames.length} photo${filenames.length !== 1 ? 's' : ''} (not loaded)`}
      >
        <Image size={16} />
        <span className="mt-0.5">{filenames.length}</span>
      </div>
    )
  }

  const first = resolved[0]
  const stacked = resolved.length > 1

  return (
    <button
      onClick={() => onOpen(0)}
      className="relative flex-shrink-0 cursor-pointer group/photo"
      title={`${resolved.length} photo${resolved.length !== 1 ? 's' : ''} — click to view`}
    >
      {/* Stacked cards behind */}
      {stacked && (
        <>
          <div className="absolute top-1 left-1 h-14 w-14 rounded-lg bg-gray-200 border border-gray-300" />
          {resolved.length > 2 && (
            <div className="absolute top-0.5 left-0.5 h-14 w-14 rounded-lg bg-gray-300 border border-gray-400" />
          )}
        </>
      )}

      {/* Top image */}
      <div className="relative rounded-lg overflow-hidden border border-gray-200 group-hover/photo:border-accent transition-colors">
        <img
          src={first.url}
          alt={first.name}
          className="h-14 w-14 object-cover"
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

export default function EventCard({ event, compact = false, editable = false }) {
  const [isEditing, setIsEditing] = useState(false)
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

  const lightboxPhotos = useResolvedPhotos(event.photos || []).filter((p) => p.url)

  return (
    <div className="group rounded-xl bg-white border border-gray-200 px-5 py-4 transition-all hover:shadow-md hover:border-gray-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium text-accent/60 tracking-wide uppercase">
              {formatEventDate(event)}
            </span>
            {event.flagged && (
              <span className="flex items-center gap-1 text-xs text-flag" title={event.flagReason}>
                <AlertTriangle size={12} />
                <span className="hidden sm:inline">Flagged</span>
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2 mb-2">
              <div>
                <span className="text-xs text-gray-400">Title</span>
                <EditableField
                  value={event.title}
                  onSave={(v) => {
                    updateEvent(event.id, { title: v })
                    setIsEditing(false)
                  }}
                />
              </div>
              <div>
                <span className="text-xs text-gray-400">Description</span>
                <EditableField
                  value={event.description || ''}
                  multiline
                  onSave={(v) => {
                    updateEvent(event.id, { description: v })
                    setIsEditing(false)
                  }}
                />
              </div>
              <div>
                <span className="text-xs text-gray-400">Start date</span>
                <EditableField
                  value={event.dateStart || ''}
                  onSave={(v) => {
                    updateEvent(event.id, { dateStart: v })
                    setIsEditing(false)
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {event.title}
              </h3>

              {!compact && event.description && (
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
        </div>

        <div className="flex flex-col items-end gap-2">
          {event.photos?.length > 0 && (
            <PhotoStack
              filenames={event.photos}
              onOpen={(i) => setLightboxIndex(i)}
            />
          )}

          {editable && !isEditing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Edit event"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={handleDelete}
                className={`rounded p-1.5 transition-colors cursor-pointer ${
                  confirmDelete
                    ? 'text-error bg-red-50'
                    : 'text-gray-400 hover:text-error hover:bg-red-50'
                }`}
                title={confirmDelete ? 'Click again to confirm' : 'Delete event'}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {editable && confirmDelete && (
        <p className="text-xs text-error mt-2">Click delete again to confirm</p>
      )}

      {lightboxIndex !== null && lightboxPhotos.length > 0 && (
        <PhotoLightbox
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
