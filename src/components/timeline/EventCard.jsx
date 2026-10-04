import { useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { AlertTriangle, MapPin, Pencil, Repeat, Link, FileText, Music, ExternalLink, Copy, Check, Flag, Trash2, MoreHorizontal, User } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu'
import { formatPeopleList } from '@/utils/ui'
import { formatEventDate, formatEventDateShort, getDateRangeDuration, getRelativeDate } from '@/utils/dateUtils'
import { CARD_STYLE, CAN_HOVER, SWIPE_ACTION_PX, getEventColor, getTagPalette, SPRING, isSafeLinkUrl } from '@/utils/constants'
import { haptic } from '@/utils/haptics'
import { formatEventForClipboard } from '@/utils/exportText'
import SearchHighlight from '@/components/shared/SearchHighlight'
import renderLightbox from '@/hooks/useLightbox'
import { useResolvedPhotos } from '@/hooks/useResolvedPhotos'
import { PhotoPreview, CompactPhotoPreview } from './PhotoPreview'
import useTimelineStore from '@/store/useTimelineStore'

const EMPTY_PHOTOS = []
const EMPTY_FILTER = []

function EventCard({ event, compact = false, editable = false, swipeable = false, isSelected = false, onEdit, searchQuery = '' }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [copied, setCopied] = useState(false)

  const resolvedPhotos = useResolvedPhotos(event.photos || EMPTY_PHOTOS)
  const lightboxPhotos = resolvedPhotos.filter((p) => p.url)

  const setFilters = useTimelineStore((s) => s.setFilters)
  const filterPeople = useTimelineStore((s) => s.filters?.people ?? EMPTY_FILTER)
  const filterTags = useTimelineStore((s) => s.filters?.tags ?? EMPTY_FILTER)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)

  const openReview = (e) => {
    e.stopPropagation()
    toggleReviewMode()
  }

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

  const selectedCls = isSelected ? ' border-highlight/50 bg-highlight/[0.04] selection-glow' : ''
  const cardCls = `group ${CARD_STYLE.base} ${CARD_STYLE.hover} ${CARD_STYLE.transition} ${compact ? 'px-3 py-2.5 sm:px-4' : 'px-4 py-4 sm:px-6 sm:py-5'} active:scale-[0.995] sm:active:scale-100${selectedCls}`

  // Card click opens the read-only detail view; editing is the pencil (or the
  // Edit button inside the detail view)
  const openEventDetail = useTimelineStore((s) => s.openEventDetail)

  // Touch swipe: left deletes (with the usual undo toast), right toggles the flag
  const swipeEnabled = swipeable && editable && !CAN_HOVER
  const swipeX = useMotionValue(0)
  const flagHintOpacity = useTransform(swipeX, [0, SWIPE_ACTION_PX], [0, 1])
  const deleteHintOpacity = useTransform(swipeX, [-SWIPE_ACTION_PX, 0], [1, 0])
  const wasSwiped = useRef(false)

  const handleSwipeEnd = (_e, info) => {
    const { deleteEvent, updateEvent, showToast } = useTimelineStore.getState()
    if (info.offset.x <= -SWIPE_ACTION_PX) {
      haptic('heavy')
      deleteEvent(event.id)
    } else if (info.offset.x >= SWIPE_ACTION_PX) {
      haptic('medium')
      if (event.flagged) {
        updateEvent(event.id, { flagged: false, flagReason: null })
        showToast('Flag removed')
      } else {
        updateEvent(event.id, { flagged: true, flagReason: 'Flagged for review' })
        showToast('Flagged for review')
      }
    }
  }

  const handleCardClick = (e) => {
    // A swipe ends with a click; swallow it so it doesn't open the detail view
    // or toggle selection in the wrapping view
    if (wasSwiped.current) {
      wasSwiped.current = false
      e.stopPropagation()
      return
    }
    if (e.shiftKey || e.metaKey || e.ctrlKey) return
    if (window.getSelection()?.toString()) return
    if (e.target.closest('[data-no-edit]')) return
    openEventDetail(event)
  }

  const handleCardKeyDown = (e) => {
    // Only activate on the card itself — inner buttons handle their own keys
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openEventDetail(event)
    }
  }

  // Tag-color edge ties the card to its timeline dot
  const cardStyle = {
    borderLeftWidth: 3,
    borderLeftColor: getEventColor(event).dot,
    cursor: 'pointer',
  }

  const card = (
    <motion.div
      className={cardCls}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${event.title}`}
      style={swipeEnabled ? { ...cardStyle, x: swipeX } : cardStyle}
      data-event-card
      {...(swipeEnabled && {
        drag: 'x',
        dragDirectionLock: true,
        dragSnapToOrigin: true,
        dragElastic: 0.6,
        onPointerDown: () => { wasSwiped.current = false },
        onDragStart: () => { wasSwiped.current = true },
        onDragEnd: handleSwipeEnd,
      })}
    >
      {!compact && lightboxPhotos.length > 0 && (
        <div className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-5 mb-4 overflow-hidden rounded-t-xl" data-no-edit>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex(0)
            }}
            className="block w-full cursor-zoom-in"
            aria-label="View photo"
          >
            <img
              src={lightboxPhotos[0].url}
              alt=""
              className="w-full h-44 sm:h-52 object-cover"
              loading="lazy"
            />
          </button>
        </div>
      )}
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
                  <span className="font-serif text-sm font-medium text-secondary tabular-nums whitespace-nowrap shrink-0">
                    {shortDate}
                  </span>
                )
              })()}
              <h3 className="text-sm font-semibold text-text-strong truncate" title={event.title}>
                <SearchHighlight text={event.title} query={searchQuery} />
              </h3>
              {event.flagged && (
                <Tooltip label={event.flagReason ? `${event.flagReason} — click to review` : 'Click to review'}>
                  <button
                    type="button"
                    data-no-edit
                    onClick={openReview}
                    className="flex-shrink-0 text-flag hover:text-flag/80 transition-colors cursor-pointer"
                    aria-label={`Flagged: ${event.flagReason || 'ambiguous date'}. Click to review.`}
                  >
                    <AlertTriangle size={12} />
                  </button>
                </Tooltip>
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
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-serif text-[15px] font-medium text-secondary tabular-nums">
                  {formatEventDate(event)}
                </span>
                {(() => {
                  const relative = getRelativeDate(event.dateStart)
                  if (!relative) return null
                  // Keep every card quiet: reveal the relative date on hover (always visible on touch devices)
                  return (
                    <span className="text-[11px] text-text-muted font-normal normal-case [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-150">
                      ({relative})
                    </span>
                  )
                })()}
                {event.flagged && (
                  <Tooltip label={event.flagReason ? `${event.flagReason} — click to review` : 'Click to review'}>
                    <button
                      type="button"
                      data-no-edit
                      onClick={openReview}
                      className="flex items-center gap-1 text-xs text-flag hover:text-flag/80 hover:underline underline-offset-2 transition-colors cursor-pointer"
                      aria-label={`Flagged: ${event.flagReason || 'ambiguous date'}. Click to review.`}
                    >
                      <AlertTriangle size={12} />
                      <span className="hidden sm:inline">Flagged</span>
                    </button>
                  </Tooltip>
                )}
              </div>

              <h3 className="text-base font-semibold text-text-strong leading-snug mb-1" title={event.title}>
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
                {/* Phones: one quiet line instead of a stack of person chips */}
                {event.people?.length > 0 && (
                  <span className="sm:hidden flex items-center gap-1 min-w-0 max-w-full text-[13px] text-text-default">
                    <User size={12} className="shrink-0 text-text-muted" aria-hidden="true" />
                    <span className="truncate">{formatPeopleList(event.people)}</span>
                  </span>
                )}
                {event.people?.map((person) => (
                  <button
                    key={person}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePersonFilter(person) }}
                    className={`hidden sm:inline-flex ${badgeCls(filterPeople.includes(person), true)}`}
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
                        href={isSafeLinkUrl(att.url) ? att.url : undefined}
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

          {/* Phones: one actions menu instead of stacked edit/copy icons */}
          {!compact && (
            <div className="sm:hidden -mr-2.5 -mt-2.5" data-no-edit onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Actions for ${event.title}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted active:bg-soft-accent active:text-text-default transition-colors duration-150 cursor-pointer"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px]">
                  {editable && (
                    <DropdownMenuItem onSelect={() => onEdit?.(event)}>
                      <Pencil size={14} className="text-text-muted" />
                      <span className="flex-1">Edit</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={copyToClipboard}>
                    <Copy size={14} className="text-text-muted" />
                    <span className="flex-1">Copy text</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {editable && !compact && (
            <div className="hidden sm:block opacity-100 [@media(hover:hover)]:opacity-40 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100 transition-all duration-200">
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
            <div className="hidden sm:block opacity-100 [@media(hover:hover)]:opacity-40 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100 transition-all duration-200">
              <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'}>
                <button
                  onClick={copyToClipboard}
                  className={`rounded-lg p-2.5 sm:p-1.5 sm:hover:scale-110 transition-all duration-150 cursor-pointer touch-target ${copied ? 'text-success' : 'text-text-muted hover:text-secondary hover:bg-soft-accent active:bg-soft-accent active:text-secondary'}`}
                  aria-label={copied ? 'Event copied to clipboard' : 'Copy event to clipboard'}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={copied ? 'check' : 'copy'}
                      initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
                      transition={SPRING.BOUNCY}
                      className="inline-flex"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      {!compact && event.photos?.length > 0 && lightboxPhotos.length !== 1 && (
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
    </motion.div>
  )

  if (!swipeEnabled) return card

  return (
    <div className="relative">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 flex items-center rounded-xl bg-flag/15 px-5 text-flag"
        style={{ opacity: flagHintOpacity }}
      >
        <Flag size={18} />
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-end rounded-xl bg-error/15 px-5 text-error"
        style={{ opacity: deleteHintOpacity }}
      >
        <Trash2 size={18} />
      </motion.div>
      {card}
    </div>
  )
}

export default EventCard
