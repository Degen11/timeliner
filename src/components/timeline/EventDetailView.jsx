import { useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { AlertTriangle, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Copy, Check, Pencil, X } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import AnimatedModal from '@/components/shared/AnimatedModal'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { getSortedEvents } from '@/store/selectors'
import { describeGap, formatEventDate, getDateRangeDuration, getRelativeDate, safeGetUTCYear, formatEventDateShort } from '@/utils/dateUtils'
import { SORT_OPTIONS, VIEWS, getEventColor, getTagPalette } from '@/utils/constants'
import { formatEventForClipboard } from '@/utils/exportText'
import { useResolvedPhotos } from '@/hooks/useResolvedPhotos'
import renderLightbox from '@/hooks/useLightbox'

const EMPTY_PHOTOS = []
const MAX_SHARED_PEOPLE_EVENTS = 3
const PRECISION_NOTE = {
  month: 'month only',
  year: 'year only',
  decade: 'decade only',
  approximate: 'approximate',
}

// "Hermann Einstein" → "HE"
const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

function NeighborCard({ event, direction, from, onOpen }) {
  const isBefore = direction === 'before'
  const gap = event ? describeGap(from, event.dateStart) : null
  if (!event) {
    return (
      <div className="flex flex-col justify-center rounded-xl border border-dashed border-gray-200 px-3.5 py-3 text-xs text-text-muted">
        {isBefore ? 'Nothing earlier' : 'Nothing later'}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      aria-label={`${isBefore ? 'Previous' : 'Next'} event: ${event.title}`}
      className="flex min-w-0 flex-col gap-0.5 rounded-xl border border-gray-200 bg-surface-raised px-3.5 py-3 text-left transition-colors duration-150 hover:border-gray-300 hover:bg-soft-accent cursor-pointer"
    >
      <span className={`flex items-center gap-1.5 text-xs text-text-default ${isBefore ? '' : 'justify-end'}`}>
        {isBefore && <ArrowLeft size={12} aria-hidden="true" />}
        {gap ? (gap.startsWith('same') ? gap : `${gap} ${isBefore ? 'earlier' : 'later'}`) : isBefore ? 'Before' : 'After'}
        {!isBefore && <ArrowRight size={12} aria-hidden="true" />}
      </span>
      <span className="truncate font-serif text-[13px] text-text-default">{formatEventDate(event)}</span>
      <span className="truncate text-sm font-semibold text-text-strong">{event.title}</span>
    </button>
  )
}

/**
 * Read-only event detail view. Opens from any card click (via the store's
 * detailEvent); editing is an explicit action via the Edit button (main app
 * only — omit onEdit for read-only contexts like the shared view).
 * `sequence` is the order the timeline shows events in, for prev/next.
 */
export default function EventDetailView({ events = [], sequence, onEdit }) {
  const storedEvent = useTimelineStore((s) => s.detailEvent)
  const closeEventDetail = useTimelineStore((s) => s.closeEventDetail)
  const openEventDetail = useTimelineStore((s) => s.openEventDetail)
  const setFilters = useTimelineStore((s) => s.setFilters)

  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [copied, setCopied] = useState(false)

  const open = !!storedEvent
  // Prefer the live copy so edits made elsewhere show here
  const event = open ? events.find((e) => e.id === storedEvent.id) || storedEvent : null
  const order = open ? sequence || getSortedEvents(events, SORT_OPTIONS.DATE_ASC) : []
  const index = open ? order.findIndex((e) => e.id === event.id) : -1
  const prev = index > 0 ? order[index - 1] : null
  const next = index >= 0 && index < order.length - 1 ? order[index + 1] : null

  const resolvedPhotos = useResolvedPhotos(event?.photos || EMPTY_PHOTOS)
  const lightboxPhotos = resolvedPhotos.filter((p) => p.url)
  const duration = open && event.dateStart && event.dateEnd ? getDateRangeDuration(event.dateStart, event.dateEnd) : null
  const relative = open ? getRelativeDate(event.dateStart) : null
  const precisionNote = open ? PRECISION_NOTE[event.datePrecision] : null

  // Other events with this event's first person, not already shown as neighbors
  const sharedPerson = open ? event.people?.[0] : null
  const sharedEvents = sharedPerson
    ? order
        .filter((e) => e.id !== event.id && e.id !== prev?.id && e.id !== next?.id && e.people?.includes(sharedPerson))
        .slice(0, MAX_SHARED_PEOPLE_EVENTS)
    : []

  // Filters, map and review only make sense in the main app
  const inApp = !!onEdit

  const go = (target) => {
    if (!target) return
    setLightboxIndex(null)
    setCopied(false)
    openEventDetail(target)
  }

  useHotkeys('left', () => go(prev), { enabled: open && lightboxIndex === null }, [prev, lightboxIndex])
  useHotkeys('right', () => go(next), { enabled: open && lightboxIndex === null }, [next, lightboxIndex])

  const filterBy = (key, value) => {
    const { filters } = useTimelineStore.getState()
    if (!filters[key].includes(value)) setFilters({ ...filters, [key]: [...filters[key], value] })
    closeEventDetail()
  }

  const showOnMap = () => {
    useTimelineStore.getState().setActiveView(VIEWS.MAP)
    closeEventDetail()
  }

  const checkDate = () => {
    closeEventDetail()
    useTimelineStore.getState().toggleReviewMode()
  }

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(formatEventForClipboard(event))
      setCopied(true)
      useTimelineStore.getState().showToast('Copied to clipboard', { variant: 'success' })
    } catch {
      useTimelineStore.getState().showToast('Copy failed — clipboard not available', { variant: 'error' })
    }
  }

  const navBtnCls =
    'flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-[9px] border border-gray-200 bg-surface text-text-default transition-colors duration-150 hover:bg-surface-raised hover:text-text-strong disabled:opacity-40 disabled:pointer-events-none cursor-pointer'

  return (
    <AnimatedModal
      open={open}
      onClose={closeEventDetail}
      label={event ? `Details for ${event.title}` : 'Event details'}
      className="bg-surface sm:rounded-2xl shadow-2xl max-w-xl w-full sm:mx-4 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden modal-surface"
    >
      {event && (
        <>
          <div className="flex shrink-0 items-center gap-1 pl-5 sm:pl-6 pr-3 pt-3">
            <span className="flex-1 text-xs text-text-default">
              {index >= 0 && order.length > 1 ? `Event ${index + 1} of ${order.length}` : ''}
            </span>
            {order.length > 1 && (
              <>
                <Tooltip label={prev ? `Previous: ${prev.title}` : 'Nothing earlier'} shortcut="←">
                  <button type="button" onClick={() => go(prev)} disabled={!prev} aria-label={prev ? `Previous event: ${prev.title}` : 'No previous event'} className={navBtnCls}>
                    <ChevronLeft size={16} />
                  </button>
                </Tooltip>
                <Tooltip label={next ? `Next: ${next.title}` : 'Nothing later'} shortcut="→">
                  <button type="button" onClick={() => go(next)} disabled={!next} aria-label={next ? `Next event: ${next.title}` : 'No next event'} className={navBtnCls}>
                    <ChevronRight size={16} />
                  </button>
                </Tooltip>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={closeEventDetail} aria-label="Close details" className="ml-1">
              <X size={16} />
            </Button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 sm:px-6 pt-2 pb-6 app-scroll">
            {lightboxPhotos.length > 0 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="block w-full overflow-hidden rounded-xl cursor-zoom-in"
                aria-label="View photo"
              >
                <img src={lightboxPhotos[0].url} alt="" className="h-52 w-full object-cover" />
              </button>
            )}

            <div className="space-y-1.5">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getEventColor(event).dot }} aria-hidden="true" />
                <span className="font-serif text-[17px] text-text-default tabular-nums">{formatEventDate(event)}</span>
                {(precisionNote || relative) && (
                  <span className="text-xs text-text-muted">
                    {[precisionNote, relative].filter(Boolean).join(' · ')}
                  </span>
                )}
              </p>
              <h2 className="font-serif text-[28px] sm:text-[30px] font-semibold leading-tight text-text-strong">{event.title}</h2>
            </div>

            {event.flagged && (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-[10px] border border-amber-200 bg-amber-50 py-2 pl-3 pr-2 text-[13px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle size={14} className="shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <span className="min-w-0 flex-1">{event.flagReason || 'Date flagged for review'}</span>
                {inApp && (
                  <button type="button" onClick={checkDate} className="h-8 sm:h-7 rounded-[7px] border border-amber-300 bg-surface px-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/15 cursor-pointer">
                    Check date
                  </button>
                )}
              </div>
            )}

            {event.description && <p className="text-base leading-relaxed text-text-strong/90">{event.description}</p>}

            {duration && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full" style={{ backgroundColor: getEventColor(event).dot, opacity: 0.5 }} />
                </div>
                <span className="whitespace-nowrap text-xs font-medium text-text-default">{duration}</span>
              </div>
            )}

            {(event.location || event.people?.length > 0 || event.tags?.length > 0) && (
              <dl className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5 text-sm">
                {event.location && (
                  <>
                    <dt className="text-xs font-semibold text-text-default">Where</dt>
                    <dd className="flex flex-wrap items-center gap-x-2.5 text-text-strong">
                      {event.location}
                      {inApp && (
                        <button type="button" onClick={showOnMap} className="text-xs text-text-default underline underline-offset-2 hover:text-text-strong cursor-pointer">
                          Show on map
                        </button>
                      )}
                    </dd>
                  </>
                )}
                {event.people?.length > 0 && (
                  <>
                    <dt className="text-xs font-semibold text-text-default">Who</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {event.people.map((person) => {
                        const content = (
                          <>
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-soft-accent text-[10px] font-semibold text-text-default dark:bg-surface-raised" aria-hidden="true">
                              {initials(person)}
                            </span>
                            {person}
                          </>
                        )
                        const cls = 'inline-flex h-8 sm:h-7 items-center gap-1.5 rounded-full border border-gray-200 bg-surface pl-1 pr-2.5 text-[13px] text-text-strong'
                        return inApp ? (
                          <button key={person} type="button" onClick={() => filterBy('people', person)} aria-label={`Filter timeline by ${person}`} className={`${cls} hover:bg-surface-raised cursor-pointer`}>
                            {content}
                          </button>
                        ) : (
                          <span key={person} className={cls}>{content}</span>
                        )
                      })}
                    </dd>
                  </>
                )}
                {event.tags?.length > 0 && (
                  <>
                    <dt className="text-xs font-semibold text-text-default">Tags</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {event.tags.map((tag) => {
                        const content = (
                          <>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getTagPalette(tag).activeBg }} aria-hidden="true" />
                            {tag}
                          </>
                        )
                        const cls = 'inline-flex h-8 sm:h-7 items-center gap-1.5 rounded-full border border-gray-200 bg-surface px-2.5 text-[13px] text-text-default'
                        return inApp ? (
                          <button key={tag} type="button" onClick={() => filterBy('tags', tag)} aria-label={`Filter timeline by ${tag}`} className={`${cls} hover:bg-surface-raised cursor-pointer`}>
                            {content}
                          </button>
                        ) : (
                          <span key={tag} className={cls}>{content}</span>
                        )
                      })}
                    </dd>
                  </>
                )}
              </dl>
            )}

            {lightboxPhotos.length > 1 && (
              <div className="grid grid-cols-4 gap-1.5">
                {lightboxPhotos.slice(1).map((photo, i) => (
                  <button
                    key={photo.name}
                    type="button"
                    onClick={() => setLightboxIndex(i + 1)}
                    className="aspect-square overflow-hidden rounded-lg cursor-zoom-in"
                    aria-label={`View photo ${i + 2}`}
                  >
                    <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {order.length > 1 && index >= 0 && (
              <section className="space-y-2 pt-1" aria-label="Before and after">
                <h3 className="text-xs font-semibold text-text-default">Before and after</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <NeighborCard event={prev} direction="before" from={event.dateStart} onOpen={go} />
                  <NeighborCard event={next} direction="after" from={event.dateStart} onOpen={go} />
                </div>
              </section>
            )}

            {sharedEvents.length > 0 && (
              <section className="space-y-1" aria-label={`More with ${sharedPerson}`}>
                <h3 className="text-xs font-semibold text-text-default">More with {sharedPerson}</h3>
                {sharedEvents.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => go(rel)}
                    className="-mx-2 flex w-full items-baseline gap-3 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-surface-raised cursor-pointer"
                  >
                    <span className="w-10 shrink-0 font-serif text-[13px] tabular-nums text-text-default">
                      {safeGetUTCYear(rel.dateStart, null) ?? formatEventDateShort(rel)}
                    </span>
                    <span className="truncate text-sm text-text-strong">{rel.title}</span>
                  </button>
                ))}
              </section>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-surface-raised px-5 sm:px-6 py-3">
            <button
              type="button"
              onClick={copyText}
              className="-ml-2.5 flex h-11 sm:h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-text-default transition-colors duration-150 hover:bg-surface hover:text-text-strong cursor-pointer"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy text'}
            </button>
            <span className="hidden flex-1 text-center text-xs text-text-muted sm:block" aria-hidden="true">
              {order.length > 1 && (
                <>
                  <kbd className="rounded-[5px] border border-gray-300 bg-surface px-1.5 font-sans">←</kbd>{' '}
                  <kbd className="rounded-[5px] border border-gray-300 bg-surface px-1.5 font-sans">→</kbd> to step through
                </>
              )}
            </span>
            <span className="flex-1 sm:hidden" />
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  closeEventDetail()
                  onEdit(event)
                }}
                className="inline-flex h-11 sm:h-9 items-center gap-1.5 rounded-[10px] bg-text-strong px-4 text-sm font-semibold text-canvas shadow-sm transition-opacity duration-150 hover:opacity-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
              >
                <Pencil size={13} />
                Edit
              </button>
            )}
          </div>

          {renderLightbox({ photos: lightboxPhotos, lightboxIndex, setLightboxIndex })}
        </>
      )}
    </AnimatedModal>
  )
}

