import { useState } from 'react'
import { AlertTriangle, MapPin, Pencil, Repeat, Link, FileText, Music, ExternalLink, Copy, Check } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatEventDate, formatEventDateShort, getDateRangeDuration, getRelativeDate } from '@/utils/dateUtils'
import { CARD_STYLE, getTagPalette } from '@/utils/constants'
import { formatEventForClipboard } from '@/utils/exportHelpers'
import SearchHighlight from '@/components/shared/SearchHighlight'
import renderLightbox from '@/hooks/useLightbox'
import { useResolvedPhotos } from '@/hooks/useResolvedPhotos'
import { PhotoPreview, CompactPhotoPreview } from './PhotoPreview'
import useTimelineStore from '@/store/useTimelineStore'

const EMPTY_PHOTOS = []
const EMPTY_FILTER = []

function EventCard({ event, compact = false, editable = false, isSelected = false, onEdit, searchQuery = '' }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [copied, setCopied] = useState(false)

  const resolvedPhotos = useResolvedPhotos(event.photos || EMPTY_PHOTOS)
  const lightboxPhotos = resolvedPhotos.filter((p) => p.url)

  const setFilters = useTimelineStore((s) => s.setFilters)
  const filterPeople = useTimelineStore((s) => s.filters?.people ?? EMPTY_FILTER)
  const filterTags = useTimelineStore((s) => s.filters?.tags ?? EMPTY_FILTER)

  // Active-filter treatment so badges read as toggles, not just links
  const badgeCls = (isActive, isPeople) =>
    `cursor-pointer transition-all duration-100 ${
      isActive
        ? `ring-2 ring-secondary/50 ${isPeople ? 'rounded-lg' : 'rounded-full'}`
        : 'hover:opacity-75'
    }`

  const toggleTagFilter = (tag) => {
    const { filters } = useTimelineStore.getState()
    const tags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    setFilters({ ...filters, tags })
  }

  const togglePersonFilter = (person) => {
    const { filters } = useTimelineStore.getState()
    const people = filters.people.includes(person)
      ? filters.people.filter((p) => p !== person)
      : [...filters.people, person]
    setFilters({ ...filters, people })
  }

  const copyToClipboard = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(formatEventForClipboard(event))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      useTimelineStore.getState().showToast('Copied to clipboard', { variant: 'success' })
    } catch {
      useTimelineStore.getState().showToast('Copy failed — clipboard not available', { variant: 'error' })
    }
  }

  const selectedCls = isSelected ? ' border-secondary/40 bg-secondary/[0.03] selection-glow' : ''
  const cardCls = `group ${CARD_STYLE.base} ${CARD_STYLE.hover} ${CARD_STYLE.transition} ${compact ? 'px-3 py-2.5 sm:px-4' : 'px-4 py-4 sm:px-6 sm:py-5'} active:scale-[0.995] sm:active:scale-100${selectedCls}`

  const handleCardClick = (e) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) return
    if (window.getSelection()?.toString()) return
    if (e.target.closest('[data-no-edit]')) return
    if (editable && onEdit) onEdit(event)
  }

  const handleCardKeyDown = (e) => {
    // Only activate on the card itself — inner buttons handle their own keys
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (editable && onEdit) onEdit(event)
    }
  }

  return (
    <div className={cardCls} onClick={handleCardClick} onKeyDown={editable ? handleCardKeyDown : undefined} role={editable ? 'button' : undefined} tabIndex={editable ? 0 : undefined} style={editable ? { cursor: 'pointer' } : undefined} data-event-card>
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
                <SearchHighlight text={event.title} query={searchQuery} />
              </h3>
              {event.flagged && <AlertTriangle size={12} className="text-flag flex-shrink-0" />}
              {event.people?.map((person) => (
                <button
                  key={person}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); togglePersonFilter(person) }}
                  className={badgeCls(filterPeople.includes(person), true)}
                  aria-label={`Filter by ${person}`}
                  aria-pressed={filterPeople.includes(person)}
                >
                  <Badge variant="accent" small>{person}</Badge>
                </button>
              ))}
              {event.tags?.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleTagFilter(tag) }}
                  className={badgeCls(filterTags.includes(tag), false)}
                  aria-label={`Filter by ${tag}`}
                  aria-pressed={filterTags.includes(tag)}
                >
                  <Badge variant={tag} small>{tag}</Badge>
                </button>
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
                {(() => {
                  const relative = getRelativeDate(event.dateStart)
                  if (!relative) return null
                  return (
                    <span className="text-[11px] text-text-muted font-normal normal-case">
                      ({relative})
                    </span>
                  )
                })()}
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

              <h3 className="text-sm font-semibold text-text-strong mb-1" title={event.title}>
                <SearchHighlight text={event.title} query={searchQuery} />
              </h3>
              {event.description && (
                <p className="text-sm text-text-default leading-relaxed mb-2.5">
                  <SearchHighlight text={event.description} query={searchQuery} />
                </p>
              )}

              {event.location && (
                <div className="flex items-center gap-1 text-xs text-text-muted mb-2">
                  <MapPin size={12} className="text-text-muted shrink-0" />
                  <span className="truncate" title={event.location}>{event.location}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                {event.recurrence && (
                  <span className="flex items-center gap-1 text-xs text-secondary" title={`Repeats ${event.recurrence.type}`}>
                    <Repeat size={12} />
                    <span className="capitalize">{event.recurrence.type}</span>
                  </span>
                )}
                {event.people?.map((person) => (
                  <button
                    key={person}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePersonFilter(person) }}
                    className={badgeCls(filterPeople.includes(person), true)}
                    aria-label={`Filter by ${person}`}
                    aria-pressed={filterPeople.includes(person)}
                  >
                    <Badge variant="accent">{person}</Badge>
                  </button>
                ))}
                {(() => {
                  const tags = event.tags || []
                  const MAX_VISIBLE = 6
                  const visible = tags.length > MAX_VISIBLE ? tags.slice(0, MAX_VISIBLE - 1) : tags
                  const hidden = tags.length > MAX_VISIBLE ? tags.slice(MAX_VISIBLE - 1) : []
                  return (
                    <>
                      {visible.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleTagFilter(tag) }}
                          className={badgeCls(filterTags.includes(tag), false)}
                          aria-label={`Filter by ${tag}`}
                          aria-pressed={filterTags.includes(tag)}
                        >
                          <Badge variant={tag}>{tag}</Badge>
                        </button>
                      ))}
                      {hidden.length > 0 && (
                        <Tooltip label={hidden.join(', ')} side="top" delayDuration={200}>
                          <span>
                            <Badge variant="default">+{hidden.length}</Badge>
                          </span>
                        </Tooltip>
                      )}
                    </>
                  )
                })()}
              </div>

              {event.attachments?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {event.attachments.map((att, i) => {
                    const Icon = att.type === 'audio' ? Music : att.type === 'document' ? FileText : Link
                    return (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-secondary hover:text-secondary/80 bg-secondary/5 rounded-md px-2 py-1 transition-colors"
                        data-no-edit
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon size={11} />
                        <span className="truncate max-w-[120px]">{att.label || 'Link'}</span>
                        <ExternalLink size={10} className="shrink-0 opacity-50" />
                      </a>
                    )
                  })}
                </div>
              )}

              {event.dateStart && event.dateEnd && (() => {
                const duration = getDateRangeDuration(event.dateStart, event.dateEnd)
                if (!duration) return null
                const tagColor = event.tags?.[0]
                  ? getTagPalette(event.tags[0])
                  : null
                return (
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: tagColor?.activeBg || 'var(--color-secondary)',
                          opacity: 0.5,
                          width: '100%',
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-text-muted whitespace-nowrap">
                      {duration}
                    </span>
                  </div>
                )
              })()}
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
              <Tooltip label="Edit event">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(event)
                  }}
                  className="rounded-lg p-2.5 sm:p-1.5 text-text-muted hover:text-secondary hover:bg-soft-accent active:bg-soft-accent active:text-secondary sm:hover:scale-110 transition-all duration-150 cursor-pointer touch-target"
                  aria-label="Edit event"
                >
                  <Pencil size={14} />
                </button>
              </Tooltip>
            </div>
          )}
          {!compact && (
            <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
              <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'}>
                <button
                  onClick={copyToClipboard}
                  className={`rounded-lg p-2.5 sm:p-1.5 sm:hover:scale-110 transition-all duration-150 cursor-pointer touch-target ${copied ? 'text-success' : 'text-text-muted hover:text-secondary hover:bg-soft-accent active:bg-soft-accent active:text-secondary'}`}
                  aria-label={copied ? 'Event copied to clipboard' : 'Copy event to clipboard'}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </Tooltip>
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

      {renderLightbox({ photos: lightboxPhotos, lightboxIndex, setLightboxIndex })}
    </div>
  )
}

export default EventCard
