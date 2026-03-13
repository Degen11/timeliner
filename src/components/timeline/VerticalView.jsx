import { memo, useMemo, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import { getTagPalette } from '@/utils/constants'
import EventCard from './EventCard'

const stickyHeaderStyle = { backgroundColor: 'var(--color-canvas)' }

// Estimated heights for the virtualizer
const HEADER_HEIGHT = 48
const EVENT_HEIGHT_COMPACT = 52
const EVENT_HEIGHT_NORMAL = 160

// Threshold: only virtualize when the flat item count exceeds this
const VIRTUALIZE_THRESHOLD = 60

const VerticalView = memo(function VerticalView({
  events,
  editable = false,
  compact = false,
  groupZoom = 'year',
  selectedEventIds,
  onToggleSelect,
  onEditEvent,
}) {
  const parentRef = useRef(null)

  const groups = useMemo(
    () => (groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events)),
    [events, groupZoom]
  )

  // Flatten groups into a single list of { type: 'header' | 'event', ... }
  const flatItems = useMemo(() => {
    const items = []
    for (const group of groups) {
      items.push({ type: 'header', year: group.year, count: group.events.length })
      for (const event of group.events) {
        items.push({ type: 'event', event })
      }
    }
    return items
  }, [groups])

  const shouldVirtualize = flatItems.length > VIRTUALIZE_THRESHOLD

  const estimateSize = useCallback(
    (index) => {
      if (flatItems[index].type === 'header') return HEADER_HEIGHT
      return compact ? EVENT_HEIGHT_COMPACT : EVENT_HEIGHT_NORMAL
    },
    [flatItems, compact]
  )

  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? flatItems.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
    enabled: shouldVirtualize,
  })

  // Non-virtualized path for small lists — preserves original YearGroup layout exactly
  if (!shouldVirtualize) {
    return (
      <div className={`flex flex-col ${compact ? 'gap-0' : 'gap-0'}`}>
        {groups.map(({ year, events: yearEvents }) => (
          <div key={year} className="relative pb-2">
            <div
              className={`sticky top-14 z-10 -mx-4 px-4 ${compact ? 'py-1.5' : 'py-2.5'}`}
              style={stickyHeaderStyle}
            >
              <div className="flex items-center gap-3">
                <h2 className={`font-display font-bold text-text-strong ${compact ? 'text-sm' : 'text-lg'}`}>
                  {year}
                </h2>
                <span className="text-[11px] font-medium text-text-muted tabular-nums shrink-0">
                  {yearEvents.length} {yearEvents.length === 1 ? 'event' : 'events'}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-200/50 to-transparent" />
              </div>
            </div>
            <div className={`flex flex-col pl-5 border-l-2 border-gray-200/50 ml-3 overflow-visible ${compact ? 'gap-2 pt-1' : 'gap-5 pt-2'}`}>
              {yearEvents.map((event, i) => {
                const isSelected = selectedEventIds?.includes(event.id)
                return (
                  <div
                    key={event.id}
                    className="relative timeline-card-enter transition-all duration-200"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div
                      className="absolute -left-[27px] top-4 w-2.5 h-2.5 rounded-full ring-2 ring-canvas timeline-dot-enter"
                      aria-hidden="true"
                      style={{
                        backgroundColor: event.tags?.[0] ? getTagPalette(event.tags[0]).activeBg : 'var(--color-secondary)',
                        animationDelay: `${i * 40 + 60}ms`,
                      }}
                    />
                    <div
                      className={`${isSelected ? 'ring-2 ring-secondary/50 rounded-xl' : ''}`}
                      onClick={
                        onToggleSelect
                          ? (e) => {
                              if (e.shiftKey || e.metaKey || e.ctrlKey) {
                                e.preventDefault()
                                window.getSelection()?.removeAllRanges()
                                onToggleSelect(event.id, e)
                              }
                            }
                          : undefined
                      }
                    >
                      <EventCard event={event} editable={editable} compact={compact} isSelected={isSelected} onEdit={onEditEvent} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Virtualized path for large lists
  return (
    <div
      ref={parentRef}
      style={{ height: 'calc(100vh - 8rem)', overflow: 'auto' }}
      className="app-scroll"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = flatItems[virtualRow.index]

          if (item.type === 'header') {
            return (
              <div
                key={`header-${item.year}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className={`${compact ? 'py-1.5' : 'py-2.5'}`}>
                  <div className="flex items-center gap-3">
                    <h2 className={`font-display font-bold text-text-strong ${compact ? 'text-sm' : 'text-lg'}`}>
                      {item.year}
                    </h2>
                    <span className="text-[11px] font-medium text-text-muted tabular-nums shrink-0">
                      {item.count} {item.count === 1 ? 'event' : 'events'}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-200/50 to-transparent" />
                  </div>
                </div>
              </div>
            )
          }

          const event = item.event
          const isSelected = selectedEventIds?.includes(event.id)

          return (
            <div
              key={event.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
            >
              <div className={`pl-5 border-l-2 border-gray-200/50 ml-3 ${compact ? 'py-1' : 'py-2.5'}`}>
                <div className="relative transition-all duration-200">
                  <div
                    className="absolute -left-[27px] top-4 w-2.5 h-2.5 rounded-full ring-2 ring-canvas"
                    aria-hidden="true"
                    style={{
                      backgroundColor: event.tags?.[0] ? getTagPalette(event.tags[0]).activeBg : 'var(--color-secondary)',
                    }}
                  />
                  <div
                    className={`${isSelected ? 'ring-2 ring-secondary/50 rounded-xl' : ''}`}
                    onClick={
                      onToggleSelect
                        ? (e) => {
                            if (e.shiftKey || e.metaKey || e.ctrlKey) {
                              e.preventDefault()
                              window.getSelection()?.removeAllRanges()
                              onToggleSelect(event.id, e)
                            }
                          }
                        : undefined
                    }
                  >
                    <EventCard event={event} editable={editable} compact={compact} isSelected={isSelected} onEdit={onEditEvent} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default VerticalView
