import { useState } from 'react'
import { AlertTriangle, MapPin, Pencil, X } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import AnimatedModal from '@/components/shared/AnimatedModal'
import Badge from '@/components/shared/Badge'
import { Button } from '@/components/ui/Button'
import { formatEventDate, formatEventDateShort, getDateRangeDuration, safeGetUTCYear } from '@/utils/dateUtils'
import { getEventColor, getTagPalette } from '@/utils/constants'
import { useResolvedPhotos } from '@/hooks/useResolvedPhotos'
import renderLightbox from '@/hooks/useLightbox'

const EMPTY_PHOTOS = []
const MAX_RELATED = 5

// Events sharing a person or tag, nearest in time first
function findRelatedEvents(event, events) {
  const people = new Set(event.people || [])
  const tags = new Set(event.tags || [])
  const y0 = safeGetUTCYear(event.dateStart, 0)
  return events
    .filter(
      (o) =>
        o.id !== event.id &&
        ((o.people || []).some((p) => people.has(p)) || (o.tags || []).some((t) => tags.has(t)))
    )
    .sort(
      (a, b) =>
        Math.abs(safeGetUTCYear(a.dateStart, 0) - y0) - Math.abs(safeGetUTCYear(b.dateStart, 0) - y0)
    )
    .slice(0, MAX_RELATED)
}

/**
 * Read-only event detail view. Opens from any card click (via the store's
 * detailEvent); editing is an explicit action via the Edit button (main app
 * only — omit onEdit for read-only contexts like the shared view).
 */
export default function EventDetailView({ events = [], onEdit }) {
  const event = useTimelineStore((s) => s.detailEvent)
  const closeEventDetail = useTimelineStore((s) => s.closeEventDetail)
  const openEventDetail = useTimelineStore((s) => s.openEventDetail)
  const setFilters = useTimelineStore((s) => s.setFilters)

  const [lightboxIndex, setLightboxIndex] = useState(null)

  const open = !!event
  const resolvedPhotos = useResolvedPhotos(event?.photos || EMPTY_PHOTOS)
  const lightboxPhotos = resolvedPhotos.filter((p) => p.url)
  const related = open ? findRelatedEvents(event, events) : null
  const duration = open && event.dateStart && event.dateEnd
    ? getDateRangeDuration(event.dateStart, event.dateEnd)
    : null

  // Filter toggles only make sense where the filter sidebar exists (main app)
  const canFilter = !!onEdit

  const filterByPerson = (person) => {
    const { filters } = useTimelineStore.getState()
    if (!filters.people.includes(person)) setFilters({ ...filters, people: [...filters.people, person] })
    closeEventDetail()
  }

  const filterByTag = (tag) => {
    const { filters } = useTimelineStore.getState()
    if (!filters.tags.includes(tag)) setFilters({ ...filters, tags: [...filters.tags, tag] })
    closeEventDetail()
  }

  return (
    <AnimatedModal
      open={open}
      onClose={closeEventDetail}
      label={event ? `Details for ${event.title}` : 'Event details'}
      className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden modal-surface"
    >
      {event && (
        <>
          {lightboxPhotos.length > 0 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="block w-full shrink-0 cursor-zoom-in"
              aria-label="View photo"
            >
              <img src={lightboxPhotos[0].url} alt="" className="w-full h-48 object-cover" />
            </button>
          )}

          <div className="px-6 py-5 overflow-y-auto app-scroll flex-1 min-h-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-serif text-[15px] font-medium text-secondary tabular-nums">
                  {formatEventDate(event)}
                </p>
                <h2 className="text-xl font-semibold text-text-strong leading-snug mt-0.5">
                  {event.title}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={closeEventDetail} aria-label="Close details" className="shrink-0 -mr-2 -mt-1">
                <X size={16} />
              </Button>
            </div>

            {event.flagged && (
              <p className="flex items-center gap-1.5 mt-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle size={12} className="shrink-0" />
                {event.flagReason || 'Date flagged for review'}
              </p>
            )}

            {event.description && (
              <p className="text-sm text-text-default leading-relaxed mt-3">{event.description}</p>
            )}

            {event.location && (
              <p className="flex items-center gap-1.5 mt-3 text-xs text-text-muted">
                <MapPin size={12} className="shrink-0" />
                {event.location}
              </p>
            )}

            {duration && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ backgroundColor: getEventColor(event).dot, opacity: 0.5 }}
                  />
                </div>
                <span className="text-[10px] font-medium text-text-muted whitespace-nowrap">{duration}</span>
              </div>
            )}

            {(event.people?.length > 0 || event.tags?.length > 0) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-4">
                {event.people?.map((person) =>
                  canFilter ? (
                    <button
                      key={person}
                      type="button"
                      onClick={() => filterByPerson(person)}
                      className="cursor-pointer hover:opacity-75 transition-opacity duration-100"
                      aria-label={`Filter timeline by ${person}`}
                    >
                      <Badge variant="accent">{person}</Badge>
                    </button>
                  ) : (
                    <Badge key={person} variant="accent">{person}</Badge>
                  )
                )}
                {event.tags?.map((tag) =>
                  canFilter ? (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => filterByTag(tag)}
                      className="cursor-pointer hover:opacity-75 transition-opacity duration-100"
                      aria-label={`Filter timeline by ${tag}`}
                    >
                      <Badge variant={tag}>{tag}</Badge>
                    </button>
                  ) : (
                    <Badge key={tag} variant={tag}>{tag}</Badge>
                  )
                )}
              </div>
            )}

            {lightboxPhotos.length > 1 && (
              <div className="grid grid-cols-4 gap-1.5 mt-4">
                {lightboxPhotos.slice(1).map((photo, i) => (
                  <button
                    key={photo.name}
                    type="button"
                    onClick={() => setLightboxIndex(i + 1)}
                    className="aspect-square rounded-lg overflow-hidden cursor-zoom-in"
                    aria-label={`View photo ${i + 2}`}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {related?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                  Related events
                </p>
                <div className="space-y-0.5">
                  {related.map((rel) => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => openEventDetail(rel)}
                      className="flex items-baseline gap-2.5 w-full text-left rounded-lg px-2 py-1.5 -mx-2 hover:bg-surface-raised transition-colors duration-150 cursor-pointer"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 self-center"
                        style={{ backgroundColor: rel.tags?.[0] ? getTagPalette(rel.tags[0]).activeBg : 'var(--color-secondary)' }}
                        aria-hidden="true"
                      />
                      <span className="font-serif text-xs text-text-muted tabular-nums whitespace-nowrap shrink-0">
                        {safeGetUTCYear(rel.dateStart, null) ?? formatEventDateShort(rel)}
                      </span>
                      <span className="text-sm text-text-default truncate">{rel.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {onEdit && (
            <div className="px-6 py-3.5 bg-surface-raised border-t border-gray-200 flex justify-end shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  closeEventDetail()
                  onEdit(event)
                }}
              >
                <Pencil size={13} />
                Edit event
              </Button>
            </div>
          )}

          {renderLightbox({ photos: lightboxPhotos, lightboxIndex, setLightboxIndex })}
        </>
      )}
    </AnimatedModal>
  )
}
